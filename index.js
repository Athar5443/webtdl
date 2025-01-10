/* script website downloader YouTube by noval wa.me/6285336580720 */

const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const yts = require('yt-search')
const agent = ytdl.createAgent(JSON.parse(fs.readFileSync("./seeleVollerei/cookies-yt.json")));
const app = express();
const PORT = 3030;

app.use(express.static('public'));

const ipDataFile = 'infoip.json';

// Muat data IP dari file, jika tidak ada, gunakan objek kosong
let ipData = fs.existsSync(ipDataFile) ? JSON.parse(fs.readFileSync(ipDataFile, 'utf8')) : {};

// Simpan data IP ke file
const saveIPData = () => {
    fs.writeFileSync(ipDataFile, JSON.stringify(ipData, null, 2), 'utf8');
};

// Reset data IP setiap 1 minggu
setInterval(() => {
    ipData = {};
    saveIPData();
    console.log('IP data has been reset.');
}, 7 * 24 * 60 * 60 * 1000); // 1 minggu

app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Muat data untuk IP tersebut atau inisialisasi
    if (!ipData[ip]) {
        ipData[ip] = { requests: 0, banned: false };
    }

    // Jika IP diblokir
    if (ipData[ip].banned) {
        return res.status(403).send('Access denied. Your IP is banned.');
    }

    // Tingkatkan jumlah permintaan
    ipData[ip].requests += 1;

    // Jika melebihi batas, larang IP
    if (ipData[ip].requests > 500) {
        ipData[ip].banned = true;
        console.log(`IP ${ip} has been banned for exceeding the request limit.`);
    }

    // Simpan perubahan ke file
    saveIPData();

    next();
});


let bannedIPs = JSON.parse(fs.readFileSync('bannip.json', 'utf8') || '[]');

const saveBannedIPs = () => {
    fs.writeFileSync('bannip.json', JSON.stringify(bannedIPs, null, 2), 'utf8');
};

const ipRequests = {};
const unbanTimers = {};

app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (bannedIPs.includes(ip)) {
        return res.status(403).send('Access denied. Your IP is banned.');
    }

    const currentTime = Date.now();
    if (!ipRequests[ip]) {
        ipRequests[ip] = [];
    }

    ipRequests[ip].push(currentTime);
    ipRequests[ip] = ipRequests[ip].filter(timestamp => currentTime - timestamp <= 60000);

    if (ipRequests[ip].length > 5) {
        bannedIPs.push(ip);
        saveBannedIPs();

        unbanTimers[ip] = setTimeout(() => {
            const index = bannedIPs.indexOf(ip);
            if (index !== -1) {
                bannedIPs.splice(index, 1);
                saveBannedIPs();
                console.log(`IP ${ip} has been unbanned.`);
            }
            delete unbanTimers[ip];
        }, 5 * 60 * 1000); // 5 minutes

        return res.status(403).send('Your IP is temporarily banned for 5 minutes due to spam.');
    }

    next();
});

const logRequestDetails = (req, type, status, extraDetails = {}) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const time = moment().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
    const url = req.query.url || 'N/A';
    const resolution = extraDetails.resolution || 'N/A';
    const duration = extraDetails.duration || 'N/A';
    const fileSize = extraDetails.fileSize || 'N/A';

    const border = "╔" + "═".repeat(65) + "╗";
    const footer = "╚" + "═".repeat(65) + "╝";
    const paddedText = (text) => `║ ${text.padEnd(63)} ║`;

    const logMessage = [
        border,
        paddedText(`Time       : ${time}`),
        paddedText(`IP         : ${ip}`),
        paddedText(`YouTube URL: ${url}`),
        paddedText(`Type       : ${type}`),
        paddedText(`Resolution : ${resolution}`),
        paddedText(`Duration   : ${duration}`),
        paddedText(`File Size  : ${fileSize}`),
        paddedText(`Status     : ${status}`),
        paddedText(" "),
        paddedText(`©Nauval Sada unesa`),
        footer
    ].join('\n');

    console.log(logMessage);
};


app.get('/search', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const searchResult = await yts(query);

        
        const videos = searchResult.videos.slice(0, 10).map(video => ({
            title: video.title,
            url: video.url,
            duration: video.timestamp,
            views: video.views,
            thumbnail: video.thumbnail,
            uploaded: video.ago,
            author: video.author.name,
        }));

        res.json({ query, videos });
    } catch (error) {
        console.error('Error fetching search results:', error.message);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

app.get('/info', async (req, res) => {
    const url = req.query.url;
    if (!url || !ytdl.validateURL(url)) {
        logRequestDetails(req, 'info', 'Failed: Invalid URL');
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(url, { agent });
        const videoDetails = info.videoDetails;

        const response = {
            title: videoDetails.title,
            uploader: videoDetails.author.name,
            thumbnail: videoDetails.thumbnails[0].url,
            duration: new Date(videoDetails.lengthSeconds * 1000).toISOString().substr(11, 8),
            resolutions: info.formats
                .filter(f => f.hasVideo && f.container === 'mp4')
                .map(f => ({ height: f.height, size: (f.contentLength / (1024 * 1024)).toFixed(2) + ' MB' }))
                .filter((value, index, self) => self.findIndex(v => v.height === value.height) === index)
                .sort((a, b) => b.height - a.height),
            audioBitrates: info.formats
                .filter(f => f.hasAudio)
                .map(f => ({ bitrate: f.audioBitrate, size: (f.contentLength / (1024 * 1024)).toFixed(2) + ' MB' }))
                .filter((value, index, self) => self.findIndex(v => v.bitrate === value.bitrate) === index)
                .sort((a, b) => b.bitrate - a.bitrate)
        };

        logRequestDetails(req, 'info', 'Success', {
            resolution: 'N/A',
            duration: response.duration,
            fileSize: 'N/A'
        });

        res.json(response);
    } catch (error) {
        logRequestDetails(req, 'info', `Failed: ${error.message}`);
        console.error('Error fetching YouTube video info:', error);
        res.status(500).json({ error: 'Error fetching video info' });
    }
});


app.get('/download', async (req, res) => {
    const url = req.query.url;
    const resolution = parseInt(req.query.resolution, 10);
    if (!url || !ytdl.validateURL(url)) {
        logRequestDetails(req, 'download', 'Failed: Invalid URL');
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const info = await ytdl.getInfo(url, { agent })
        const videoDetails = info.videoDetails;

        const videoFormat = info.formats.find(f => f.height === resolution && f.container === 'mp4');
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

        if (!videoFormat) {
            throw new Error('No suitable video format found.');
        }
        if (!audioFormat) {
            throw new Error('No suitable audio format found.');
        }

        const videoPath = path.join(__dirname, 'tmp', `video_${Date.now()}.mp4`);
        const audioPath = path.join(__dirname, 'tmp', `audio_${Date.now()}.mp4`);
        const outputPath = path.join(__dirname, 'tmp', `output_${Date.now()}.mp4`);

        await new Promise((resolve, reject) => {
            ytdl(url, { agent, format: videoFormat })
                .pipe(fs.createWriteStream(videoPath))
                .on('finish', resolve)
                .on('error', reject);
        });

        await new Promise((resolve, reject) => {
            ytdl(url, { agent, format: audioFormat })
                .pipe(fs.createWriteStream(audioPath))
                .on('finish', resolve)
                .on('error', reject);
        });

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoPath)
                .input(audioPath)
                .outputOptions(['-c:v copy', '-c:a aac', '-strict experimental'])
                .save(outputPath)
                .on('end', resolve)
                .on('error', reject);
        });

        const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);

        if (parseFloat(fileSizeMB) > 1500) {
            return res.status(400).send('File size exceeds the 1500 MB limit.');
        }

        res.download(outputPath, `${videoDetails.title}.mp4`, (err) => {
            if (!err) {
                logRequestDetails(req, 'download', 'Success', {
                    resolution: `${resolution}p`,
                    duration: videoDetails.lengthSeconds,
                    fileSize: `${fileSizeMB} MB`
                });
            } else {
                logRequestDetails(req, 'download', 'Failed: Download error', {
                    resolution: `${resolution}p`,
                    duration: videoDetails.lengthSeconds,
                    fileSize: `${fileSizeMB} MB`
                });
            }

            deleteFileAfterDelay(videoPath);
            deleteFileAfterDelay(audioPath);
            deleteFileAfterDelay(outputPath);
        });
    } catch (error) {
        logRequestDetails(req, 'download', `Failed: ${error.message}`);
        res.status(500).send(`Error downloading video: ${error.message}`);
    }
});

app.get('/ytflac', async (req, res) => {
    const input = req.query.input;

    if (!input) {
        return res.status(400).json({ error: 'Parameter input (URL atau judul video) harus disediakan.' });
    }

    try {
        let video;

        // Jika input adalah URL YouTube
        if (ytdl.validateURL(input)) {
            const videoInfo = await ytdl.getInfo(input, { agent })
            video = {
                url: input,
                title: videoInfo.videoDetails.title.replace(/[<>:"/\\|?*]+/g, ''), // Hapus karakter ilegal
                author: videoInfo.videoDetails.author.name,
                thumbnail: videoInfo.videoDetails.thumbnails[0].url
            };
        } else {
            // Jika input adalah judul video
            const searchResult = await yts(input);
            video = searchResult.videos[0]; // Pilih video teratas
        }

        const videoUrl = video.url;
        const outputDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const mp3Path = path.join(outputDir, `audio_${Date.now()}.mp3`);
        const flacPath = path.join(outputDir, `audio_${Date.now()}.flac`);

        // Unduh audio dalam format MP3
        await new Promise((resolve, reject) => {
            ytdl(videoUrl, { agent, filter: 'audioonly', quality: 'highestaudio' })
                .pipe(fs.createWriteStream(mp3Path))
                .on('finish', resolve)
                .on('error', reject);
        });

        // Konversi MP3 ke FLAC menggunakan ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(mp3Path)
                .output(flacPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // Hapus file MP3 sementara
        fs.unlinkSync(mp3Path);

        // Kirim file FLAC sebagai respons
        res.download(flacPath, `${video.title}.flac`, (err) => {
            if (err) {
                console.error('Error saat mengunduh file FLAC:', err.message);
            }

            // Hapus file FLAC setelah 10 menit
            setTimeout(() => {
                if (fs.existsSync(flacPath)) {
                    fs.unlinkSync(flacPath);
                }
            }, 10 * 60 * 1000);
        });
    } catch (error) {
        console.error('Error pada endpoint /ytflac:', error.message);
        res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan.' });
    }
});


app.get('/audio', async (req, res) => {
    const url = req.query.url;
    const bitrate = parseInt(req.query.bitrate, 10);
    if (!url || !ytdl.validateURL(url)) {
        logRequestDetails(req, 'audio', 'Failed: Invalid URL');
        return res.status(400).send('Invalid YouTube URL');
    }

    try {
        const info = await ytdl.getInfo(url, { agent })
        const videoDetails = info.videoDetails;

        const audioFormat = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly',
            audioBitrate: bitrate
        });

        if (!audioFormat) {
            throw new Error('No suitable audio format found.');
        }

        const audioPath = path.join(__dirname, 'tmp', `audio_${Date.now()}.mp3`);

        await new Promise((resolve, reject) => {
            ytdl(url, { agent, format: audioFormat })
                .pipe(fs.createWriteStream(audioPath))
                .on('finish', resolve)
                .on('error', reject);
        });

        const fileSizeMB = (fs.statSync(audioPath).size / (1024 * 1024)).toFixed(2);

        if (parseFloat(fileSizeMB) > 1200) {
            return res.status(400).send('Audio file size exceeds 1200 MB.');
        }

        res.download(audioPath, `${videoDetails.title}.mp3`, (err) => {
            if (err) {
                logRequestDetails(req, 'audio', 'Failed: Download error', {
                    bitrate: `${bitrate} kbps`,
                    fileSize: `${fileSizeMB} MB`
                });
            } else {
                logRequestDetails(req, 'audio', 'Success', {
                    bitrate: `${bitrate} kbps`,
                    fileSize: `${fileSizeMB} MB`
                });
            }

            deleteFileAfterDelay(audioPath);
        });
    } catch (error) {
        logRequestDetails(req, 'audio', `Failed: ${error.message}`);
        res.status(500).send(`Error downloading audio: ${error.message}`);
    }
});

const deleteFileAfterDelay = (filePath) => {
    setTimeout(() => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }, 10 * 60 * 1000); 
};

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});