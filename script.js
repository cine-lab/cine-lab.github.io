document.addEventListener("DOMContentLoaded", () => {
    const greeter = document.getElementById("greeter");
    const searchBar = document.getElementById("search-bar");
    const results = document.getElementById("results");
    const embedContainer = document.getElementById("embed-container");
    const m3u8DownloadButton = document.getElementById("m3u8-download");
    const container = document.getElementById('leave-note-container');

    // Create the form HTML
    container.innerHTML = `
    <h3>Leave a note for the creator</h3>
    <textarea id="note-text" placeholder="Write your note..." rows="5" style="width:100%;padding:8px;margin-bottom:8px;"></textarea>
    <button id="send-note">Send Note</button>
    <p id="note-message" style="margin-top:8px;"></p>
    `;

    // Add click handler
    document.getElementById('send-note').addEventListener('click', async () => {
    const note = document.getElementById('note-text').value;
    const messageEl = document.getElementById('note-message');
    messageEl.textContent = '';

    if (!note) {
        messageEl.textContent = 'Please enter a note.';
        return;
    }

    try {
        // Replace this URL with your Vercel API route
        const res = await fetch('/api/leave-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
        });

        const data = await res.json();
        if (res.ok) {
        messageEl.style.color = 'green';
        messageEl.textContent = data.message || 'Note sent!';
        document.getElementById('note-text').value = '';
        } else {
        messageEl.style.color = 'red';
        messageEl.textContent = data.error || 'Failed to send note.';
        }
    } catch (err) {
        messageEl.style.color = 'red';
        messageEl.textContent = 'Error sending note.';
        console.error(err);
    }
    });


    let currentEmbed = null;
    let blockPatterns = [];

    const EASYLIST_URL = "https://easylist.to/easylist/easylist.txt";
    const EASYPRIVACY_URL = "https://easylist.to/easylist/easyprivacy.txt";
    const API_KEY = "cea0d19ea30487a13953173dc3eb6c0c";
    const BASE_URL = "https://api.themoviedb.org/3";

    function updateGreeter() {
        const hours = new Date().getHours();
        let timeMessage = "morning";
        if (hours >= 12 && hours < 18) timeMessage = "afternoon";
        else if (hours >= 18 && hours < 21) timeMessage = "evening";
        else if (hours >= 21 || hours < 6) timeMessage = "tonight";
        greeter.textContent = hours >= 21 || hours < 6
            ? `What would you like to watch ${timeMessage}?`
            : `What would you like to watch this ${timeMessage}?`;
    }
    updateGreeter();

    async function searchMovies(query) {
        if (!query.trim()) {
            results.innerHTML = "";
            return;
        }
        try {
            const response = await fetch(
                `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=ar`
            );
            const data = await response.json();
            const filteredResults = data.results.filter(item => {
                const title = item.title || item.name || "";
                const originalName = item.original_title || item.original_name || "";
                return title.toLowerCase().includes(query.toLowerCase()) ||
                       originalName.toLowerCase().includes(query.toLowerCase());
            });
            displayResults(filteredResults);
        } catch (error) {
            console.error("Error searching movies:", error);
            results.innerHTML = "<div>Error searching movies</div>";
        }
    }

    function displayResults(items) {
        results.innerHTML = items
            .slice(0, 10)
            .map(item => {
                const title = item.original_title || item.original_name || item.title || item.name || "Unknown Title";
                const releaseDate = item.release_date || item.first_air_date || "";
                const year = releaseDate ? ` (${new Date(releaseDate).getFullYear()})` : "";
                const mediaType = item.media_type || "movie";
                const tmdbId = item.id;
                return `<div class="result-item" data-id="${tmdbId}" data-type="${mediaType}">${title}${year}</div>`;
            })
            .join("");
        results.style.display = "block";
        document.querySelectorAll(".result-item").forEach(item => {
            item.addEventListener("click", () => {
                const tmdbId = item.getAttribute("data-id");
                const mediaType = item.getAttribute("data-type");
                embedVideoWithBlocklist(tmdbId, mediaType);
                results.style.display = "none";
            });
        });
    }

    async function fetchAndParseBlocklist(url) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            return parseAdblockFilters(text);
        } catch (error) {
            console.error(`Failed to fetch blocklist from ${url}:`, error);
            return [];
        }
    }

    function parseAdblockFilters(filterText) {
        const lines = filterText.split("\n");
        return lines
            .filter(line => line && !line.startsWith("!") && !line.startsWith("["))
            .map(line => line.trim());
    }

    function matchesBlockPattern(url) {
        return blockPatterns.some(pattern => {
            try {
                const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\^/g, "\\b"));
                return regex.test(url);
            } catch {
                return false;
            }
        });
    }

    async function loadBlocklists() {
        const easylistPatterns = await fetchAndParseBlocklist(EASYLIST_URL);
        const easyPrivacyPatterns = await fetchAndParseBlocklist(EASYPRIVACY_URL);
        blockPatterns = [...easylistPatterns, ...easyPrivacyPatterns];
        console.log(`Loaded ${blockPatterns.length} block patterns`);
    }

    function monitorIframeRequests(iframe) {
        iframe.contentWindow?.addEventListener("click", (event) => {
            const targetElement = event.target;
            const src = targetElement.getAttribute("src");
            if (src && matchesBlockPattern(src)) {
                event.preventDefault();
                console.log(`Blocked ad: ${src}`);
            }
        });
    }

    function embedVideoWithBlocklist(tmdbId, mediaType) {
        const baseEmbedURL = "https://vidsrc.cc/v2/embed";
        const typePath = mediaType === "movie" ? "movie" : "tv";
        const embedURL = `${baseEmbedURL}/${typePath}/${tmdbId}`;
        const iframe = document.createElement("iframe");
        iframe.src = embedURL;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "");
        iframe.style.cssText = `
            width: 100%; 
            aspect-ratio: 16/9; 
            margin-top: 1rem; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        `;
        iframe.sandbox = "allow-scripts allow-same-origin";
        iframe.addEventListener("load", () => {
            monitorIframeRequests(iframe);
        });

        embedContainer.innerHTML = "";
        embedContainer.appendChild(iframe);
        embedContainer.style.display = "block";
        m3u8DownloadButton.style.display = "block";

        m3u8DownloadButton.onclick = async () => {
            const m3u8Url = await extractM3U8FromIframe(embedURL);
            if (m3u8Url) {
                downloadFromM3U8(m3u8Url);
            } else {
                alert("Couldn't auto-detect a .m3u8 stream.");
            }
        };
    }

    async function extractM3U8FromIframe(embedURL) {
        try {
            const res = await fetch(embedURL);
            const html = await res.text();
            const match = html.match(/https?:\/\/[^\s"'<>]+\.m3u8/);
            if (match) {
                console.log("Auto-detected .m3u8:", match[0]);
                return match[0];
            }
        } catch (err) {
            console.error("Failed to extract .m3u8:", err);
        }
        return null;
    }

    async function downloadFromM3U8(m3u8Url, filename = "movie.ts") {
        try {
            const res = await fetch(m3u8Url);
            const text = await res.text();
            const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf("/") + 1);
            const segments = text
                .split("\n")
                .filter(line => line.trim() && !line.startsWith("#"))
                .map(line => new URL(line, baseUrl).href);

            const buffers = [];
            for (let i = 0; i < segments.length; i++) {
                const segRes = await fetch(segments[i]);
                const buf = await segRes.arrayBuffer();
                buffers.push(new Uint8Array(buf));
            }

            const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
            const video = new Uint8Array(totalLength);
            let offset = 0;
            for (const b of buffers) {
                video.set(b, offset);
                offset += b.length;
            }

            const blob = new Blob([video], { type: "video/mp2t" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download error:", err);
            alert("Could not download video.");
        }
    }

    searchBar.addEventListener("input", () => {
        embedContainer.style.display = "none";
        searchMovies(searchBar.value);
    });

    searchBar.addEventListener("blur", () => {
        setTimeout(() => {
            if (currentEmbed && !results.querySelector(".result-item:hover")) {
                results.style.display = "none";
                embedContainer.style.display = "block";
            }
        }, 200);
    });

    document.getElementById("catalogue-button").addEventListener("click", () => {
        window.location.href = "catalogue.html";
    });

    const embedDetails = localStorage.getItem("embedDetails");
    if (embedDetails) {
        const { tmdbId, mediaType } = JSON.parse(embedDetails);
        embedVideoWithBlocklist(tmdbId, mediaType);
        localStorage.removeItem("embedDetails");
    }

    loadBlocklists();
});