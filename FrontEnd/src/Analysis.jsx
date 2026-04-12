import { ActivityIcon } from "lucide-react";
import { useState, useEffect } from "react"; // <-- Added React imports
import { useTranslation } from 'react-i18next';

export default function Analysis() {
  const { t } = useTranslation();
  
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
      <main className="flex-1 flex flex-col gap-6 px-10 py-8">
        {/* Header */}
        <header className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-[#1e2538]">
          <span className="text-cyan-500 dark:text-cyan-400 text-3xl"><ActivityIcon size={30}/></span>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{t('analysis.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('analysis.subtitle')}</p>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {dynamicStats.map(({ key, value, accent, icon, iconColor }) => (
            <div key={key} className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-6 py-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm">{t(`analysis.${key}`)}</span>
                {icon && <span className={`text-lg ${iconColor}`}>{icon}</span>}
              </div>
              <div className={`text-3xl font-bold ${accent.replace('text-white', 'text-slate-800 dark:text-white').replace('text-blue-400', 'text-blue-600 dark:text-blue-400')}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Recent Analyses Table */}
        <section className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl p-7 flex-1 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">{t('analysis.recentAnalyses')}</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-[#1e2538]">
                <th className="text-left pb-3 font-medium">{t('analysis.fileName')}</th>
                <th className="text-left pb-3 font-medium">{t('analysis.result')}</th>
                <th className="text-left pb-3 font-medium">{t('analysis.confidence')}</th>
                <th className="text-left pb-3 font-medium">{t('analysis.dateTime')}</th>
                <th className="text-left pb-3 font-medium">{t('analysis.action')}</th>
              </tr>
            </thead>
              <tbody>
                {/* 4. Using the combined array */}
                {displayAnalyses.map(({ file, result, confidence, date }, index) => (
                  <tr key={index} className="border-b border-slate-100 dark:border-[#1e2538] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 text-slate-700 dark:text-slate-200 font-medium">{file}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${result === "Real"
                          ? "bg-green-100 dark:bg-green-700/60 text-green-700 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-700/60 text-red-700 dark:text-red-300"
                        }`}>
                        {result}
                      </span>
                    </td>
                    <td className="py-4 text-slate-700 dark:text-slate-200">{confidence}</td>
                    <td className="py-4 text-slate-500 dark:text-slate-500">{date}</td>
                    <td className="py-4">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors cursor-pointer">
                        {t('analysis.viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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