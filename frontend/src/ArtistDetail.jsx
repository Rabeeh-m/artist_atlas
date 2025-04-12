import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Wave from 'react-wavify';

function ArtistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtist = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/artists/${id}`);
        setArtist(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch artist details');
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-700 text-white flex items-center justify-center">
        <div className="text-2xl animate-spin">🎧 Loading...</div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-700 text-white flex items-center justify-center">
        <div className="text-2xl text-red-400 bg-red-900/30 p-4 rounded-lg">
          {error || 'Artist not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-700 text-white relative overflow-hidden">
      {/* Waveform Background */}
      <div className="absolute inset-0 z-0 opacity-20">
        <Wave
          fill="url(#gradient)"
          options={{
            height: 20,
            amplitude: 20,
            speed: 0.15,
            points: 3,
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="mb-6 px-4 py-2 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition"
        >
          ← Back to Artists
        </button>
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={artist.image_url || 'https://via.placeholder.com/300'}
              alt={artist.name}
              className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg shadow-md"
            />
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-pink-300 neon-text mb-4">
                {artist.name}
              </h1>
              <p className="text-lg text-gray-300 mt-2">
                <strong>ID:</strong> {artist.id}
              </p>
              <p className="text-lg text-gray-300">
                <strong>Genres:</strong> {artist.genres.join(', ') || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ArtistDetail;