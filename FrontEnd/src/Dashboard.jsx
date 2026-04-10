import { useState } from "react";
import { Upload } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const STATS_KEYS = [
  { value: "1,247", key: "imagesAnalyzed" },
  { value: "98.4%", key: "accuracyRate" },
  { value: "<3s", key: "avgProcessingTime" },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [rawFile, setRawFile] = useState(null);
  const [urlImage, setUrlImage] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setRawFile(file);
      setUrlImage(URL.createObjectURL(file))
    }
      
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setRawFile(file);
      setUrlImage(URL.createObjectURL(file))
    }
  };

  const navigate = useNavigate();

  const handleScan = async () => {
    setIsScanning(true);
    const sendData = new FormData();
    sendData.append("file", rawFile)
    try {

      const response = await fetch("http://localhost:5001/api/scan", {
      method: "POST",
      body: sendData,
      });

      const result = await response.json();
      console.log("API RESPONSE:", result);
      if (result.status === "success") {
          // 1. Generate the timestamp for right now
          const now = new Date();
          const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

          // 2. Package the new scan into a neat object
          const newScan = {
              file: rawFile.name,
              result: result.result,
              confidence: `${result.probability}%`,
              date: timestamp
          };

          // 3. Open the Vault and get the old history (or an empty array if it's their first time)
          const existingHistory = JSON.parse(localStorage.getItem('synthScanHistory')) || [];

          // ==========================================
          // YOUR PUZZLE:
          // How do you create a new array called `updatedHistory` 
          // that puts `newScan` at the very beginning, followed by everything in `existingHistory`?
          // (Hint: Use the JavaScript Spread Operator `...`)
          // ==========================================
          const updatedHistory = [newScan, ...existingHistory];

          // 4. Lock the updated pile back into the Vault
          localStorage.setItem('synthScanHistory', JSON.stringify(updatedHistory));

          // 5. Teleport to the stats page! (We don't need the state backpack anymore)
          navigate('/stats');
      }
    } catch (error) {
      console.error("The delivery crashed:", error);
    }finally{
      setIsScanning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
      {/* Sidebar */}

      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-10 py-8">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
            {t('dashboard.aiPowered')}
          </button>
        </header>

        {/* Scanning Card */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <h2 className="text-blue-400 text-lg font-semibold mb-5">{t('dashboard.scanningStation')}</h2>

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
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {urlImage ? (
              <>
              <img src={urlImage} 
              alt="Uploaded preview"
              className="max-h-64 object-contain mx-auto rounded-lg"/>
              <p className="text-slate-200 text-xs mt-2">{fileName}</p>
              </>
              
            ) : (
              <>
              <div className="flex text-4xl text-slate-400 mb-4 justify-center items-center">
              <Upload size={50}/>
              </div>
              <p className="font-semibold text-sm">
                {fileName ?? t('dashboard.dropFile')}
              </p>
              </>
            )}
            <p className="text-slate-500 text-xs mt-2">
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
                    // 3a. DISABLED LOOK: Gray, faded, and not-allowed cursor
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    
                    // 3b. ACTIVE LOOK: The beautiful gradient, shadow, and click animation
                    : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white cursor-pointer active:scale-95 shadow-lg shadow-cyan-500/20" 
                  }`}
              >
                {isScanning ? t('dashboard.scanningWait') : t('dashboard.runAnalysis')}
              </button>
            </div>
        </section>

        {/* Stats */}
        <div className="flex gap-4">
          {STATS_KEYS.map(({ value, key }) => (
            <div
              key={key}
              className="flex-1 bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5"
            >
              <div className="text-3xl font-bold text-blue-400">{value}</div>
              <div className="text-slate-400 text-sm mt-1">{t(`dashboard.${key}`)}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-auto text-slate-600 text-xs">
          {t('dashboard.footer')}
        </footer>
      </main>
    </div>
  );
}