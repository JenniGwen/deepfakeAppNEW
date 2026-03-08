import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 3)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

// function App() {
//   return (
//     // 1. Added a radial gradient background for that "Premium AI" feel
//     <div className="min-h-screen bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white flex flex-col items-center justify-center p-6">
      
//       <header className="mb-12 text-center animate-fade-in">
//         <h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
//           Deepfake Vision AI
//         </h1>
//         <p className="text-slate-400 mt-4 text-lg font-light">
//           ASEAN Competition Edition • Secure Verification
//         </p>
//       </header>

//       {/* 2. Glassmorphism Box: Added 'backdrop-blur' and a subtle white opacity border */}
//       <main className="w-full max-w-xl bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
        
//         <div className="group border-2 border-dashed border-slate-700 rounded-2xl p-16 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer">
//           {/* A simple icon placeholder */}
//           <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📁</div>
//           <p className="text-slate-300 font-medium">Drag and drop video</p>
//           <p className="text-slate-500 text-sm mt-1">MP4, MOV up to 50MB</p>
//         </div>

//         {/* 3. A "Status" button that we'll use later */}
//         <button className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
//           Analyze Authenticity
//         </button>
//       </main>
      
//       <footer className="mt-16 flex items-center gap-4 text-slate-500 text-xs tracking-widest uppercase">
//         <div className="h-px w-8 bg-slate-800"></div>
//         March 24th Deadline • System Ready
//         <div className="h-px w-8 bg-slate-800"></div>
//       </footer>
//     </div>
//   )
// }

// export default App

function App() {
  return(
    <div className="mainContent min-h-screen min-w-screen flex bg-slate-900 overflow-hidden">
      <div className='sideBar h-screen w-64 bg-white/5 backdrop-blurx1 border-2 border-white/10'>

      </div>

      <div className='topBar flex-col h-32 w-screen bg-white/5 backdrop-blurx1 border-b border-white/10'>
        <header>
          <h1 className='text-5xl text-white text-left font-bold p-10'>
            SynthScan
          </h1>
          <h3 className='text-2xl text-white/10 text-left font-bold p-10'>
            Advanced AI-powered media verification and analysis
          </h3>
        </header>
      </div>
    </div>



  )



}

export default App