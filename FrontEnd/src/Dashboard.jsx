import { useState, useEffect } from "react";
import { Upload, Lock, X } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [rawFile, setRawFile] = useState(null);
  const [urlImage, setUrlImage] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [summaryData, setSummaryData] = useState({
    today_scans: 0,
    avg_confidence: 0,
    avg_processing_time: "3.0"
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/statistics/summary`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.data) setSummaryData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch summary:", error);
      }
    };
    fetchSummary();

    // Check for persisted image
    const cachedImage = sessionStorage.getItem('pendingImage');
    const cachedName = sessionStorage.getItem('pendingFileName');
    const cachedType = sessionStorage.getItem('pendingFileType');
    if (cachedImage && cachedName) {
      fetch(cachedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], cachedName, { type: cachedType || 'image/jpeg' });
          setRawFile(file);
          setFileName(cachedName);
          setUrlImage(cachedImage);
        });
    }
  }, []);

  const saveFileToStorage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        sessionStorage.setItem('pendingImage', e.target.result);
        sessionStorage.setItem('pendingFileName', file.name);
        sessionStorage.setItem('pendingFileType', file.type);
      } catch (err) {
        console.warn("Image too large to cache", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const STATS_KEYS = [
    { value: summaryData.today_scans, key: "imagesAnalyzed" },
    { value: `${summaryData.avg_confidence}%`, key: "accuracyRate" },
    { value: `${summaryData.avg_processing_time || "3.0"}s`, key: "avgProcessingTime" },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setRawFile(file);
      setUrlImage(URL.createObjectURL(file));
      saveFileToStorage(file);
    }
      
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setRawFile(file);
      setUrlImage(URL.createObjectURL(file));
      saveFileToStorage(file);
    }
  };

  const navigate = useNavigate();

  const handleScan = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsScanning(true);
    const sendData = new FormData();
    sendData.append("file", rawFile)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/api/scan`, {
        method: "POST",
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: sendData,
      });

      const result = await response.json();
      console.log("API RESPONSE:", result);
      
      if (result.status === "success") {
          const scanImage = sessionStorage.getItem('pendingImage') || urlImage;
          sessionStorage.removeItem('pendingImage');
          sessionStorage.removeItem('pendingFileName');
          sessionStorage.removeItem('pendingFileType');
          navigate('/stats', { 
            state: { 
              scanResult: result.data,
              scanImage: scanImage,
              fileName: fileName
            } 
          });
      } else {
          console.error("Scan failed:", result.message);
      }
    } catch (error) {
      console.error("The delivery crashed:", error);
    }finally{
      setIsScanning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent transition-colors duration-300">
      {/* Sidebar is now moved to App.jsx Wrapper */}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/50 dark:bg-[#0f1117]/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] flex flex-col items-center text-center p-8 max-w-sm w-full mx-4 rounded-2xl shadow-xl relative">
            <button 
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shadow-none border-none bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-5">
              <Lock className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('analysis.lockedTitle', 'Login Required')}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              {t('analysis.lockedMessage', 'Log in to your account to process this media with advanced AI analysis.')}
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer shadow-md"
            >
              {t('analysis.loginNow', 'Login Now')}
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-4 md:px-10 py-6 md:py-8 w-full max-w-[100vw] overflow-x-hidden">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-lg lg:text-3xl font-bold text-slate-800 dark:text-slate-200">{t('dashboard.title')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
            {t('dashboard.aiPowered')}
          </button>
        </header>

        {/* Scanning Card */}
        <section className="bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl p-7 shadow-sm">
          <h2 className="text-blue-600 dark:text-blue-400 text-lg font-semibold mb-5">{t('dashboard.scanningStation')}</h2>

          {/* Drop Zone */}
          <div
            onClick={() => document.getElementById("fileInput").click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl py-16 px-6 text-center cursor-pointer transition-all
              ${dragging
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
              }`}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {urlImage ? (
              <>
              <img src={urlImage} 
              alt="Uploaded preview"
              className="max-h-64 object-contain mx-auto rounded-lg shadow-sm border border-slate-100 dark:border-[#1e2538]"/>
              <p className="text-slate-700 dark:text-slate-200 text-xs mt-3 font-medium">{fileName}</p>
              </>
              
            ) : (
              <>
              <div className="flex text-4xl text-slate-400 dark:text-slate-500 mb-4 justify-center items-center">
              <Upload size={50}/>
              </div>
              <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {fileName ?? t('dashboard.dropFile')}
              </p>
              </>
            )}
            <p className="text-slate-500 dark:text-slate-500 text-xs mt-2">
                {t('dashboard.supportedFormats')}
            </p>
            
          </div>
              {/* Run Button */}
            <div className="flex justify-center mt-6">
              <button 
                onClick={handleScan}
                // 1. The Physical Lock: Disable if currently scanning OR if no file exists
                disabled={isScanning || !fileName} 
                
                // 2. Base classes that NEVER change
                className={`font-semibold px-12 py-3 rounded-xl transition-all duration-300
                  ${(isScanning || !fileName) 
                    // 3a. DISABLED LOOK
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" 
                    
                    // 3b. ACTIVE LOOK
                    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/20" 
                  }`}
              >
                {isScanning ? t('dashboard.scanningWait') : t('dashboard.runAnalysis')}
              </button>
            </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          {STATS_KEYS.map(({ value, key }, index) => (
            <div
              key={key}
              className={`bg-white dark:bg-[#161b27] border border-slate-200 dark:border-[#1e2538] rounded-2xl px-4 py-4 md:px-6 md:py-5 shadow-sm ${index === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{value}</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">{t(`dashboard.${key}`)}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-auto text-slate-400 dark:text-slate-600 text-xs">
          {t('dashboard.footer')}
        </footer>
      </main>
    </div>
  );
}