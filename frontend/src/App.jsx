import React, { useState, useRef } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  
  // State Kliping
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);
  const videoRef = useRef(null);

  // Upload Handler
  const handleUpload = async (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    
    // Preview lokal sebelum upload selesai (Instant feedback)
    setVideoSrc(URL.createObjectURL(selected));

    const formData = new FormData();
    formData.append('video', selected);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      setUploadedFilename(res.data.filename);
    } catch (err) {
      alert('Upload failed');
    }
  };

  // Logic Scrubbing & Preview
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    // Loop jika melewati endTime
    if (videoRef.current.currentTime > endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = startTime;
    }
  };
  
const [statusMessage, setStatusMessage] = useState(''); // "Menunggu antrean...", "Memproses..."
  
const processClip = async () => {
    setProcessing(true);
    setStatusMessage('Mendaftarkan antrean...');
    setDownloadUrl('');

    try {
      const clipDuration = endTime - startTime;
      
      // 1. Request Kliping (Dapat Job ID)
      const res = await axios.post('http://localhost:5000/api/clip', {
        filename: uploadedFilename,
        startTime,
        duration: clipDuration,
        options: { format: 'mp4' }
      });

      const { jobId } = res.data;
      setStatusMessage('Menunggu giliran...');

      // 2. Mulai Polling Status setiap 2 detik
      const intervalId = setInterval(async () => {
        try {
          const statusRes = await axios.get(`http://localhost:5000/api/status/${jobId}`);
          const { state, result } = statusRes.data;

          if (state === 'completed') {
            // Selesai!
            clearInterval(intervalId);
            setDownloadUrl(`http://localhost:5000${result.downloadUrl}`);
            setStatusMessage('Selesai!');
            setProcessing(false);
          } else if (state === 'failed') {
            // Gagal
            clearInterval(intervalId);
            alert('Proses gagal di server.');
            setProcessing(false);
          } else if (state === 'active') {
            setStatusMessage('Sedang memproses video...');
          } else if (state === 'waiting') {
            setStatusMessage(`Dalam antrean...`); 
          }
        } catch (error) {
          console.error("Polling error", error);
          clearInterval(intervalId);
          setProcessing(false);
        }
      }, 2000); // Cek setiap 2 detik

    } catch (err) {
      alert('Gagal menghubungi server.');
      setProcessing(false);
    }
};

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">ClipStream Self-Hosted</h1>

      {/* Upload Section */}
      <div className="mb-6">
        <input 
          type="file" 
          onChange={handleUpload} 
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </div>

      {videoSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player & Editor */}
          <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg">
            <video 
              ref={videoRef}
              src={videoSrc} 
              controls 
              className="w-full rounded mb-4"
              onTimeUpdate={handleTimeUpdate}
            />
            
            {/* Simple Timeline Controls */}
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-xs text-gray-400">Start (s)</label>
                <input 
                  type="number" 
                  value={startTime} 
                  onChange={(e) => {
                    setStartTime(Number(e.target.value));
                    videoRef.current.currentTime = Number(e.target.value);
                  }}
                  className="bg-gray-700 p-2 rounded w-24"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400">End (s)</label>
                <input 
                  type="number" 
                  value={endTime} 
                  onChange={(e) => setEndTime(Number(e.target.value))} 
                  className="bg-gray-700 p-2 rounded w-24"
                />
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-gray-800 p-4 rounded-lg h-fit">
            <h2 className="text-xl font-bold mb-4">Export Settings</h2>
            {/* Tambahkan Form Select untuk Resolusi/Format disini */}
            
            <button 
  onClick={processClip}
  disabled={!uploadedFilename || processing}
  className={`w-full py-4 rounded-lg font-bold text-lg ... (style sebelumnya)`}
>
  {processing ? (
    <span className="flex items-center justify-center gap-2">
       {/* Icon spinner */}
       <svg className="animate-spin h-5 w-5 text-white" ...></svg>
       {statusMessage} {/* Tampilkan pesan dinamis */}
    </span>
  ) : '✂️ Export Clip'}
</button>

            {downloadUrl && (
              <a 
                href={downloadUrl} 
                download 
                className="block mt-4 text-center bg-blue-500 py-2 rounded text-white"
              >
                Download Result
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
