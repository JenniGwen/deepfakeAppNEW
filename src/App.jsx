import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Analysis from "./Analysis";
import Statistics from "./Statistics";
import Settings from "./Settings";

const NAV_ITEMS = [
  { icon: "⊞", label: "Dashboard", path: "/" },
  { icon: "〜", label: "Analysis", path: "/stats" }, // Linked to your 'Statistics' import
  { icon: "▦", label: "Statistics", path: "/charts" },
  { icon: "⚙", label: "Settings", path: "/settings" },
];

export function App() {
  return (
    // 1. BrowserRouter must wrap EVERYTHING that uses navigation
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0f1117] text-slate-200">
        
        {/* sidebar */}
        <aside className="w-60 bg-[#161b27] flex flex-col px-4 py-6 gap-8 border-r border-[#1e2538] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡</span>
            <div>
              <div className="font-bold text-sm leading-snug">IsItFake?</div>
              <div className="text-xs text-slate-500 mt-0.5">Security Analytics</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(({ icon, label, path }) => (
              // 2. We use NavLink so React knows which page is 'Active'
              <NavLink
                key={label}
                to={path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors cursor-pointer
                  ${isActive 
                    ? "bg-blue-900/50 text-blue-400 font-semibold" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`
                }
              >
                <span className="text-base">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="flex items-center gap-3 bg-[#1e2538] rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">AI</div>
            <div className="text-xs">
              <div className="font-semibold">AI Admin</div>
              <div className="text-[10px] text-slate-500">Administrator</div>
            </div>
          </div>
        </aside>

        {/* 3. MAIN CONTENT: flex-1 ensures this takes the remaining space */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stats" element={<Analysis />} />
            <Route path="/charts" element={<Statistics />} />
            <Route path="/settings" element={<Settings/>} />   
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;