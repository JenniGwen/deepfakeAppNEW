import { useState, useEffect } from "react";
import { SettingsIcon } from "lucide-react"
import { useTranslation } from 'react-i18next';

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none
        ${enabled ? "bg-blue-500" : "bg-slate-600"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${enabled ? "translate-x-6" : "translate-x-0"}`}
      />
    </button>
  );
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [displayName, setDisplayName] = useState(() => t('app.adminName'));
  const [email, setEmail] = useState("admin@deepfakevision.ai");
  const [emailNotif, setEmailNotif] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(false);
  const [autoDelete, setAutoDelete] = useState(true);
  const [apiKey] = useState("sk-••••••••••••••••••••••••");
  const [twoFactor, setTwoFactor] = useState(false);
  const [language, setLanguage] = useState(i18n.language || "en");
  const [sensitivity, setSensitivity] = useState(75);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-10 py-8 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center gap-4 pb-4 border-b border-[#1e2538]">
          <span className="text-cyan-400 text-2xl"><SettingsIcon size={30}/></span>
          <div>
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('settings.subtitle')}</p>
          </div>
        </header>

        {/* Account Settings */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">👤</span>
            <h2 className="text-lg font-bold">{t('settings.accountSettings')}</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t('settings.displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t('settings.emailAddress')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                {t('settings.saveChanges')}
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">🔔</span>
            <h2 className="text-lg font-bold">{t('settings.notifications')}</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t('settings.emailNotifications')}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('settings.emailNotifDesc')}</div>
              </div>
              <Toggle enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
            </div>
            <div className="border-t border-[#1e2538]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t('settings.desktopAlerts')}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('settings.desktopAlertsDesc')}</div>
              </div>
              <Toggle enabled={desktopAlerts} onToggle={() => setDesktopAlerts(!desktopAlerts)} />
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">🛡</span>
            <h2 className="text-lg font-bold">{t('settings.securityPrivacy')}</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t('settings.autoDelete')}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('settings.autoDeleteDesc')}</div>
              </div>
              <Toggle enabled={autoDelete} onToggle={() => setAutoDelete(!autoDelete)} />
            </div>
            <div className="border-t border-[#1e2538]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t('settings.twoFactor')}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t('settings.twoFactorDesc')}</div>
              </div>
              <Toggle enabled={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
            </div>
            <div className="border-t border-[#1e2538]" />
            <div>
              <label className="block text-sm text-slate-400 mb-2">{t('settings.apiKey')}</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 min-w-0 bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-400 focus:outline-none"
                />
                <button className="shrink-0 bg-[#1e2538] hover:bg-slate-700 border border-[#2d3748] text-slate-300 text-sm px-4 py-3 rounded-lg transition-colors cursor-pointer">
                  {t('settings.regenerate')}
                </button>
              </div>
            </div>
            <div className="border-t border-[#1e2538]" />
            <div>
              <button className="border border-red-700 text-red-400 hover:bg-red-900/30 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                {t('settings.clearHistory')}
              </button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">🎛</span>
            <h2 className="text-lg font-bold">{t('settings.preferences')}</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid gap-5">
              <label className="block text-sm text-slate-400 mb-2">{t('settings.language')}</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                >
                  <option value="en">{t('settings.english')}</option>
                  <option value="id">{t('settings.indonesian')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                {t('settings.detectionSensitivity')} — <span className="text-blue-400 font-semibold">{sensitivity}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value)}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{t('settings.low')}</span>
                <span>{t('settings.high')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Help button */}
        <div className="flex justify-end pb-2">
          <button className="w-8 h-8 rounded-full bg-[#1e2538] text-slate-400 hover:text-white hover:bg-slate-700 text-sm font-bold transition-colors cursor-pointer">
            ?
          </button>
        </div>
      </main>
    </div>
  );
}