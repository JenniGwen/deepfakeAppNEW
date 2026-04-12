import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Analysis from "./Analysis";
import Statistics from "./Statistics";
import Settings from "./Settings";
import Intro from "./Intro";
import Login from "./Login";
import Register from "./Register";
import { SettingsIcon, HomeIcon, ActivityIcon, BarChart3, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const NAV_ITEMS = [
  { icon: HomeIcon, label: "Dashboard", path: "/" },
  { icon: ActivityIcon, label: "Analysis", path: "/stats" },
  { icon: BarChart3, label: "Statistics", path: "/charts" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0f1117]">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function MainAppShell() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('introPlayed');
  });

  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayed', 'true'); 
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <Intro onComplete={handleIntroComplete} />}

      <div className="flex h-screen bg-slate-50 dark:bg-[#0f1117] text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-300">
        
        {/* Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        )}

        {/* SIDEBAR */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50
          w-60 bg-white dark:bg-[#161b27] flex flex-col px-4 py-6 gap-8 border-r border-slate-200 dark:border-[#1e2538] shrink-0
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
            <button 
              className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors font-medium
                  ${isActive 
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`
                }
              >
                <div className="text-base">{Icon && <Icon size={20}/>}</div>
                {t(`app.${label.toLowerCase()}`)}
              </NavLink>
            ))}
          </nav>

          <div className="mb-2">
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left w-full transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 mt-1 cursor-pointer"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#1e2538] rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'AI'}
            </div>
            <div className="text-xs overflow-hidden">
              <div className="font-semibold truncate text-slate-800 dark:text-slate-200">{user?.display_name || t('app.adminName')}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.role || t('app.adminRole')}</div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* MOBILE HEADER */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#161b27] border-b border-slate-200 dark:border-[#1e2538]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-slate-600 dark:text-slate-400"
              >
                <Menu size={28} />
              </button>
              <img src="/Group 5.svg" alt="Logo" className="h-6 object-contain" />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">AI</div>
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
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <MainAppShell />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;