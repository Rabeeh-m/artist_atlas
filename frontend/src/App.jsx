
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Wave from 'react-wavify';
import { debounce } from 'lodash';
import ArtistDetail from './ArtistDetail';

function App() {
  const [artists, setArtists] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Fetch Artists (Paginated)
  const fetchArtists = useCallback(async () => {
    if (searchQuery) return;
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/artists', {
        params: { page, per_page: perPage },
      });
      setArtists(response.data.artists);
      setTotal(response.data.total || 0);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch artists');
      setLoading(false);
    }
  }, [page, perPage, searchQuery]);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  // Search Artists (Debounced)
  const fetchSearchResults = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions([]);
        setSearchResults([]);
        setShowSuggestions(false);
        fetchArtists();
        return;
      }
      try {
        const response = await axios.get('http://localhost:8000/search', {
          params: { q: query, limit: 5 },
        });
        setSearchResults(response.data.results || []);
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
        setLoading(false);
      } catch (err) {
        setError('Failed to search artists');
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchSearchResults(searchQuery);
  }, [searchQuery, fetchSearchResults]);

  // Handle Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pagination Controls
  const totalPages = Math.ceil(total / perPage);
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  // Handle Search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(!!e.target.value);
  };

  const handleSuggestionClick = (artistName) => {
    setSearchQuery(artistName);
    setShowSuggestions(false);
    fetchSearchResults.cancel();
    fetchSearchResults(artistName);
  };

  const handleSearchSubmit = () => {
    setShowSuggestions(false);
    fetchSearchResults.cancel();
    fetchSearchResults(searchQuery);
  };

  // Memoized Artist Cards
  const artistCards = useMemo(() => {
    const displayArtists = searchQuery ? searchResults : artists;
    return displayArtists.map((artist) => (
      <div
        key={artist.id}
        onClick={() => navigate(`/artist/${artist.id}`)}
        className="relative bg-gray-800/50 backdrop-blur-md rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer"
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={artist.image_url || 'https://via.placeholder.com/150'}
            alt={artist.name}
            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-pink-300 truncate">
            {artist.name}
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            Genres: {artist.genres.join(', ') || 'N/A'}
          </p>
        </div>
        <div className="absolute inset-0 border-2 border-transparent rounded-xl group-hover:border-pink-500/40 transition-all duration-300 pointer-events-none"></div>
      </div>
    ));
  }, [artists, searchResults, searchQuery, navigate]);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-700 text-white relative overflow-hidden">
            {/* Waveform Background */}
            <div className="absolute inset-0 z-0 opacity-20">
              <Wave
                fill="url(#gradient)"
                options={{
                  height: 30,
                  amplitude: 25,
                  speed: 0.2,
                  points: 4,
                }}
              >
                <defs>
                  <linearGradient id="gradient" gradientTransform="rotate(90)">
                    <stop offset="10%" stopColor="#ec4899" />
                    <stop offset="90%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </Wave>
            </div>

            {/* Header */}
            <div className="relative z-20">
              <header className="text-center py-10 px-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  Artist Atlas
                </h1>
                <p className="mt-2 text-lg text-gray-200">
                  Discover your favorite artists in style!
                </p>
                <div className="mt-6 max-w-md mx-auto" ref={searchContainerRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery && setShowSuggestions(true)}
                      placeholder="Search artists..."
                      className="w-full px-4 py-3 bg-gray-800/60 text-white rounded-lg border border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                      aria-label="Search artists"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 top-full mt-2 bg-gray-800/90 backdrop-blur-md rounded-lg max-h-60 overflow-y-auto z-50 border border-pink-500/30 shadow-lg">
                        {suggestions.map((suggestion) => (
                          <li
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion.name)}
                            className="px-4 py-2 hover:bg-pink-600/40 cursor-pointer text-white border-b border-pink-500/20 last:border-b-0 transition-colors"
                          >
                            {suggestion.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </header>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
              {loading && (
                <div className="text-center text-xl text-gray-200 animate-pulse">
                  🎧 Loading...
                </div>
              )}
              {error && (
                <div className="text-center text-lg text-red-300 bg-red-900/40 p-4 rounded-lg shadow">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
                    {artistCards}
                  </div>
                  {/* Pagination Controls */}
                  {!searchQuery && totalPages > 1 && (
                    <div className="flex justify-center items-center mt-10 space-x-4">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
                        aria-label="Previous page"
                      >
                        Previous
                      </button>
                      <span className="text-lg text-gray-200">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
                        aria-label="Next page"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        }
      />
      <Route path="/artist/:id" element={<ArtistDetail />} />
    </Routes>
  );
}

export default App;