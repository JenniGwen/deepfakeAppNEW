import { BarChart3, CheckCircle, AlertTriangle, TrendingUpIcon, Lock } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'; // 1. We need our React tools!
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PERFORMANCE_METRICS = [
  { 
    key: "processingSpeed", 
    value: "2.8s avg", 
    width: "75%", 
    color: "bg-gradient-to-r from-blue-500 to-cyan-400" 
  },
  { 
    key: "detectionRate", 
    value: "98.4%", 
    width: "98%", 
    color: "bg-gradient-to-r from-green-400 to-emerald-400" 
  },
  { 
    key: "systemUptime", 
    value: "99.9%", 
    width: "100%", 
    color: "bg-gradient-to-r from-cyan-400 to-blue-500" 
  }
];



// NOTICE: The hardcoded STATS array has been deleted from here!

export default function Statistics(){
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [scanHistory, setScanHistory] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStatisticsAndSummary = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
                const token = localStorage.getItem('token'); 
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                };

                // Fetch history and summary concurrently
                const [historyRes, summaryRes] = await Promise.all([
                    fetch(`${apiUrl}/api/statistics/history?page=1&limit=100`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/api/statistics/summary`, { method: 'GET', headers })
                ]);

                if (historyRes.ok) {
                    const result = await historyRes.json();
                    const fetchedHistory = Array.isArray(result.data) 
                        ? result.data 
                        : (result.data?.items || result.data?.data || result.data?.history || []);
                    setScanHistory(fetchedHistory);
                } else {
                    fallbackToLocal();
                }

                if (summaryRes.ok) {
                    const sumResult = await summaryRes.json();
                    setSummaryData(sumResult.data);
                }

            } catch (error) {
                console.error("Error fetching statistics:", error);
                fallbackToLocal();
            } finally {
                setIsLoading(false);
            }
        };

        const fallbackToLocal = () => {
            const savedHistory = JSON.parse(localStorage.getItem('synthScanHistory'));
            if (savedHistory && savedHistory.length > 0) {
                setScanHistory(savedHistory);
            }
        };

        fetchStatisticsAndSummary();
    }, []);

    // ==========================================
    // THE REAL-TIME MATH ENGINE
    // ==========================================
    const totalScans = summaryData ? summaryData.today_scans : scanHistory.length;
    const fakeCount = summaryData ? summaryData.detected_fakes : scanHistory.filter((item) => item.result === "Fake" || item.result === "Deepfake").length;
    // Calculate real based on total - fake, otherwise fallback to array filter
    const realCount = summaryData 
        ? Math.max(0, totalScans - fakeCount) 
        : scanHistory.filter((item) => item.result === "Real").length;

    // Calculate the percentages (Preventing "division by zero" if the vault is empty!)
    const realPercent = totalScans > 0 ? Math.round((realCount / totalScans) * 100) : 0;
    const fakePercent = totalScans > 0 ? Math.round((fakeCount / totalScans) * 100) : 0;

    // Use avg_confidence if available, otherwise keep static/calculate
    const avgConfidenceStr = summaryData?.avg_confidence ? `${summaryData.avg_confidence}%` : "98.4%";

    // Helper to generate last 7 days
    const generateLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                date: d.toISOString().split('T')[0],
                displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                real: 0,
                fake: 0,
                totalConfidence: 0,
                scanCount: 0,
                avgConfidence: 0
            });
        }
        return days;
    };

    const trendData = useMemo(() => {
        const days = generateLast7Days();
        
        scanHistory.forEach(item => {
           if(!item.created_at) return;
           const dateStr = item.created_at.split('T')[0];
           const dayObj = days.find(d => d.date === dateStr);
           if (dayObj) {
               if (item.result === "Real") dayObj.real += 1;
               else dayObj.fake += 1;
               
               dayObj.totalConfidence += (item.confidence_score || 0);
               dayObj.scanCount += 1;
           }
        });

        // Calculate averages
        days.forEach(day => {
           if (day.scanCount > 0) {
               day.avgConfidence = parseFloat((day.totalConfidence / day.scanCount).toFixed(1));
           }
        });

        return days;
    }, [scanHistory]);

    // 4. Build the dynamic array right before React draws the screen
    const dynamicStats = [
        { 
            key: "imagesAnalyzed", 
            value: totalScans, 
            icon: BarChart3, 
            iconColor: "text-blue-400", 
            text: t('statistics.allTimeRecords')
        },
        { 
            key: "accuracy", 
            value: avgConfidenceStr, 
            icon: CheckCircle, 
            iconColor: "text-green-400", 
            text: t('statistics.basedOnDataset')
        },
        { 
            key: "realImages", 
            value: realCount, 
            icon: TrendingUpIcon, 
            iconColor: "text-blue-400", 
            text: `${realPercent}% ${t('statistics.ofTotal')}` 
        },
        { 
            key: "fakeImages", 
            value: fakeCount, 
            icon: AlertTriangle, 
            iconColor: "text-red-400", 
            text: `${fakePercent}% ${t('statistics.ofTotal')}` 
        }
    ];

    return(
        <div className="flex min-h-screen bg-transparent transition-colors duration-300">
            <main className={`flex-1 flex flex-col gap-6 px-4 lg:px-10 py-8 relative ${!user ? 'overflow-y-hidden h-full max-h-[100vh]' : ''}`}>
                
                {/* Unauthenticated Overlay */}
                {!user && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-50/50 dark:bg-[#0f1117]/60 backdrop-blur-md">
                     <div className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] flex flex-col items-center text-center p-8 max-w-sm w-full mx-4 rounded-2xl shadow-xl">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-5">
                          <Lock className="text-blue-600 dark:text-blue-400" size={28} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('analysis.lockedTitle')}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                          {t('analysis.lockedMessage')}
                        </p>
                        <button 
                          onClick={() => navigate('/login')}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer shadow-md"
                        >
                          {t('analysis.loginNow')}
                        </button>
                     </div>
                  </div>
                )}
                <header className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1e2538]">
                    <span className="text-cyan-500 dark:text-cyan-400 text-3xl"><BarChart3 size={30}/></span>
                    <div>
                        <h1 className="text-lg lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{t('statistics.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">{t('statistics.subtitle')}</p>
                    </div>
                </header>

                {/* The 4 top cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    {dynamicStats.map(({key, value, icon:Icon, iconColor, text}) =>(
                        <div key={key} className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-4 py-4 lg:px-6 lg:py-5 shadow-sm">
                            <div className="flex gap-2 lg:gap-3 items-center">
                                <div className='p-1.5 lg:p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10'>
                                    {Icon && <Icon className={`${iconColor.replace('text-blue-400', 'text-blue-600 dark:text-blue-400')} `} size={18} />}
                                </div>
                                <span className="text-slate-500 dark:text-slate-500 text-[11px] sm:text-xs xl:text-sm font-medium truncate">{t(`statistics.${key}`)}</span>
                            </div>
                            <div className={`text-[22px] sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-200 pt-3 md:pt-4`}>{value}</div>
                            <div className={'text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-sans pt-1'}>{text}</div>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                    <div className='bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-6 py-5 shadow-sm'>
                        <div className='text-slate-800 dark:text-slate-400 text-lg font-bold pb-4'>{t('statistics.detectionTrends')}</div>
                        <div className='h-[250px] w-full'>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Line type="monotone" name="Real" dataKey="real" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" name="Fake" dataKey="fake" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className='bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-6 py-5 shadow-sm'>
                        <div className='text-slate-800 dark:text-slate-400 text-lg font-bold pb-4'>{t('statistics.confidenceDistribution')}</div>
                        <div className='h-[250px] w-full'>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                        formatter={(value) => [`${value}%`, `Avg Confidence (${avgConfidenceStr})`]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Line type="monotone" name={`Avg Confidence (${avgConfidenceStr})`} dataKey="avgConfidence" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-6 py-5 shadow-sm">
                    <h2 className='text-slate-800 dark:text-slate-400 font-bold'>{t('statistics.performanceMatrix')}</h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8'>
                        {PERFORMANCE_METRICS.map(({key, value, width, color}) => (
                            <div key={key} className='flex flex-col gap-3'>
                                <div className="flex justify-between items-center text-sm pt-3">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t(`statistics.${key}`)}</span>
                                    <span className="text-slate-800 dark:text-white font-bold">{value}</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-[#1e2538] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${color}`} 
                                        style={{ width: width }} 
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    )
}