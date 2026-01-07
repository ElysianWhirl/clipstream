const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const path = require('path');
const { processVideo } = require('./ffmpegHelper');

// Koneksi ke Redis Container
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

// 1. Definisikan Antrean (Producer)
const videoQueue = new Queue('video-processing', { connection });

// 2. Definisikan Worker (Consumer)
// concurrency: 1 artinya hanya kerjakan 1 video dalam satu waktu.
const worker = new Worker('video-processing', async (job) => {
  const { inputPath, outputPath, startTime, duration, options } = job.data;
  
  // Update progress (opsional, bisa dibaca frontend)
  await job.updateProgress(10);
  
  console.log(`[Job ${job.id}] Memulai proses: ${path.basename(inputPath)}`);
  
  try {
    // Jalankan FFmpeg
    await processVideo(inputPath, outputPath, startTime, duration, options);
    
    await job.updateProgress(100);
    console.log(`[Job ${job.id}] Selesai!`);
    
    // Return hasil yang akan dikirim ke user nanti
    return { downloadUrl: `/exports/${path.basename(outputPath)}` };
    
  } catch (error) {
    console.error(`[Job ${job.id}] Gagal:`, error);
    throw error;
  }
}, { 
  connection,
  concurrency: 1 // Ubah angka ini jika server Anda punya banyak CPU Core (misal: 2 atau 4)
});

module.exports = { videoQueue };
