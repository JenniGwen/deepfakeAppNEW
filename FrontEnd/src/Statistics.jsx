import { BarChart3, CheckCircle, AlertTriangle, TrendingUpIcon } from 'lucide-react'
import { useState, useEffect } from 'react'; // 1. We need our React tools!
import { useTranslation } from 'react-i18next';

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

const MIDDLEPART = [
    { key: "detectionTrends", icon: BarChart3 },
    { key: "confidenceDistribution", icon: BarChart3}
];

// NOTICE: The hardcoded STATS array has been deleted from here!

export default function Statistics(){
    const { t } = useTranslation();
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
                    fetch(`${apiUrl}/api/statistics/history?page=1&limit=20`, { method: 'GET', headers }),
                    fetch(`${apiUrl}/api/statistics/summary`, { method: 'GET', headers })
                ]);

                if (historyRes.ok) {
                    const result = await historyRes.json();
                    const fetchedHistory = Array.isArray(result.data) 
                        ? result.data 
                        : (result.data?.data || result.data?.history || []);
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
            icon: AlertTriangle, 
            iconColor: "text-red-400", 
            text: `${realPercent}% ${t('statistics.ofTotal')}` 
        },
        { 
            key: "fakeImages", 
            value: fakeCount, 
            icon: TrendingUpIcon, 
            iconColor: "text-blue-400", 
            text: `${fakePercent}% ${t('statistics.ofTotal')}` 
        }
    ];

    return(
        <div className="flex min-h-screen bg-transparent transition-colors duration-300">
            <main className="flex-1 flex flex-col gap-6 px-10 py-8">
                <header className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1e2538]">
                    <span className="text-cyan-500 dark:text-cyan-400 text-3xl"><BarChart3 size={30}/></span>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{t('statistics.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">{t('statistics.subtitle')}</p>
                    </div>
                </header>

                {/* The 4 top cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {dynamicStats.map(({key, value, icon:Icon, iconColor, text}) =>(
                        <div key={key} className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-6 py-5 shadow-sm">
                            <div className="flex gap-3 items-center">
                                <div className='p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10'>
                                    {Icon && <Icon className={`${iconColor.replace('text-blue-400', 'text-blue-600 dark:text-blue-400')} `} size={20} />}
                                </div>
                                <span className="text-slate-500 dark:text-slate-500 text-sm">{t(`statistics.${key}`)}</span>
                            </div>
                            <div className={`text-3xl font-bold text-slate-800 dark:text-slate-200 pt-3`}>{value}</div>
                            <div className={'text-xs text-slate-400 dark:text-slate-400 font-sans pt-1'}>{text}</div>
                        </div>
                    ))}
                </div>

                {/* --- The rest of your code remains EXACTLY the same --- */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4'>
                    {MIDDLEPART.map(({ key, icon:Icon }) => (
                        <div key={key} className='bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-6 py-5 shadow-sm'>
                            <div className='text-slate-800 dark:text-slate-400 text-lg font-bold pb-3'>{t(`statistics.${key}`)}</div>
                            <div className='flex flex-col border-2 dark:border-3 border-slate-200 dark:border-[#1e2538] border-dashed rounded-2xl px-6 py-20 items-center justify-center bg-slate-50 dark:bg-transparent'>
                                {Icon && <Icon className="text-slate-400 dark:text-slate-400" size={50}/>}
                                <p className='pt-3 text-sm text-slate-500 dark:text-slate-700'>{t('statistics.chartPlaceholder')}</p>
                            </div>
                        </div>
                    ))}
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