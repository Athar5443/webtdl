document.getElementById('downloadForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const url = document.getElementById('url').value;
    const format = document.getElementById('format').value;

    // Tentukan endpoint API berdasarkan format (video atau audio)
    let apiUrl;
    if (format === 'mp4') {
        apiUrl = `https://fgsi-ytdl.hf.space/?url=${encodeURIComponent(url)}`;
    } else if (format === 'mp3') {
        apiUrl = `https://api.maelyn.tech/api/youtube/audio?url=${encodeURIComponent(url)}&apikey=AtharBotz`;
    }

    // Mengirim permintaan ke API eksternal
    fetch(apiUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to download. Please check the URL and try again.');
        }
        return response.blob();
    })
    .then(blob => {
        // Membuat objek URL untuk file yang diunduh
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `download.${format}`;
        link.style.display = 'none';

        // Memulai download otomatis tanpa interaksi lebih lanjut
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);  // Menghapus link setelah download dimulai
    })
    .catch(error => {
        document.getElementById('error-message').innerText = error.message;
    });
});
