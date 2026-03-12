import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, TrendingUpIcon } from 'lucide-react'

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


const STATS = [
  { value: "1,247", label: "Videos Analyzed" , icon: BarChart3, iconColor: "text-blue-400", text: "12% this week"},
  { value: "98.4%", label: "Accuracy", icon: CheckCircle, iconColor: "text-green-400", text: "71.5% of total" },
  { value: "892", label: "Real Videos", icon: AlertTriangle, iconColor: "text-red-400", text: "28.5% of total" },
  { value: "335", label: "Fake Videos", icon: TrendingUpIcon, iconColor: "text-blue-400", text: "Industry leading"}
];

export default function Statistics(){
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
                    {STATS.map(({label, value, icon:Icon, iconColor, text}) =>(
                        <div key={label} className="bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5">
                            <div className="flex gap-3 items-center">
                                <div className='p-2 bg-white/5 rounded-lg border border-white/10'>
                                    {Icon && <Icon className={iconColor} size={20} />}
                                </div>
                                <span className="text-slate-500 text-sm">{label}</span>
                            </div>
                            <div className={`text-3xl font-bold pt-3`}>{value}</div>
                            <div className={'text-xs text-slate-400 font-sans pt-1 pl'}>{text}</div>
                        </div>

                    ))}
                </div>

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
                    <h className='text-slate-400 font-bold'>Performance Matrix</h>
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8'>
                        {PERFORMANCE_METRICS.map(({label, value, width, color}) => (
                            <div key={label} className='flex flex-col gap-3'>
                                <div className="flex justify-between items-center text-sm pt-3">
                                    <span className="text-slate-400 font-medium">{label}</span>
                                    <span className="text-white font-bold">{value}</span>
                                    </div>

                                    {/* The Progress Bar */}
                                    {/* 1. The Track (Dark background) */}
                                    <div className="w-full h-2.5 bg-[#1e2538] rounded-full overflow-hidden">
                                    {/* 2. The Fill (Colored bar using inline style for dynamic width) */}
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
