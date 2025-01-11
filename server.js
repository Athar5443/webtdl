const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ytdl = require('ytdl-core');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Endpoint untuk mendownload video
app.post('/api/download', async (req, res) => {
    const { url, format } = req.body;

    if (!url || !format) {
        return res.status(400).json({ message: 'URL and format are required.' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title;

        const stream = ytdl(url, { filter: format === 'mp3' ? 'audioonly' : 'video' });
        res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
        stream.pipe(res);
    } catch (error) {
        res.status(500).json({ message: 'Failed to process the request.', error: error.message });
    }
});

// Jalankan server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});