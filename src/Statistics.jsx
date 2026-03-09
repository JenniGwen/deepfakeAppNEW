import { BarChart3, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'

const barChart = () => {
    return <BarChart3 color='text-blue-400' size={8}/>;
};

const TrendingUpScanCard = () => (
    <TrendingUp color='text-green-400'size={3}/>
);

const centangCircle = () => (
    <CheckCircle color='text-green-400' size={5}/>
);

const warningTriangle = () => (
    <AlertTriangle color='text-red-400' size={5}/>
);

const AccuracyCard = () => (
    <TrendingUp color='text-cyan-400' size={5}/>
);

const STATS = [
  { value: "1,247", label: "Videos Analyzed" , icon: barChart, iconColor: "text-blue-400"},
  { value: "98.4%", label: "Accuracy" },
  { value: "892", label: "Real Videos" },
  { value: "335", label: "Fake Videos"}
];

export default function Statistics(){
    return(
        <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
            <main className="flex-1 flex flex-col gap-6 px-10 py-8">
                <header className="flex items-center gap-4 pb-4 border-b border-[#1e2538]">
                    <span className="text-cyan-400 text-3xl"></span>
                    <div>
                        <h1 className="text-3xl font-bold">Statistics & Analysis</h1>
                        <p className="text-slate-500 text-sm mt-1">Performance metrics and detection insights</p>
                    </div>
                </header>

                {/* The 4 top cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STATS.map(({label, value, icon, iconColor}) =>(
                        <div key={label} className="bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5">
                            <div className="flex gap-3 items-center">
                                {icon && <span className={`text-2xl rounded-lg bg-green border border-white/30 rounded-sm ${iconColor}`}>{icon}</span>}
                                <span className="text-slate-500 text-sm">{label}</span>
                            </div>
                            <div className={`text-3xl font-bold pt-3`}>{value}</div>
                        </div>

                    ))}
                </div>
            </main>

        </div>



    )

}
