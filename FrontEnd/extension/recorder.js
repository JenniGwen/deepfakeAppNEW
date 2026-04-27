document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const videoPreview = document.getElementById('preview');
    const videoContainer = document.getElementById('video-container');
    const statusText = document.getElementById('status-text');
    const resultBadge = document.getElementById('result-badge');

    let localStream = null;
    let scanInterval = null;
    let isScanning = false;
    let apiToken = null;

    // 1. Coba intip token dari tab localhost:5173 agar Autentikasi API berhasil
    fetchTokenSilently();

    startBtn.addEventListener('click', async () => {
        try {
            localStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "always" },
                audio: false
            });

            videoPreview.srcObject = localStream;
            
            // Perbarui UI ke state merekam terus menerus
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            videoContainer.classList.remove('hidden');
            resultBadge.classList.remove('hidden');
            videoContainer.classList.add('scanning');
            statusText.innerText = "Monitoring Video Aktif.\nAI Deepfake sedang berjalan di latar belakang.";

            // Reset kalau user menghentikan sharing via system dialogue
            localStream.getVideoTracks()[0].onended = () => {
                stopAutoDetect();
            };

            // Eksekusi Mesin Auto-Detect
            startAutoDetect();

        } catch (error) {
            console.error("Gagal melakukan screen share:", error);
            statusText.innerText = `Error: Izin tidak diberikan.`;
        }
    });

    stopBtn.addEventListener('click', stopAutoDetect);

    function startAutoDetect() {
        if(isScanning) return;
        isScanning = true;
        resultBadge.className = 'badge';
        resultBadge.innerText = 'Menyambungkan ke AI...';

        // Lakukan scan setiap 3000ms (3 Detik)
        scanInterval = setInterval(async () => {
            if (!localStream) return;
            performScan();
        }, 3000);
        
        // Scan pertama kalinya
        performScan();
    }

    async function performScan() {
        try {
            // Ambil gambar secara siluman
            const canvas = document.createElement('canvas');
            canvas.width = videoPreview.videoWidth || 800;
            canvas.height = videoPreview.videoHeight || 600;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            // Fetch Blob untuk mengubah base64 data menjadi File murni
            const responseBlob = await fetch(dataUrl);
            const blob = await responseBlob.blob();

            const formData = new FormData();
            formData.append("file", blob, "auto-capture.jpg");

            const apiUrl = 'http://127.0.0.1:5000';
            const headers = {};
            if (apiToken) {
                headers['Authorization'] = `Bearer ${apiToken}`;
            }

            const response = await fetch(`${apiUrl}/api/scan`, {
                method: "POST",
                headers: headers,
                body: formData
            });

            const result = await response.json();
            
            if(result.status === 'success' && result.data) {
                updateBadge(result.data.result, result.data.confidence);
            } else {
                resultBadge.className = 'badge';
                resultBadge.innerText = 'Login Web App Dulu!';
            }
        } catch(e) {
            console.error("Scanning Error:", e);
            resultBadge.className = 'badge';
            resultBadge.innerText = 'Koneksi AI Terputus';
        }
    }

    function updateBadge(detectedResult, confidenceScore) {
        if (detectedResult === "Real") {
            resultBadge.className = 'badge safe';
            resultBadge.innerText = `✅ AMAN: ${confidenceScore}%`;
            videoContainer.classList.remove('danger-zone');
        } else if (detectedResult === "Fake" || detectedResult === "Deepfake") {
            resultBadge.className = 'badge fake';
            resultBadge.innerText = `🚨 DEEPFAKE TERDETEKSI: ${confidenceScore}%`;
            videoContainer.classList.add('danger-zone');
        }
    }

    function stopAutoDetect() {
        isScanning = false;
        clearInterval(scanInterval);
        
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        videoContainer.classList.add('hidden');
        videoContainer.classList.remove('scanning', 'danger-zone');
        resultBadge.classList.add('hidden');
        statusText.innerText = "Sistem Monitoring dimatikan.";
        
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        localStream = null;
    }

    // Mengambil token login diam-diam agar ekstensi bisa masuk ke API!
    function fetchTokenSilently() {
        // Melirik aktivitas di Localhost
        chrome.tabs.query({url: "http://localhost:5173/*"}, (tabs) => {
            if (tabs && tabs.length > 0) {
                chrome.scripting.executeScript({
                    target: {tabId: tabs[0].id},
                    func: () => localStorage.getItem('token')
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        apiToken = results[0].result;
                        console.log("Akses Token didapatkan.");
                    }
                });
            }
        });
    }
});
