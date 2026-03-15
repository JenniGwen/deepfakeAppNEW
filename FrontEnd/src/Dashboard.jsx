import { useState } from "react";
import { Upload } from "lucide-react"


const STATS = [
  { value: "1,247", label: "Videos Analyzed" },
  { value: "98.4%", label: "Accuracy Rate" },
  { value: "<3s", label: "Avg. Processing Time" },
];

export default function Dashboard() {
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

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-slate-200 font-sans">
      {/* Sidebar */}

      {/* Main */}
      <main className="flex-1 flex flex-col gap-6 px-10 py-8">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">IsItFake?</h1>
            <p className="text-slate-500 text-sm mt-1">
              Advanced AI-powered media verification and analysis
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
            ✦ AI Powered
          </button>
        </header>

        {/* Scanning Card */}
        <section className="bg-[#161b27] border border-[#1e2538] rounded-2xl p-7">
          <h2 className="text-blue-400 text-lg font-semibold mb-5">Scanning Station</h2>

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
                {fileName ?? "Drop your video here or click to browse"}
              </p>
              </>
            )}
            <p className="text-slate-500 text-xs mt-2">
                Supported formats: JPG, PNG, WebP
            </p>
            
          </div>
              {/* Run Button */}
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setIsScanning(true)}
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
                {isScanning ? "Scanning... Please wait" : "Run Analysis"}
              </button>
            </div>
        </section>

        {/* Stats */}
        <div className="flex gap-4">
          {STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 bg-[#161b27] border border-[#1e2538] rounded-2xl px-6 py-5"
            >
              <div className="text-3xl font-bold text-blue-400">{value}</div>
              <div className="text-slate-400 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-auto text-slate-600 text-xs">
          © 2026 Deepfake Vision AI. All rights reserved.
        </footer>
      </main>
    </div>
  );
}