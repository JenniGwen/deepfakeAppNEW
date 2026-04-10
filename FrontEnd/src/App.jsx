import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Analysis from "./Analysis";
import Statistics from "./Statistics";
import Settings from "./Settings";
import Intro from "./Intro";
import { SettingsIcon, HomeIcon, ActivityIcon, BarChart3, Menu, X } from 'lucide-react' // 2. Import Menu and X

const NAV_ITEMS = [
  { icon: HomeIcon, label: "Dashboard", path: "/" },
  { icon: ActivityIcon, label: "Analysis", path: "/stats" },
  { icon: BarChart3, label: "Statistics", path: "/charts" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

export function App() {
  const { t } = useTranslation();
  // 3. The Sliding Door State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('introPlayed');
  });

  // 3. CREATE THE SHUT-OFF SWITCH
  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayed', 'true'); // Save to memory
    setShowIntro(false); // Destroy the intro component
  };

  return (
    <>
      {/* 4. DROP THE CURTAINS OVER THE APP */}
      {showIntro && <Intro onComplete={handleIntroComplete} />}

    <BrowserRouter>
      {/* We add overflow-hidden here to stop the whole page from bouncing on mobile */}
      <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden">
        
        {/* 4. THE OVERLAY (Only shows on mobile when menu is open) */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}

        {/* 5. THE SIDEBAR (Added translation physics and fixed positioning) */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50
          w-60 bg-[#161b27] flex flex-col px-4 py-6 gap-8 border-r border-[#1e2538] shrink-0
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
        `}>
          
          <div className="flex items-center justify-between px-2 mb-2">
            <img 
              src="/Group 5.svg" 
              alt="IsItFake Logo" 
              className="w-44 h-auto object-contain drop-shadow-lg" 
            />
            {/* Close button inside the sidebar (Mobile only) */}
            <button 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {NAV_ITEMS.map(({ icon:Icon, label, path }) => (
              <NavLink
                key={label}
                to={path}
                // Auto-close the door when a link is clicked!
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors cursor-pointer
                  ${isActive 
                    ? "bg-blue-900/50 text-blue-400 font-semibold" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`
                }
              >
                <div className="text-base">{Icon && <Icon size={20}/>}</div>
                {t(`app.${label.toLowerCase()}`)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 bg-[#1e2538] rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">AI</div>
            <div className="text-xs">
              <div className="font-semibold">{t('app.adminName')}</div>
              <div className="text-[10px] text-slate-500">{t('app.adminRole')}</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* 6. THE MOBILE HEADER (Hamburger Button - Hidden on Desktop!) */}
          <header className="md:hidden flex items-center justify-between p-4 bg-[#161b27] border-b border-[#1e2538]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-slate-400 hover:text-white"
              >
                <Menu size={28} />
              </button>
              <img src="/Group 5.svg" alt="Logo" className="h-6 object-contain" />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">AI</div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stats" element={<Analysis />} />
              <Route path="/charts" element={<Statistics />} />
              <Route path="/settings" element={<Settings/>} />   
            </Routes>
          </main>
        </div>

      </div>
    </BrowserRouter>
    </>
  );
}

export default App;