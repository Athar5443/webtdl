const fetchInfoButton = document.getElementById('fetchInfo');
const searchButton = document.getElementById('searchButton');
const downloadMP4Button = document.getElementById('downloadMP4');
const downloadMP3Button = document.getElementById('downloadMP3');
const resultDiv = document.getElementById('result');
const searchResults = document.getElementById('searchResults');
const optionsDiv = document.getElementById('options');
const resolutionSelect = document.getElementById('resolution');
const bitrateSelect = document.getElementById('bitrate');

// Show loading spinner
function showLoading(element) {
  element.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i></div>';
}

// Format numbers
function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Search Videos
searchButton.addEventListener('click', async () => {
  const query = document.getElementById('search').value.trim();

  if (!query) {
    alert('Please enter a search query');
    return;
  }

  showLoading(searchResults);

  try {
    const response = await fetch(`https://ytdownloader.nvlgroup.my.id/search?q=${encodeURIComponent(query)}`;
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();

    if (data.videos.length === 0) {
      searchResults.innerHTML = '<div class="video-item">No videos found.</div>';
      return;
    }

    searchResults.innerHTML = data.videos.map(video => `
                    <div class="video-item">
                        <h3>${video.title}</h3>
                        <img src="${video.thumbnail}" alt="Thumbnail" loading="lazy">
                        <div class="video-info">
                            <p><i class="fas fa-clock"></i> ${video.duration}</p>
                            <p><i class="fas fa-eye"></i> ${formatNumber(video.views)} views</p>
                            <p><i class="fas fa-calendar"></i> ${video.uploaded}</p>
                            <p><i class="fas fa-user"></i> ${video.author}</p>
                        </div>
                        <a href="#" onclick="document.getElementById('url').value='${video.url}'; document.getElementById('fetchInfo').click(); return false;" 
                           class="btn btn-primary">
                            <i class="fas fa-download"></i> Download This Video
                        </a>
                    </div>
                `).join('');

  } catch (error) {
    searchResults.innerHTML = `
                    <div class="video-item">
                        <p><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</p>
                    </div>
                `;
  }
});

// Fetch Video Info
fetchInfoButton.addEventListener('click', async () => {
  const url = document.getElementById('url').value.trim();

  if (!url) {
    alert('Please enter a valid YouTube URL');
    return;
  }

  showLoading(resultDiv);
  optionsDiv.style.display = 'none';

  try {
    const response = await fetch(`/info?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();

    resultDiv.innerHTML = `
                    <div class="video-item">
                        <img src="${data.thumbnail}" alt="Thumbnail">
                        <div class="video-info">
                            <h3>${data.title}</h3>
                            <p><i class="fas fa-user"></i> ${data.uploader}</p>
                            <p><i class="fas fa-clock"></i> ${data.duration}</p>
                        </div>
                    </div>
                `;

    resolutionSelect.innerHTML = data.resolutions
      .map(r => `<option value="${r.height}">${r.height}p (${r.size})</option>`)
      .join('');

    bitrateSelect.innerHTML = data.audioBitrates
      .map(b => `<option value="${b.bitrate}">${b.bitrate} kbps (${b.size})</option>`)
      .join('');

    optionsDiv.style.display = 'block';

    downloadMP4Button.onclick = () => {
      const resolution = resolutionSelect.value;
        window.location.href = `https://api.maelyn.tech/api/youtube/video?url==${encodeURIComponent(url)}&apikey=AtharBotz`
    };

    downloadMP3Button.onclick = () => {
      const bitrate = bitrateSelect.value;
        window.location.href = `https://api.maelyn.tech/api/youtube/audio?url==${encodeURIComponent(url)}&apikey=AtharBotz`
    };

  } catch (error) {
    resultDiv.innerHTML = `
                    <div class="video-item">
                        <p><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</p>
                    </div>
                `;
    optionsDiv.style.display = 'none';
  }
});

// Background video handling
function updateBackgroundVideo() {
  const now = new Date();
  const wibHours = (now.getUTCHours() + 7) % 24;
  const videoElement = document.getElementById("backgroundVideo");

  if (wibHours >= 18 || wibHours < 4) {
    videoElement.src = "https://pomf2.lain.la/f/sq7h8yc.mp4"; // Night video
  } else if (wibHours >= 4 && wibHours < 6) {
    videoElement.src = "https://pomf2.lain.la/f/6a4w0jqv.mp4"; // Dawn video
  } else if (wibHours >= 6 && wibHours < 16) {
    videoElement.src = "https://pomf2.lain.la/f/m6j4fdpd.mp4"; // Day video
  } else if (wibHours >= 16 && wibHours < 18) {
    videoElement.src = "https://pomf2.lain.la/f/m6j4fdpd.mp4"; // Dusk video
  }

  // Ensure video plays and loops
  videoElement.play().catch(function(error) {
    console.log("Video autoplay failed:", error);
  });
}

// Update video source when page loads
updateBackgroundVideo();

// Update video every hour
setInterval(updateBackgroundVideo, 3600000); // 3600000 ms = 1 hour

// Handle video loading errors
document.getElementById("backgroundVideo").addEventListener('error', function(e) {
  console.log("Video loading error:", e);
  this.style.display = 'none';
  document.body.style.background = 'linear-gradient(135deg, #f4f4f9, #cfd9df)';
});
