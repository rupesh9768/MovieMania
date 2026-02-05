import React, { useState, useEffect } from 'react';
import { backendApi } from '../api';

// ============================================
// ADMIN DASHBOARD - BACKEND CONNECTED
// Uses real backend API for all CRUD operations
// ============================================
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
    poster: '',
    backdrop: '',
    language: 'ne',
    country: 'Nepal',
    runtime: 120,
    rating: 7.5,
    isNowPlaying: true,
    bookingEnabled: true
  });

  // ============================================
  // FETCH MOVIES FROM BACKEND ON LOAD
  // ============================================
  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backendApi.getBackendMovies();
      setMovies(data || []);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      setError('Failed to load movies from server');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE FORM SUBMIT (CREATE / UPDATE)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    // Prepare data for backend
    const movieData = {
      title: formData.title,
      description: formData.description,
      poster: formData.poster,
      backdrop: formData.backdrop || formData.poster,
      language: formData.language,
      country: formData.country,
      genre: formData.genre.split(',').map(g => g.trim()).filter(g => g),
      runtime: parseInt(formData.runtime) || 120,
      rating: parseFloat(formData.rating) || 7.5,
      isNowPlaying: formData.isNowPlaying,
      bookingEnabled: formData.bookingEnabled
    };

    try {
      if (editingMovie) {
        // UPDATE existing movie
        const response = await fetch(`${API_BASE}/movies/${editingMovie.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movieData)
        });
        if (!response.ok) throw new Error('Failed to update movie');
      } else {
        // CREATE new movie
        const response = await fetch(`${API_BASE}/movies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movieData)
        });
        if (!response.ok) throw new Error('Failed to create movie');
      }
      
      // Refresh movie list
      await fetchMovies();
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save movie');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      genre: '',
      description: '',
      poster: '',
      backdrop: '',
      language: 'ne',
      country: 'Nepal',
      runtime: 120,
      rating: 7.5,
      isNowPlaying: true,
      bookingEnabled: true
    });
    setShowForm(false);
    setEditingMovie(null);
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title || '',
      genre: Array.isArray(movie.genres) ? movie.genres.join(', ') : (movie.genre || ''),
      description: movie.description || movie.overview || '',
      poster: movie.poster || movie.image || '',
      backdrop: movie.backdrop || '',
      language: movie.language || 'ne',
      country: movie.country || 'Nepal',
      runtime: movie.runtime || 120,
      rating: movie.rating || 7.5,
      isNowPlaying: movie.isNowPlaying !== false,
      bookingEnabled: movie.bookingEnabled !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/movies/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete movie');
      
      // Refresh movie list
      await fetchMovies();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete movie');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Manage movies in your database ({movies.length} total)</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchMovies}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : '↻ Refresh'}
            </button>
            <button
              onClick={() => { setShowForm(true); setEditingMovie(null); resetForm(); }}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-xl transition-all"
            >
              + Add Movie
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Movie Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Country</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="Nepal">Nepal</option>
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="South Korea">South Korea</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="ne">Nepali</option>
                      <option value="hi">Hindi</option>
                      <option value="en">English</option>
                      <option value="ko">Korean</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Genre (comma separated)</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., Action, Drama, Thriller"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Poster URL *</label>
                  <input
                    type="url"
                    value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="https://image.tmdb.org/t/p/w500/..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Backdrop URL (optional)</label>
                  <input
                    type="url"
                    value={formData.backdrop}
                    onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="https://image.tmdb.org/t/p/w1280/..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Runtime (min)</label>
                    <input
                      type="number"
                      value={formData.runtime}
                      onChange={(e) => setFormData({ ...formData, runtime: parseInt(e.target.value) || 120 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Rating (0-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNowPlaying}
                      onChange={(e) => setFormData({ ...formData, isNowPlaying: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm text-slate-300">Now Playing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bookingEnabled}
                      onChange={(e) => setFormData({ ...formData, bookingEnabled: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm text-slate-300">Booking Enabled</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-all"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingMovie ? 'Update' : 'Add Movie')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400">Loading movies from database...</p>
          </div>
        )}

        {/* Movies Table */}
        {!loading && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="text-left p-4 text-sm font-semibold text-slate-400">Movie</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-400">Country</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-400">Genres</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-slate-400">Rating</th>
                    <th className="text-right p-4 text-sm font-semibold text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.map((movie) => (
                    <tr key={movie.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={movie.poster || movie.image || '/placeholder.jpg'}
                            alt={movie.title}
                            className="w-12 h-16 object-cover rounded"
                            onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                          />
                          <div>
                            <span className="font-semibold block">{movie.title}</span>
                            <span className="text-xs text-slate-500">{movie.runtime || 0} min</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">{movie.country || 'N/A'}</td>
                      <td className="p-4 text-slate-400">
                        {Array.isArray(movie.genres) ? movie.genres.slice(0, 2).join(', ') : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {movie.isNowPlaying && (
                            <span className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Now Playing</span>
                          )}
                          {movie.bookingEnabled && (
                            <span className="inline-block bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">Bookable</span>
                          )}
                          {!movie.isNowPlaying && (
                            <span className="inline-block bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded">Upcoming</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-800 px-2 py-1 rounded text-sm">★ {movie.rating?.toFixed(1) || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {movies.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-500">
                <p className="text-lg mb-2">No movies in database</p>
                <p className="text-sm">Click "Add Movie" to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Success Note */}
        <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-sm text-green-400">
            <strong>✓ Connected to Backend:</strong> All changes are saved directly to your MongoDB database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
