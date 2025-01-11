const ytdl = require('ytdl-core');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { url, format } = req.body;

        if (!url || !format) {
            return res.status(400).json({ message: 'URL and format are required.' });
        }

        // Periksa apakah URL valid
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ message: 'Invalid YouTube URL.' });
        }

        try {
            const info = await ytdl.getInfo(url);
            const title = info.videoDetails.title;

            const filter = format === 'mp3' ? 'audioonly' : 'video';
            const stream = ytdl(url, { filter });

            res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
            res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
            stream.pipe(res);

            stream.on('error', (error) => {
                res.status(500).json({ message: 'Streaming error occurred.', error: error.message });
            });

        } catch (error) {
            res.status(500).json({ message: 'Failed to process the request.', error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};