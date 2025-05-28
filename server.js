// server.js
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000; // Port server

// ### KONFIGURASI ###
// Daftar domain yang diizinkan untuk melakukan operasi CUD (Create, Update, Delete)
// Ganti dengan domain Anda yang sebenarnya.
// Contoh: ['https://blogsaya.com', 'https://admin.blogsaya.com']
const allowedDomainsForCRUD = ['http://localhost:5500', 'http://127.0.0.1:5500']; // Tambahkan domain frontend Anda

// Direktori untuk menyimpan gambar
const imagesDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// ### MIDDLEWARE ###

// Middleware CORS
// Izinkan semua domain untuk GET request (membaca gambar)
// Untuk POST, DELETE (CRUD), akan dicek lebih lanjut oleh middleware `checkDomain`
app.use(cors({
    origin: function (origin, callback) {
        // Jika request tidak memiliki origin (misalnya request dari Postman atau server-ke-server tanpa origin header),
        // atau jika origin ada di daftar yang diizinkan, maka izinkan.
        // Untuk GET request, kita bisa lebih longgar atau tetap ketat sesuai kebutuhan.
        // Di sini kita akan membiarkan middleware `checkDomain` yang lebih spesifik menangani otorisasi CRUD.
        callback(null, true);
    }
}));

// Middleware untuk menyajikan file statis (gambar yang sudah diproses)
// Ini akan membuat gambar bisa diakses melalui URL, contoh: http://localhost:3000/images/namafile.webp
app.use('/images', express.static(imagesDir));

// Middleware untuk parsing JSON body (jika ada endpoint yang menerima JSON)
app.use(express.json());

// Middleware untuk mengecek domain yang diizinkan untuk operasi CRUD
const checkDomain = (req, res, next) => {
    const origin = req.headers.origin;
    // Hanya lakukan pengecekan untuk metode yang bersifat CRUD
    if (['POST', 'DELETE', 'PUT', 'PATCH'].includes(req.method)) {
        if (origin && allowedDomainsForCRUD.includes(origin)) {
            next(); // Domain diizinkan, lanjutkan
        } else {
            console.warn(`Akses CRUD ditolak dari domain: ${origin || 'Tidak diketahui'}`);
            return res.status(403).json({ message: 'Forbidden: Akses dari domain ini tidak diizinkan.' });
        }
    } else {
        next(); // Untuk metode lain (seperti GET), izinkan
    }
};

// ### PENGATURAN MULTER UNTUK UPLOAD FILE ###
// Simpan file sementara di memori sebelum diproses oleh sharp
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Batas ukuran file 10MB
    fileFilter: (req, file, cb) => {
        // Filter jenis file yang diizinkan (jpeg, png, gif, webp)
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Jenis file tidak valid. Hanya gambar yang diizinkan.'), false);
        }
    }
});

// ### ROUTES ###

/**
 * @route   POST /upload
 * @desc    Upload gambar, konversi ke WebP, dan simpan
 * @access  Hanya domain yang diizinkan (via checkDomain middleware)
 */
app.post('/upload', checkDomain, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file gambar yang diunggah.' });
    }

    try {
        const originalName = path.parse(req.file.originalname).name;
        const uniqueFilename = `${originalName}-${uuidv4()}.webp`;
        const outputPath = path.join(imagesDir, uniqueFilename);

        // Konversi ke WebP menggunakan sharp
        await sharp(req.file.buffer)
            .webp({ quality: 80 }) // Sesuaikan kualitas WebP sesuai kebutuhan (0-100)
            .toFile(outputPath);

        // URL untuk mengakses gambar (sesuaikan dengan domain CDN Anda saat production)
        // Untuk pengembangan lokal:
        const imageUrl = `${req.protocol}://${req.get('host')}/images/${uniqueFilename}`;
        // Untuk production (ganti cdn.blogwira.my.id dengan domain CDN Anda):
        // const imageUrl = `https://cdn.blogwira.my.id/images/${uniqueFilename}`;

        res.status(201).json({
            message: 'Gambar berhasil diunggah dan dikonversi ke WebP.',
            filename: uniqueFilename,
            url: imageUrl
        });

    } catch (error) {
        console.error('Error saat memproses gambar:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat memproses gambar.', error: error.message });
    }
});

/**
 * @route   DELETE /delete/:filename
 * @desc    Hapus gambar dari server
 * @access  Hanya domain yang diizinkan (via checkDomain middleware)
 */
app.delete('/delete/:filename', checkDomain, (req, res) => {
    const filename = req.params.filename;
    // Validasi sederhana untuk mencegah directory traversal
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: 'Nama file tidak valid.' });
    }

    const filePath = path.join(imagesDir, filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ message: 'File tidak ditemukan.' });
            }
            console.error('Error saat menghapus file:', err);
            return res.status(500).json({ message: 'Gagal menghapus file.' });
        }
        res.status(200).json({ message: 'File berhasil dihapus.' });
    });
});

// Route default untuk mengecek apakah server berjalan
app.get('/', (req, res) => {
    res.send('Server CDN Sederhana berjalan!');
});

// Penanganan error global untuk multer (jika ada error saat filter file, dll)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});


// Jalankan server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Images will be served from directory: ${imagesDir}`);
    console.log(`Allowed domains for CRUD: ${allowedDomainsForCRUD.join(', ')}`);
});