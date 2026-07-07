import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const { register, startGoogleLogin } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    // Call the register function
    const result = await register(email, password, username, displayName);
    setLoading(false);
    
    if (result.success) {
      // Upon successful registration, usually redirect to login page
      navigate('/login');
    } else {
      setError(result.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    const result = await startGoogleLogin();
    if (result && !result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#161b27] md:bg-slate-50 md:dark:bg-[#0f1117] text-slate-800 dark:text-slate-200 items-center justify-center p-0 md:p-4 transition-colors duration-300">
      
      <div className="w-full h-screen md:h-auto md:max-w-md bg-white dark:bg-[#161b27] md:border md:border-slate-200 md:dark:border-[#1e2538] md:rounded-2xl md:shadow-xl overflow-y-auto flex flex-col relative">
        <div className="px-6 py-8 md:p-8 flex-1 flex flex-col justify-center">
          
          <div className="flex items-center justify-center relative w-full mb-8">
            <button
              onClick={() => navigate('/')}
              className="absolute left-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-[#0f1117] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700/50"
              title="Back to Home"
            >
              <ArrowLeft size={20} />
            </button>
            <img src="/Group 5.svg" alt="IsItFake Logo" className="h-7 md:h-9 object-contain ml-3" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8">Join the AI verification platform</p>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-[#1e2538] border border-slate-200 dark:border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-[#1e2538] border border-slate-200 dark:border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-[#1e2538] border border-slate-200 dark:border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-[#1e2538] border border-slate-200 dark:border-[#2d3748] rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`mt-4 flex items-center justify-center gap-2 font-semibold px-4 py-3 rounded-lg transition-all duration-300
                ${loading 
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 cursor-pointer"}`
              }
            >
              <UserPlus size={18} />
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="border-b border-slate-200 dark:border-[#1e2538] w-1/5 md:w-1/4"></span>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">or sign up with</span>
            <span className="border-b border-slate-200 dark:border-[#1e2538] w-1/5 md:w-1/4"></span>
          </div>

          <button
            onClick={() => handleGoogleAuth()}
            type="button"
            disabled={loading}
            className={`mt-6 w-full flex items-center justify-center gap-3 font-semibold px-4 py-3 rounded-lg border transition-all duration-300
              ${loading 
                ? "bg-slate-50 dark:bg-[#1e2538] border-slate-200 dark:border-[#2d3748] text-slate-400 cursor-not-allowed" 
                : "bg-white dark:bg-[#161b27] hover:bg-slate-50 dark:hover:bg-[#1e2538] border-slate-200 dark:border-[#2d3748] text-slate-700 dark:text-slate-200 cursor-pointer"}`
            }
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Google
          </button>

        </div>
        
        <div className="bg-slate-100 dark:bg-[#11141d] px-8 py-6 md:py-4 md:border-t md:border-slate-200 md:dark:border-[#1e2538] text-center text-sm mt-auto shrink-0">
          <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

    </div>
  );
}
