const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processVideo } = require('./ffmpegHelper');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files untuk preview (Hati-hati di production, gunakan nginx/token)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// Konfigurasi Multer (Upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // Batas 2GB
});

// Routes
app.post('/api/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    res.json({ filename: req.file.filename, path: req.file.path });
});

app.post('/api/clip', async (req, res) => {
    try {
        const { filename, startTime, duration, options } = req.body;
        
        // Sanitasi input dasar (Security)
        const safeFilename = path.basename(filename);
        const inputPath = path.join(__dirname, '../uploads', safeFilename);
        
        if (!fs.existsSync(inputPath)) return res.status(404).send('File not found');

        const outputFilename = `clip-${Date.now()}.${options.format || 'mp4'}`;
        const outputPath = path.join(__dirname, '../exports', outputFilename);

        await processVideo(inputPath, outputPath, startTime, duration, options);

        res.json({ 
            success: true, 
            downloadUrl: `/exports/${outputFilename}` 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
