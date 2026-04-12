import { useState, useEffect } from 'react';
import { ActivityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Intro({ onComplete }) {
  const { t } = useTranslation();
  // We use these two states to trigger Tailwind's CSS transitions
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. A split-second after the app loads, trigger the text to fade in
    setTimeout(() => setIsVisible(true), 100);

    // 2. Start the fake "loading bar" animation, pushing it to 100%
    setTimeout(() => setProgress(100), 300);

    // 3. After 2.5 seconds, tell App.jsx "I'm done, destroy me!"
    setTimeout(() => {
      setIsVisible(false); // Fade out
      setTimeout(() => onComplete(), 500); // Wait for fade-out to finish, then unmount
    }, 2500);
  }, [onComplete]);

  return (
    // 'fixed inset-0 z-50' forces this black screen to cover everything else on the website
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f1117] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* This div slides up slightly and fades in */}
      <div className={`flex flex-col items-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0' : 'translate-y-10'}`}>
        
        {/* A pulsing neon icon */}
        <ActivityIcon size={64} className="text-cyan-500 dark:text-cyan-400 animate-pulse mb-6" />
        
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-widest uppercase mb-2">
          {t('intro.title')}
        </h1>
        
        <p className="text-cyan-500 tracking-[0.3em] text-sm font-mono opacity-80">
          {t('intro.loading')}
        </p>
        
        {/* The Progress Bar Container */}
        <div className="w-64 h-1 bg-slate-200 dark:bg-[#1e2538] mt-8 rounded-full overflow-hidden">
           {/* The Neon Fill (Changes width based on our 'progress' state) */}
           <div 
             className="h-full bg-cyan-400 transition-all ease-out" 
             style={{ width: `${progress}%`, transitionDuration: '2000ms' }}
           ></div>
        </div>
        
      </div>
    </div>
  );
}