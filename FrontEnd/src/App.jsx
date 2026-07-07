import { useState, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from "react-router-dom";
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
import LoadingOverlay from './components/LoadingOverlay';

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

  const navigate = useNavigate();
  const location = useLocation();

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

        {/* SIDEBAR (Desktop Only) */}
        <aside className="
          hidden md:flex
          w-60 bg-white dark:bg-[#161b27] flex-col px-4 py-6 gap-8 border-r border-slate-200 dark:border-[#1e2538] shrink-0
        ">

          <div className="flex items-center justify-between px-2 mb-2">
            <img
              src="/Group 5.svg"
              alt="IsItFake Logo"
              className="w-44 h-auto object-contain drop-shadow-lg"
            />
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

          <div className="flex flex-col bg-slate-100 dark:bg-[#1e2538] rounded-xl p-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'AI'}
              </div>
              <div className="text-xs overflow-hidden flex-1">
                <div className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200">{user?.display_name || t('app.adminName')}</div>
                <div className="text-[11px] text-slate-500 truncate capitalize">{user?.role || t('app.adminRole')}</div>
              </div>
            </div>

            <div className="flex items-center border-t border-slate-200 dark:border-slate-700/50 pt-3 gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer shadow-sm hover:shadow"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer shadow-sm hover:shadow"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* MOBILE HEADER */}
          <header className="md:hidden relative flex items-center justify-between p-4 bg-white dark:bg-[#161b27] border-b border-slate-200 dark:border-[#1e2538] z-30">
            <div className="flex items-center gap-3">
              <img src="/Group 5.svg" alt="Logo" className="h-6 object-contain ml-1" />
            </div>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1e2538] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700/50"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </header>

          <main
            className="flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-4"
          >
            <div>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stats" element={<Analysis />} />
                <Route path="/charts" element={<Statistics />} />
                <Route path="/settings" element={<Settings/>} />
              </Routes>
            </div>
          </main>

          {/* MOBILE BOTTOM NAV — fixed to viewport bottom */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#161b27] border-t border-slate-200 dark:border-[#1e2538] pt-2 pb-safe px-1">
            <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory">
              {NAV_ITEMS.map(({ icon:Icon, label, path }) => (
                <NavLink
                  key={label}
                  to={path}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 p-2 min-w-[72px] flex-1 snap-start rounded-xl transition-all duration-300
                    ${isActive
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`
                  }
                >
                  <div className="text-xl mb-0.5">{Icon && <Icon size={24} strokeWidth={2.5} />}</div>
                  <span className="text-[10px] leading-none mb-1 font-semibold">{t(`app.${label.toLowerCase()}`)}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </div>

      </div>
    </>
  );
}

function AuthLoadingGate({ children }) {
  const { authLoading, authLoadingMessage } = useAuth();
  return (
    <>
      {authLoading && <LoadingOverlay message={authLoadingMessage} />}
      {children}
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthLoadingGate>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={<MainAppShell />} />
            </Routes>
          </AuthLoadingGate>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;