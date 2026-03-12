import {ActivityIcon} from "lucide-react"

const STATS = [
  { label: "Today's Scans", value: "47", accent: "text-white", icon: "↗", iconColor: "text-green-400" },
  { label: "Detected Fakes", value: "12", accent: "text-white", icon: "⊙", iconColor: "text-red-400" },
  { label: "Avg Confidence", value: "95.3%", accent: "text-blue-400", icon: null },
  { label: "Processing Time", value: "2.4s", accent: "text-white", icon: null },
];

const ANALYSES = [
  { file: "interview_video.mp4",    result: "Real", confidence: "98.4%", date: "2026-03-07 14:23" },
  { file: "social_media_clip.mov",  result: "Fake", confidence: "94.2%", date: "2026-03-07 13:45" },
  { file: "news_segment.mp4",       result: "Real", confidence: "96.7%", date: "2026-03-07 12:18" },
  { file: "viral_video.avi",        result: "Fake", confidence: "89.5%", date: "2026-03-07 11:02" },
  { file: "documentary_clip.mp4",   result: "Real", confidence: "97.1%", date: "2026-03-07 09:34" },
];

export default function Analysis() {
  return (
    <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-10 py-8">
        {/* Header */}
        <header className="flex items-center gap-4 pb-4 border-b border-[#1e2538]">
          <span className="text-cyan-400 text-3xl"><ActivityIcon size={30}/></span>
          <div>
            <h1 className="text-3xl font-bold">Analysis Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Detailed insights and recent detections</p>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {STATS.map(({ label, value, accent, icon, iconColor }) => (
            <div key={label} className="bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">{label}</span>
                {icon && <span className={`text-lg ${iconColor}`}>{icon}</span>}
              </div>
              <div className={`text-3xl font-bold ${accent}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Recent Analyses Table */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7 flex-1">
          <h2 className="text-lg font-bold mb-6">Recent Analyses</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-[#1e2538]">
                <th className="text-left pb-3 font-medium">File Name</th>
                <th className="text-left pb-3 font-medium">Result</th>
                <th className="text-left pb-3 font-medium">Confidence</th>
                <th className="text-left pb-3 font-medium">Date & Time</th>
                <th className="text-left pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ANALYSES.map(({ file, result, confidence, date }) => (
                <tr key={file} className="border-b border-[#1e2538] last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 text-slate-200">{file}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${result === "Real"
                        ? "bg-green-700/60 text-green-300"
                        : "bg-red-700/60 text-red-300"
                      }`}>
                      {result}
                    </span>
                  </td>
                  <td className="py-4 text-slate-200">{confidence}</td>
                  <td className="py-4 text-slate-500">{date}</td>
                  <td className="py-4">
                    <button className="text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Help Button */}
        <div className="flex justify-end">
          <button className="w-8 h-8 rounded-full bg-[#1e2538] text-slate-400 hover:text-white hover:bg-slate-700 text-sm font-bold transition-colors cursor-pointer">
            ?
          </button>
        </div>
      </main>
    </div>
  );
}
