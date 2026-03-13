const API_KEY = "cea0d19ea30487a13953173dc3eb6c0c";
const BASE_URL = "https://api.themoviedb.org/3";
const GENRES = {
    Action: 28,
    Comedy: 35,
    Drama: 18,
    Horror: 27,
    Romance: 10749,
    ScienceFiction: 878,
    Animation: 16,
    Thriller: 53,
    Crime: 80,
    Documentary: 99,
    Fantasy: 14,
    Western: 37,
    War: 10752
};

const genreContainer = document.getElementById("genre-container");
const overlay = document.getElementById("overlay");
const movieImg = document.getElementById("movie-img");
const movieTitle = document.getElementById("movie-title");
const movieDescription = document.getElementById("movie-description");

let currentMovie = null;

// Fetch movies for each genre
async function fetchMoviesByGenre(genreId) {
    const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
    const data = await response.json();
    return data.results;
}

// Display all genre sections
async function displayGenres() {
    for (const genreName in GENRES) {
        const genreId = GENRES[genreName];
        const movies = await fetchMoviesByGenre(genreId);

        const genreSection = document.createElement("div");
        genreSection.className = "genre-section";

        const title = document.createElement("h2");
        title.textContent = genreName.replace(/([A-Z])/g, " $1").trim();

        const movieGrid = document.createElement("div");
        movieGrid.className = "movie-grid";

        movies.slice(0, 6).forEach(movie => {
            const card = document.createElement("div");
            card.className = "movie-card";
            card.addEventListener("click", () => showOverlay(movie));

            const img = document.createElement("img");
            img.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            img.alt = movie.title;

            const name = document.createElement("h3");
            name.textContent = movie.title;

            card.appendChild(img);
            card.appendChild(name);
            movieGrid.appendChild(card);
        });

        genreSection.appendChild(title);
        genreSection.appendChild(movieGrid);
        genreContainer.appendChild(genreSection);
    }
}

// Show movie info overlay
function showOverlay(movie) {
    movieImg.src = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    movieTitle.textContent = movie.title;
    movieDescription.textContent = movie.overview || "No description available.";
    overlay.classList.add("active");

    currentMovie = {
        tmdbId: movie.id,
        mediaType: "movie"
    };
}

// Hide overlay on outside click
overlay.addEventListener("click", e => {
    if (e.target === overlay) {
        overlay.classList.remove("active");
    }
});

// Play movie button logic
function playMovie() {
    if (!currentMovie) return;
    localStorage.setItem("embedDetails", JSON.stringify(currentMovie));
    window.location.href = "index.html";
}

// Attach the playMovie function globally for the HTML onclick
window.playMovie = playMovie;

// Navigate back to home
function goHome() {
    window.location.href = "index.html";
}
window.goHome = goHome;

// Initialize
displayGenres();
