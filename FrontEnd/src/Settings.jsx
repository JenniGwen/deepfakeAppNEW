import { useState } from "react";
import { SettingsIcon } from "lucide-react"

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
  const [displayName, setDisplayName] = useState("AI Admin");
  const [email, setEmail] = useState("admin@deepfakevision.ai");
  const [emailNotif, setEmailNotif] = useState(true);
  const [desktopAlerts, setDesktopAlerts] = useState(false);
  const [autoDelete, setAutoDelete] = useState(true);
  const [apiKey, setApiKey] = useState("sk-••••••••••••••••••••••••");
  const [twoFactor, setTwoFactor] = useState(false);
  const [theme, setTheme] = useState("Dark");
  const [language, setLanguage] = useState("English");
  const [sensitivity, setSensitivity] = useState(75);

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-10 py-8 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center gap-4 pb-4 border-b border-[#1e2538]">
          <span className="text-cyan-400 text-2xl"><SettingsIcon size={30}/></span>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Configure your deepfake detection preferences</p>
          </div>
        </header>

        {/* Account Settings */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">👤</span>
            <h2 className="text-lg font-bold">Account Settings</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">🔔</span>
            <h2 className="text-lg font-bold">Notifications</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Email Notifications</div>
                <div className="text-xs text-slate-500 mt-0.5">Receive alerts when analysis completes</div>
              </div>
              <Toggle enabled={emailNotif} onToggle={() => setEmailNotif(!emailNotif)} />
            </div>
            <div className="border-t border-[#1e2538]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Desktop Alerts</div>
                <div className="text-xs text-slate-500 mt-0.5">Show browser notifications</div>
              </div>
              <Toggle enabled={desktopAlerts} onToggle={() => setDesktopAlerts(!desktopAlerts)} />
            </div>
          </div>
        </section>

        {/* Security & Privacy */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">🛡</span>
            <h2 className="text-lg font-bold">Security & Privacy</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Auto-delete Scans</div>
                <div className="text-xs text-slate-500 mt-0.5">Automatically delete scan history after 30 days</div>
              </div>
              <Toggle enabled={autoDelete} onToggle={() => setAutoDelete(!autoDelete)} />
            </div>
            <div className="border-t border-[#1e2538]" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Two-Factor Authentication</div>
                <div className="text-xs text-slate-500 mt-0.5">Add an extra layer of account security</div>
              </div>
              <Toggle enabled={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
            </div>
            <div className="border-t border-[#1e2538]" />
            <div>
              <label className="block text-sm text-slate-400 mb-2">API Key</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 min-w-0 bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-400 focus:outline-none"
                />
                <button className="shrink-0 bg-[#1e2538] hover:bg-slate-700 border border-[#2d3748] text-slate-300 text-sm px-4 py-3 rounded-lg transition-colors cursor-pointer">
                  Regenerate
                </button>
              </div>
            </div>
            <div className="border-t border-[#1e2538]" />
            <div>
              <button className="border border-red-700 text-red-400 hover:bg-red-900/30 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                Clear All History
              </button>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-cyan-400 text-xl">🎛</span>
            <h2 className="text-lg font-bold">Preferences</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid gap-5">
              <label className="block text-sm text-slate-400 mb-2">Language</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#1e2538] border border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none"
                >
                  <option>English</option>
                  <option>Indonesian</option>
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
                Detection Sensitivity — <span className="text-blue-400 font-semibold">{sensitivity}%</span>
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
                <span>Low</span>
                <span>High</span>
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