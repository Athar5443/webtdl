document.getElementById("fetchData").addEventListener("click", function () {
    const youtubeUrl = document.getElementById("youtubeUrl").value;
    if (!youtubeUrl) {
        alert("Masukkan URL YouTube!");
        return;
    }

    const apiUrl = "https://api.betabotz.eu.org/api/download/ytmp4?";
    const apiKey = "AtharBotz";

    // Fetch video data
    fetch(`${apiUrl}?url=${youtubeUrl}&apikey=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === true) {
                // Show video info
                document.getElementById("infoSection").classList.remove("hidden");
                document.getElementById("title").textContent = data.title;
                document.getElementById("channel").textContent = data.channel;
                document.getElementById("views").textContent = data.views;
                document.getElementById("likes").textContent = data.likes;
                document.getElementById("subscribers").textContent = data.subscribers || "Tidak tersedia";

                // Show video preview
                const videoId = youtubeUrl.split("v=")[1];
                document.getElementById("previewVideo").src = `https://www.youtube.com/embed/${videoId}`;

                // Setup download buttons
                document.getElementById("downloadVideo").onclick = () => {
                    window.open(data.result.url);
                };
            } else {
                alert("Gagal mengambil data video!");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Terjadi kesalahan saat mengambil data.");
        });
});

// Audio download
document.getElementById("downloadAudio").addEventListener("click", function () {
    const youtubeUrl = document.getElementById("youtubeUrl").value;
    if (!youtubeUrl) {
        alert("Masukkan URL YouTube!");
        return;
    }

    const apiUrl = "https://api.neoxr.eu/api/youtube";
    const apiKey = "AtharBotz";

    fetch(`${apiUrl}?url=${youtubeUrl}&type=audio&quality=128kbps&apikey=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === true) {
                window.open(data.result.url);
            } else {
                alert("Gagal mengunduh audio!");
            }
        })
        .catch(err => {
            console.error(err);
            alert("Terjadi kesalahan saat mengunduh audio.");
        });
});
