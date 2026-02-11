import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFavorites, removeFromFavorites, isLoggedIn } from '../api/userService';

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const getPosterUrl = (poster, mediaType) => {
  if (!poster) return null;
  if (poster.startsWith('http')) return poster;
  return `${IMG_BASE}${poster}`;
};

// ============================================
// TODO: Favorites system — sync favorites with backend per-user
// TODO: Share favorites list with friends
// FAVORITES PAGE
// Shows user's favorite movies/shows
// ============================================
const Favorites = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // Redirect if not logged in
  // ============================================
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
  }, [navigate]);

  // ============================================
  // Fetch favorites on mount
  // ============================================
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isLoggedIn()) return;
      
      try {
        setLoading(true);
        const response = await getFavorites();
        setItems(response.data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // ============================================
  // Handle remove from favorites
  // ============================================
  const handleRemove = async (mediaType, mediaId) => {
    try {
      await removeFromFavorites(mediaType, mediaId);
      setItems(prev => prev.filter(
        item => !(item.mediaType === mediaType && item.mediaId === mediaId)
      ));
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item');
    }
  };

  // ============================================
  // Navigate to details
  // ============================================
  const goToDetails = (item) => {
    if (item.mediaType === 'anime') {
      navigate(`/anime/${item.mediaId}`);
    } else {
      navigate(`/details/${item.mediaType}/${item.mediaId}`);
    }
  };

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-pink-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-4xl">♥</span>
          </div>
          <p className="text-slate-400 text-lg">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <div className="relative bg-linear-to-b from-pink-900/20 via-pink-900/10 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">♥</span>
            <h1 className="text-3xl md:text-4xl font-black">
              My <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-400 to-red-400">Favorites</span>
            </h1>
          </div>
          <p className="text-slate-400">
            {items.length} {items.length === 1 ? 'item' : 'items'} you love
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-pink-500 hover:bg-pink-400 text-white font-bold py-2 px-6 rounded-full cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">♡</div>
            <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
            <p className="text-slate-400 mb-6">Start adding your favorite movies and shows!</p>
            <Link 
              to="/browse"
              className="inline-block bg-pink-500 hover:bg-pink-400 text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <div 
                key={`${item.mediaType}-${item.mediaId}`}
                className="group relative"
              >
                {/* Card */}
                <div 
                  onClick={() => goToDetails(item)}
                  className="cursor-pointer"
                >
                  <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-2 border-2 border-pink-500/30 group-hover:border-pink-500/60 shadow-lg transition-all">
                    {item.poster ? (
                      <img
                        src={getPosterUrl(item.poster, item.mediaType)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🎬</span>
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    
                    {/* Media Type Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      item.mediaType === 'movie' 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : item.mediaType === 'tv'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    }`}>
                      {item.mediaType}
                    </div>
                    
                    {/* Heart Icon */}
                    <div className="absolute top-2 right-2 text-pink-400 text-lg">
                      ♥
                    </div>
                    
                    {/* Rating Badge */}
                    {item.rating > 0 && (
                      <div className="absolute top-9 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        {item.rating.toFixed(1)}
                      </div>
                    )}
                    
                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.mediaType, item.mediaId);
                  }}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                  title="Remove from favorites"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
