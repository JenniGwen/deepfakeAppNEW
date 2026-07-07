import { ActivityIcon, Inbox, Lock, Scan } from "lucide-react";
import { useState, useEffect } from "react"; 
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Analysis() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateScan = location.state;
  
  const [displayAnalyses, setDisplayAnalyses] = useState([]); // Removed hardcoded fallback
  const [summaryData, setSummaryData] = useState({
    avg_confidence: 0,
    avg_processing_time: 3.0,
    detected_fakes: 0,
    today_scans: 0
  });

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const token = localStorage.getItem('token'); 
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        // Mengambil limit=20 sesuai permintaan
        const [historyRes, summaryRes] = await Promise.all([
            fetch(`${apiUrl}/api/statistics/history?page=1&limit=20`, { method: 'GET', headers }),
            fetch(`${apiUrl}/api/statistics/summary`, { method: 'GET', headers })
        ]);

        if (summaryRes.ok) {
            const sumData = await summaryRes.json();
            if (sumData.data) setSummaryData(sumData.data);
        }

        if (historyRes.ok) {
            const histData = await historyRes.json();
            if (histData.data && histData.data.items) {
                const mappedItems = histData.data.items.map(item => ({
                    file: item.file_name,
                    url: item.url_file || null,
                    result: item.result,
                    confidence: `${item.confidence_score}%`,
                    date: new Date(item.created_at).toISOString().slice(0, 16).replace('T', ' ')
                }));
                setDisplayAnalyses(mappedItems);
            }
        }
      } catch (error) {
        console.error("Error fetching analysis data:", error);
      }
    };
    
    fetchAnalysisData();
  }, []);

  // Use values from summaryData primarily
  const totalScans = summaryData.today_scans;
  const detectedFakes = summaryData.detected_fakes;
  const avgConfidence = `${summaryData.avg_confidence}%`;
  const processingTime = summaryData.avg_processing_time ? `${summaryData.avg_processing_time}s` : '3.0s';

  // 4. Build the new dynamic array for the UI
  const dynamicStats = [
    { key: "todaysScans", value: totalScans, accent: "text-white", icon: "↗", iconColor: "text-green-400" },
    { key: "detectedFakes", value: detectedFakes, accent: "text-white", icon: "⊙", iconColor: "text-red-400" },
    { key: "avgConfidence", value: avgConfidence, accent: "text-blue-400", icon: null },
    { key: "processingTime", value: processingTime, accent: "text-white", icon: null }, 
  ];

  return (
    <div className="flex min-h-screen bg-transparent transition-colors duration-300">
      {/* Main */}
      <main className={`flex-1 flex flex-col gap-6 px-4 md:px-10 py-6 md:py-8 w-full max-w-[100vw] overflow-x-hidden relative ${!user ? 'overflow-y-hidden h-full max-h-[100vh]' : ''}`}>
        
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
        {/* Header */}
        <header className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1e2538]">
          <span className="text-cyan-500 dark:text-cyan-400 text-3xl"><ActivityIcon size={30}/></span>
          <div>
            <h1 className="text-lg lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{t('analysis.title')}</h1>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">{t('analysis.subtitle')}</p>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {dynamicStats.map(({ key, value, accent, icon, iconColor }) => (
            <div key={key} className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-4 py-4 lg:px-6 lg:py-5 shadow-sm">
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs xl:text-sm font-medium truncate">{t(`analysis.${key}`)}</span>
                {icon && <span className={`text-[12px] lg:text-lg ${iconColor}`}>{icon}</span>}
              </div>
              <div className={`text-[22px] sm:text-2xl lg:text-3xl font-bold ${accent.replace('text-white', 'text-slate-800 dark:text-white').replace('text-blue-400', 'text-blue-600 dark:text-blue-400')}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Recent Analyses Visual Layout */}
        <section className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl p-7 flex-1 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">{t('analysis.recentAnalyses', 'Recent Analyses')}</h2>

          <div className="flex-1 flex flex-col">
            {(displayAnalyses.length === 0 && !stateScan) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-10">
                <Inbox size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
                <p className="font-medium text-sm">{t('analysis.emptySession', 'No recent analyses found.')}</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 h-full">
                {/* Center / Latest Scan */}
                {(() => {
                  // Determine the latest scan to show in the big center
                  let latest = null;
                  let others = [];
                  
                  if (stateScan) {
                    latest = {
                      file: stateScan.fileName,
                      url: stateScan.scanImage,
                      result: stateScan.scanResult?.result || "Unknown",
                      confidence: `${stateScan.scanResult?.probability || 0}%`,
                    };
                    others = displayAnalyses.slice(0, 4); // Take up to 4 for grid
                  } else if (displayAnalyses.length > 0) {
                    latest = displayAnalyses[0];
                    others = displayAnalyses.slice(1, 5);
                  }

                  if (!latest) return null;

                  return (
                    <>
                      <div className="w-full lg:w-3/5 relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-[#1e2538] min-h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                        {latest.url ? (
                            <img src={latest.url} alt={latest.file} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-slate-400"><Scan size={48} /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-end p-6 md:p-8">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-white/80 text-sm font-medium mb-1 truncate max-w-[200px] md:max-w-[300px]">{latest.file}</p>
                              <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${latest.result === 'Real' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                  {latest.result}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white/80 text-sm font-medium mb-1">{t('analysis.confidence', 'Confidence')}</p>
                              <p className="text-white text-4xl md:text-5xl font-bold tracking-tight">{latest.confidence}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2x2 Grid for Previous Scans */}
                      {others.length > 0 && (
                        <div className="w-full lg:w-2/5 grid grid-cols-2 grid-rows-2 gap-4 h-full min-h-[300px]">
                          {others.map((scan, index) => (
                            <div key={index} className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-[#1e2538] bg-slate-50 dark:bg-slate-800">
                              {scan.url ? (
                                <img src={scan.url} alt={scan.file} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><Scan size={24} /></div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex flex-col justify-end p-3 sm:p-4">
                                <p className="text-white/80 text-[10px] sm:text-xs truncate mb-1">{scan.file}</p>
                                <div className="flex justify-between items-center">
                                  <span className={`text-xs font-bold ${scan.result === 'Real' ? 'text-green-400' : 'text-red-400'}`}>
                                    {scan.result}
                                  </span>
                                  <span className="text-white font-semibold text-sm">{scan.confidence}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </section>

        {/* Help Button */}
        <div className="flex justify-end">
          <button className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1e2538] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 text-sm font-bold transition-colors cursor-pointer shadow-sm">
            ?
          </button>
        </div>
      </main>
    </div>
  );
}