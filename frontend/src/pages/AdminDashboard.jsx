import React, { useState, useEffect } from 'react';
import { backendApi } from '../api';
import { getUpcomingBigMovies, getMovieDetails } from '../api/movieService';

const AdminDashboard = () => {
  // State
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Upcoming TMDB movies
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Movie edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '', genre: '', description: '', poster: '', backdrop: '',
    language: 'ne', country: 'Nepal', runtime: 120, rating: 7.5,
    releaseDate: '', tmdbId: null, isNowPlaying: true, bookingEnabled: true
  });

  // Showtime management state
  const [showtimeMovie, setShowtimeMovie] = useState(null);
  const [showtimeForm, setShowtimeForm] = useState({
    hall: 'Hall A - Standard', date: '', time: '10:00 AM', price: 350, availableSeats: 100
  });
  const [showtimeSaving, setShowtimeSaving] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => { fetchMovies(); }, []);

  // Auto-clear messages
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

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

  // Fetch upcoming movies from TMDB (next 3 months)
  const fetchUpcoming = async () => {
    setUpcomingLoading(true);
    try {
      const data = await getUpcomingBigMovies(3);
      setUpcomingMovies(data || []);
    } catch (err) {
      console.error('Failed to fetch upcoming:', err);
    } finally {
      setUpcomingLoading(false);
    }
  };

  // Load upcoming when tab switches
  useEffect(() => {
    if (activeTab === 'upcoming' && upcomingMovies.length === 0) {
      fetchUpcoming();
    }
  }, [activeTab]);

  // Check if a TMDB movie is already added
  const isAlreadyAdded = (tmdbId) => {
    return movies.some(m => m._raw?.tmdbId === tmdbId);
  };

  // One-click add from upcoming list
  const handleQuickAdd = async (tmdbMovie) => {
    setAddingId(tmdbMovie.id);
    setError(null);
    try {
      let details = tmdbMovie;
      try {
        const full = await getMovieDetails(tmdbMovie.id);
        if (full) details = full;
      } catch (err) {
        console.error('Could not fetch full details:', err);
      }

      const movieData = {
        title: details.title || '',
        description: details.overview || '',
        poster: details.image || '',
        backdrop: details.backdrop || '',
        language: details.original_language || tmdbMovie.language?.toLowerCase().slice(0, 2) || 'en',
        country: 'Other',
        genre: (details.genre_ids || []).map(String),
        runtime: details.runtime || 120,
        rating: details.rating ? Math.round(details.rating * 10) / 10 : 0,
        releaseDate: tmdbMovie.releaseDate || tmdbMovie.rawReleaseDate || null,
        tmdbId: details.id || tmdbMovie.id,
        isNowPlaying: false,
        bookingEnabled: false
      };

      const created = await backendApi.createMovie(movieData);
      setSuccessMsg(`"${movieData.title}" added to theater`);
      await fetchMovies();

      // Open showtime manager for the new movie
      if (created) {
        setActiveTab('movies');
        openShowtimeManager(created);
      }
    } catch (err) {
      console.error('Quick add error:', err);
      setError(err.response?.data?.error || 'Failed to add movie');
    } finally {
      setAddingId(null);
    }
  };

  // Update movie (edit only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingMovie) return;
    setSaving(true);
    setError(null);

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
      releaseDate: formData.releaseDate || null,
      tmdbId: formData.tmdbId || null,
      isNowPlaying: formData.isNowPlaying,
      bookingEnabled: formData.bookingEnabled
    };

    try {
      await backendApi.updateMovie(editingMovie._raw?._id || editingMovie.id, movieData);
      setSuccessMsg('Movie updated successfully');
      await fetchMovies();
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save movie');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', genre: '', description: '', poster: '', backdrop: '',
      language: 'ne', country: 'Nepal', runtime: 120, rating: 7.5,
      releaseDate: '', tmdbId: null, isNowPlaying: true, bookingEnabled: true
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
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      tmdbId: movie._raw?.tmdbId || null,
      isNowPlaying: movie.isNowPlaying !== false,
      bookingEnabled: movie.bookingEnabled !== false
    });
    setShowForm(true);
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}" from theater?`)) return;
    setError(null);
    try {
      await backendApi.deleteMovie(movie._raw?._id || movie.id);
      setSuccessMsg('Movie removed from theater');
      await fetchMovies();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete movie');
    }
  };

  // Showtime management
  const openShowtimeManager = (movie) => {
    setShowtimeMovie(movie);
    setShowtimeForm({
      hall: 'Hall A - Standard', date: '', time: '10:00 AM', price: 350, availableSeats: 100
    });
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    if (!showtimeMovie) return;
    setShowtimeSaving(true);
    setError(null);
    try {
      const movieId = showtimeMovie._raw?._id || showtimeMovie.id;
      await backendApi.addShowtime(movieId, showtimeForm);
      setSuccessMsg('Showtime added');
      await fetchMovies();
      const updated = (await backendApi.getBackendMovies()).find(
        m => (m._raw?._id || m.id) === movieId
      );
      if (updated) setShowtimeMovie(updated);
      setShowtimeForm(prev => ({ ...prev, date: '', time: '10:00 AM' }));
    } catch (err) {
      console.error('Add showtime error:', err);
      setError(err.response?.data?.error || 'Failed to add showtime');
    } finally {
      setShowtimeSaving(false);
    }
  };

  const handleRemoveShowtime = async (showtimeId) => {
    if (!showtimeMovie) return;
    setError(null);
    try {
      const movieId = showtimeMovie._raw?._id || showtimeMovie.id;
      await backendApi.removeShowtime(movieId, showtimeId);
      setSuccessMsg('Showtime removed');
      await fetchMovies();
      const updated = (await backendApi.getBackendMovies()).find(
        m => (m._raw?._id || m.id) === movieId
      );
      if (updated) setShowtimeMovie(updated);
    } catch (err) {
      console.error('Remove showtime error:', err);
      setError('Failed to remove showtime');
    }
  };

  const halls = [
    'Hall A - Standard',
    'Hall B - Premium',
    'Hall C - IMAX',
    'Hall D - Dolby Atmos'
  ];

  const timeSlots = [
    '10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM',
    '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM', '10:00 PM'
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black mb-1">Admin Dashboard</h1>
            <p className="text-slate-400">Manage theater movies and showtimes ({movies.length} movies)</p>
          </div>
          <button onClick={fetchMovies} disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-5 rounded-xl font-semibold transition-all disabled:opacity-50">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white ml-3">x</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3">
          <button onClick={() => setActiveTab('movies')}
            className={`py-2 px-5 rounded-lg font-semibold transition-all ${
              activeTab === 'movies' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>
            Theater Movies
          </button>
          <button onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-5 rounded-lg font-semibold transition-all ${
              activeTab === 'upcoming' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}>
            Upcoming Movies
          </button>
        </div>

        {/* TAB: Upcoming TMDB Movies */}
        {activeTab === 'upcoming' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Upcoming Movies (Next 3 Months)</h2>
                <p className="text-slate-400 text-sm">Browse upcoming movies from TMDB and add them to your theater with one click.</p>
              </div>
              <button onClick={fetchUpcoming} disabled={upcomingLoading}
                className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
                {upcomingLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {upcomingLoading && (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Fetching upcoming movies...</p>
              </div>
            )}

            {!upcomingLoading && upcomingMovies.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {upcomingMovies.map((movie) => {
                  const added = isAlreadyAdded(movie.id);
                  const isAdding = addingId === movie.id;
                  const releaseDate = movie.releaseDate || movie.rawReleaseDate;
                  return (
                    <div key={movie.id}
                      className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all group">
                      <div className="aspect-2/3 relative overflow-hidden">
                        {movie.image ? (
                          <img src={movie.image} alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; }} />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 text-sm">No Poster</div>
                        )}
                        {movie.rating > 0 && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-yellow-500/90 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                              {movie.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                        {movie.language && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-slate-900/80 text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
                              {movie.language}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-bold text-sm truncate mb-1">{movie.title}</h3>
                        {releaseDate && (
                          <p className="text-xs text-slate-500 mb-2">
                            {new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {added ? (
                          <span className="block text-center text-xs text-cyan-400 bg-cyan-500/10 py-2 rounded-lg font-medium">
                            Already Added
                          </span>
                        ) : (
                          <button onClick={() => handleQuickAdd(movie)} disabled={isAdding}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-lg text-xs transition-all disabled:opacity-50">
                            {isAdding ? 'Adding...' : 'Add to Theater'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!upcomingLoading && upcomingMovies.length === 0 && (
              <p className="text-center text-slate-500 py-12">No upcoming movies found.</p>
            )}
          </div>
        )}

        {/* TAB: Movies List */}
        {activeTab === 'movies' && (
          <>

            {loading && (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Loading movies...</p>
              </div>
            )}

            {!loading && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800/50">
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Movie</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Country</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Showtimes</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-400">Rating</th>
                        <th className="text-right p-4 text-sm font-semibold text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movies.map((movie) => {
                        const showtimeCount = movie._raw?.showtimes?.length || 0;
                        return (
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
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                {movie.isNowPlaying ? (
                                  <span className="inline-block bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">Now Playing</span>
                                ) : (
                                  <span className="inline-block bg-slate-700/50 text-slate-400 text-xs px-2 py-1 rounded">Upcoming</span>
                                )}
                                {movie.bookingEnabled && (
                                  <span className="inline-block bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">Bookable</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`text-sm font-medium ${showtimeCount > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                                {showtimeCount} showtime{showtimeCount !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="bg-slate-800 px-2 py-1 rounded text-sm">
                                {movie.rating?.toFixed(1) || 'N/A'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => openShowtimeManager(movie)}
                                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                                  Showtimes
                                </button>
                                <button onClick={() => handleEdit(movie)}
                                  className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                                  Edit
                                </button>
                                <button onClick={() => handleDelete(movie)}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {movies.length === 0 && !loading && (
                  <div className="p-12 text-center text-slate-500">
                    <p className="text-lg mb-2">No movies in theater</p>
                    <p className="text-sm">Go to the "Upcoming Movies" tab to add movies</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Movie Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Edit Movie</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title *</label>
                  <input type="text" value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Country</label>
                    <select value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
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
                    <select value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
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
                  <input type="text" value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="Action, Drama, Thriller" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description</label>
                  <textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" rows={3} />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Poster URL *</label>
                  <input type="url" value={formData.poster}
                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="https://image.tmdb.org/t/p/w500/..." required />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Backdrop URL</label>
                  <input type="url" value={formData.backdrop}
                    onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="https://image.tmdb.org/t/p/w1280/..." />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Runtime (min)</label>
                    <input type="number" value={formData.runtime}
                      onChange={(e) => setFormData({ ...formData, runtime: parseInt(e.target.value) || 120 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Rating (0-10)</label>
                    <input type="number" step="0.1" min="0" max="10" value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Release Date</label>
                    <input type="date" value={formData.releaseDate}
                      onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isNowPlaying}
                      onChange={(e) => setFormData({ ...formData, isNowPlaying: e.target.checked })}
                      className="w-5 h-5 rounded accent-cyan-500" />
                    <span className="text-sm text-slate-300">Now Playing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.bookingEnabled}
                      onChange={(e) => setFormData({ ...formData, bookingEnabled: e.target.checked })}
                      className="w-5 h-5 rounded accent-cyan-500" />
                    <span className="text-sm text-slate-300">Booking Enabled</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} disabled={saving}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Showtime Manager Modal */}
        {showtimeMovie && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Manage Showtimes</h2>
                  <p className="text-slate-400 text-sm">{showtimeMovie.title}</p>
                </div>
                <button onClick={() => setShowtimeMovie(null)}
                  className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  x
                </button>
              </div>

              {/* Add Showtime Form */}
              <form onSubmit={handleAddShowtime}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add New Showtime</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Hall</label>
                    <select value={showtimeForm.hall}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, hall: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                      {halls.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date *</label>
                    <input type="date" value={showtimeForm.date} required
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, date: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Time</label>
                    <select value={showtimeForm.time}
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, time: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Price (NPR)</label>
                    <input type="number" value={showtimeForm.price} min="0"
                      onChange={(e) => setShowtimeForm({ ...showtimeForm, price: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-slate-500 mb-1">Available Seats</label>
                  <input type="number" value={showtimeForm.availableSeats} min="1"
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, availableSeats: parseInt(e.target.value) || 100 })}
                    className="w-48 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <button type="submit" disabled={showtimeSaving}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-5 rounded-lg text-sm transition-all disabled:opacity-50">
                  {showtimeSaving ? 'Adding...' : 'Add Showtime'}
                </button>
              </form>

              {/* Existing Showtimes */}
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Current Showtimes ({showtimeMovie._raw?.showtimes?.length || 0})
                </h3>
                {(!showtimeMovie._raw?.showtimes || showtimeMovie._raw.showtimes.length === 0) ? (
                  <p className="text-center text-slate-500 py-6">No showtimes scheduled yet</p>
                ) : (
                  <div className="space-y-2">
                    {showtimeMovie._raw.showtimes
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((st) => {
                        const stDate = new Date(st.date);
                        const isPast = stDate < new Date(new Date().toDateString());
                        return (
                          <div key={st._id}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              isPast ? 'bg-slate-800/30 border-slate-800 opacity-50' : 'bg-slate-800/50 border-slate-700'
                            }`}>
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[80px]">
                                <p className="text-sm font-bold">
                                  {stDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {stDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                              </div>
                              <div className="h-8 w-px bg-slate-700"></div>
                              <div>
                                <p className="font-bold text-sm">{st.time}</p>
                                <p className="text-xs text-slate-400">{st.hall}</p>
                              </div>
                              <div className="h-8 w-px bg-slate-700"></div>
                              <div>
                                <p className="text-sm font-bold text-cyan-400">NPR {st.price}</p>
                                <p className="text-xs text-slate-400">{st.availableSeats} seats</p>
                              </div>
                            </div>
                            <button onClick={() => handleRemoveShowtime(st._id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                              Remove
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <p className="text-sm text-cyan-400">
            <strong>Connected to Backend:</strong> All changes are saved directly to your MongoDB database. Showtimes will appear on the Theater page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;



