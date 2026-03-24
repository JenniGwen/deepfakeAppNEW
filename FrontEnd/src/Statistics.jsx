import { BarChart3, CheckCircle, AlertTriangle, TrendingUpIcon } from 'lucide-react'
import { useState, useEffect } from 'react'; // 1. We need our React tools!

const PERFORMANCE_METRICS = [
  { 
    label: "Processing Speed", 
    value: "2.8s avg", 
    width: "75%", 
    color: "bg-gradient-to-r from-blue-500 to-cyan-400" 
  },
  { 
    label: "Detection Rate", 
    value: "98.4%", 
    width: "98%", 
    color: "bg-gradient-to-r from-green-400 to-emerald-400" 
  },
  { 
    label: "System Uptime", 
    value: "99.9%", 
    width: "100%", 
    color: "bg-gradient-to-r from-cyan-400 to-blue-500" 
  }
];

const MIDDLEPART = [
    { label: "Detection Trends", icon: BarChart3 },
    { label: "Confidence Distribution", icon: BarChart3}
];

// NOTICE: The hardcoded STATS array has been deleted from here!

export default function Statistics(){
    // 2. Set up the state to hold our Vault data
    const [scanHistory, setScanHistory] = useState([]);

    // 3. Open the Vault when the page loads
    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('synthScanHistory'));
        if (savedHistory && savedHistory.length > 0) {
            setScanHistory(savedHistory);
        }
    }, []);

    // ==========================================
    // THE REAL-TIME MATH ENGINE
    // ==========================================
    const totalScans = scanHistory.length;
    
    const realCount = scanHistory.filter((item) => item.result === "Real").length;
    const fakeCount = scanHistory.filter((item) => item.result === "Fake" || item.result === "Deepfake").length;

    // Calculate the percentages (Preventing "division by zero" if the vault is empty!)
    const realPercent = totalScans > 0 ? Math.round((realCount / totalScans) * 100) : 0;
    const fakePercent = totalScans > 0 ? Math.round((fakeCount / totalScans) * 100) : 0;

    // 4. Build the dynamic array right before React draws the screen
    const dynamicStats = [
        { 
            label: "Images Analyzed", 
            value: totalScans, 
            icon: BarChart3, 
            iconColor: "text-blue-400", 
            text: "All time records" 
        },
        { 
            label: "Accuracy", 
            value: "98.4%", // Kept static for the competition demo!
            icon: CheckCircle, 
            iconColor: "text-green-400", 
            text: "Based on C23 Dataset" 
        },
        { 
            label: "Real Images", 
            value: realCount, 
            icon: AlertTriangle, 
            iconColor: "text-red-400", 
            text: `${realPercent}% of total` 
        },
        { 
            label: "Fake Images", 
            value: fakeCount, 
            icon: TrendingUpIcon, 
            iconColor: "text-blue-400", 
            text: `${fakePercent}% of total` 
        }
    ];

    return(
        <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
            <main className="flex-1 flex flex-col gap-6 px-10 py-8">
                <header className="flex items-center gap-4 pb-4 border-b border-[#1e2538]">
                    <span className="text-cyan-400 text-3xl"><BarChart3 size={30}/></span>
                    <div>
                        <h1 className="text-3xl font-bold">Statistics & Analysis</h1>
                        <p className="text-slate-500 text-sm mt-1">Performance metrics and detection insights</p>
                    </div>
                </header>

                {/* The 4 top cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 5. Swap this to map over dynamicStats instead of STATS */}
                    {dynamicStats.map(({label, value, icon:Icon, iconColor, text}) =>(
                        <div key={label} className="bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5">
                            <div className="flex gap-3 items-center">
                                <div className='p-2 bg-white/5 rounded-lg border border-white/10'>
                                    {Icon && <Icon className={iconColor} size={20} />}
                                </div>
                                <span className="text-slate-500 text-sm">{label}</span>
                            </div>
                            <div className={`text-3xl font-bold pt-3`}>{value}</div>
                            <div className={'text-xs text-slate-400 font-sans pt-1'}>{text}</div>
                        </div>
                    ))}
                </div>

                {/* --- The rest of your code remains EXACTLY the same --- */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4'>
                    {MIDDLEPART.map(({ label, icon:Icon }) => (
                        <div key={label} className='bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5'>
                            <div className='text-slate-400 text-lg font-bold pb-3'>{label}</div>
                            <div className='flex flex-col border-3 border-[#1e2538] border-dashed rounded-2xl px-6 py-20 items-center justify-center'>
                                {Icon && <Icon className="text-slate-400" size={50}/>}
                                <p className='pt-3 text-sm text-slate-700'>Chart Visualisation Would Be Displayed Here</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5">
                    <h2 className='text-slate-400 font-bold'>Performance Matrix</h2>
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8'>
                        {PERFORMANCE_METRICS.map(({label, value, width, color}) => (
                            <div key={label} className='flex flex-col gap-3'>
                                <div className="flex justify-between items-center text-sm pt-3">
                                    <span className="text-slate-400 font-medium">{label}</span>
                                    <span className="text-white font-bold">{value}</span>
                                </div>
                                <div className="w-full h-2.5 bg-[#1e2538] rounded-full overflow-hidden">
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