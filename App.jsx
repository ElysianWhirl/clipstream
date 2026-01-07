import React, { useState, useRef } from 'react';
import axios from 'axios';
import Timeline from './components/Timeline'; // Import komponen baru
import { formatTime } from './utils/formatTime';

function App() {
  const [file, setFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [processing, setProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');

  // State Waktu
  const [duration, setDuration] = useState(0); // Total durasi video asli
  const [currentTime, setCurrentTime] = useState(0); // Posisi playback saat ini
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  
  const videoRef = useRef(null);

  const handleUpload = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setVideoSrc(url);
    
    // Reset state saat file baru masuk
    setDownloadUrl('');
    setStartTime(0);
    setEndTime(0);
    setDuration(0);

    // Upload Background process
    const formData = new FormData();
    formData.append('video', selected);
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData);
      setUploadedFilename(res.data.filename);
    } catch (err) {
      console.error(err);
      alert('Gagal mengupload video');
    }
  };

  // Saat metadata video (durasi) dimuat
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration;
      setDuration(vidDuration);
      setEndTime(vidDuration); // Default clip adalah full video
    }
  };

  // Sinkronisasi Video -> State (Playhead berjalan)
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Loop logic: Jika video melewati batas akhir klip, kembalikan ke awal klip
    if (curr > endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = startTime;
    }
  };

  // Sinkronisasi Timeline -> Video (User geser slider)
  const handleRangeChange = ([newStart, newEnd]) => {
    setStartTime(newStart);
    setEndTime(newEnd);

    // Jika user menggeser handle Start, lompatkan video ke titik itu agar mudah dipreview
    if (Math.abs(newStart - startTime) > 0.1) {
      videoRef.current.currentTime = newStart;
    }
  };

  const processClip = async () => {
    setProcessing(true);
    try {
      const clipDuration = endTime - startTime;
      const res = await axios.post('http://localhost:5000/api/clip', {
        filename: uploadedFilename,
        startTime,
        duration: clipDuration,
        options: { format: 'mp4' }
      });
      setDownloadUrl(`http://localhost:5000${res.data.downloadUrl}`);
    } catch (err) {
      alert('Terjadi kesalahan saat memproses video.');
    }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-blue-500">ClipStream <span className="text-gray-400 text-lg">Self-Hosted</span></h1>
        </header>

        {/* Upload Area */}
        <div className="mb-8">
          <label className="block mb-2 font-medium text-gray-300">Pilih Video Lokal</label>
          <input 
            type="file" 
            accept="video/*"
            onChange={handleUpload} 
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-gray-800 rounded-lg border border-gray-700"
          />
        </div>

        {videoSrc && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Kolom Kiri: Player & Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800 relative group">
                <video 
                  ref={videoRef}
                  src={videoSrc} 
                  controls={false} // Kita bisa menyembunyikan kontrol bawaan jika mau
                  className="w-full max-h-[500px] object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onClick={(e) => e.target.paused ? e.target.play() : e.target.pause()} // Click to play/pause
                />
                
                {/* Custom Play Overlay (Opsional) */}
                {!processing && (
                  <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                     {/* Anda bisa menambahkan tombol Play/Pause custom di sini */}
                  </div>
                )}
              </div>

              {/* Timeline Component yang baru kita buat */}
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
                <Timeline 
                  duration={duration}
                  startTime={startTime}
                  endTime={endTime}
                  currentTime={currentTime}
                  onRangeChange={handleRangeChange}
                />
                
                {/* Kontrol Presisi Manual (Opsional, untuk fine-tuning) */}
                <div className="flex justify-between mt-4 text-sm">
                   <button 
                     onClick={() => videoRef.current.currentTime = startTime} 
                     className="text-blue-400 hover:text-blue-300"
                   >
                     Preview Start
                   </button>
                   <div className="text-gray-400">
                     Start: {startTime.toFixed(2)}s — End: {endTime.toFixed(2)}s
                   </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Action Panel */}
            <div className="bg-gray-800 p-6 rounded-lg h-fit border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                ⚙️ Export Settings
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-700 rounded text-center">
                  <p className="text-sm text-gray-400">Estimasi Durasi Klip</p>
                  <p className="text-2xl font-bold text-white">{formatTime(endTime - startTime)}</p>
                </div>

                <button 
                  onClick={processClip}
                  disabled={!uploadedFilename || processing}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] ${
                    processing 
                    ? 'bg-gray-600 cursor-not-allowed opacity-75' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Rendering...
                    </span>
                  ) : '✂️ Export Clip'}
                </button>

                {downloadUrl && (
                  <div className="animate-fade-in-up mt-4">
                    <a 
                      href={downloadUrl} 
                      download 
                      className="block w-full py-3 text-center bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-500/20"
                    >
                      ⬇️ Download Result
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
