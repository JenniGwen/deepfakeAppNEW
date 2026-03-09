import { useState } from "react";

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", active: true },
  { icon: "〜", label: "Analysis" },
  { icon: "↺", label: "History" },
  { icon: "▦", label: "Statistics" },
  { icon: "⚙", label: "Settings" },
];

const STATS = [
  { value: "1,247", label: "Videos Analyzed" },
  { value: "98.4%", label: "Accuracy Rate" },
  { value: "<3s", label: "Avg. Processing Time" },
];

export default function App() {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-[#161b27] flex flex-col px-4 py-6 gap-8 border-r border-[#1e2538]">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡</span>
          <div>
            <div className="font-bold text-sm leading-snug">
              Deepfake<br />Vision AI
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Security Analytics</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ icon, label, active }) => (
            <button
              key={label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors cursor-pointer
                ${active
                  ? "bg-blue-900/50 text-blue-400 font-semibold"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 bg-[#1e2538] rounded-xl px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
            AI
          </div>
          <div>
            <div className="text-sm font-semibold">AI Admin</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Do not sell or share my personal info</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-10 py-8">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Deepfake Detection System</h1>
            <p className="text-slate-500 text-sm mt-1">
              Advanced AI-powered media verification and analysis
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
            ✦ AI Powered
          </button>
        </header>

        {/* Scanning Card */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <h2 className="text-blue-400 text-lg font-semibold mb-5">Scanning Station</h2>

          {/* Drop Zone */}
          <div
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl py-16 px-6 text-center cursor-pointer transition-all
              ${dragging
                ? "border-blue-400 bg-blue-900/20"
                : "border-slate-600 hover:border-slate-400 hover:bg-slate-800/30"
              }`}
          >
            <input
              id="fileInput"
              type="file"
              accept="video/mp4,video/mov,video/avi,video/webm"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="text-4xl text-slate-400 mb-4">⬆</div>
            <p className="font-semibold text-sm">
              {fileName ?? "Drop your video here or click to browse"}
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Supported formats: MP4, MOV, AVI, WebM
            </p>
          </div>

          {/* Run Button */}
          <div className="flex justify-center mt-6">
            <button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold px-12 py-3 rounded-xl transition-all cursor-pointer">
              Run Analysis
            </button>
          </div>
        </section>

        {/* Stats */}
        <div className="flex gap-4">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5"
            >
              <div className="text-3xl font-bold text-blue-400">{value}</div>
              <div className="text-slate-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-auto text-slate-600 text-xs">
          © 2026 Deepfake Vision AI. All rights reserved.
        </footer>
      </main>
    </div>
  );
}