import React, { useEffect, useState } from 'react';
import { backendApi } from '../../api';
import { getUpcomingBigMovies, getMovieDetails } from '../../api/movieService';

const MoviesAdmin = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('movies');

  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '', genre: '', description: '', poster: '', backdrop: '',
    language: 'ne', country: 'Nepal', runtime: 120, rating: 7.5,
    releaseDate: '', tmdbId: null, isNowPlaying: true, bookingEnabled: true
  });

  const [showtimeMovie, setShowtimeMovie] = useState(null);
  const [showtimeForm, setShowtimeForm] = useState({
    hall: '', date: '', time: '10:00 AM', price: 350, availableSeats: 100, theater: '', theaterName: ''
  });
  const [showtimeSaving, setShowtimeSaving] = useState(false);

  // Theaters from backend
  const [theaters, setTheaters] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState('');

  useEffect(() => {
    fetchMovies();
    fetchTheaters();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (activeTab === 'upcoming' && upcomingMovies.length === 0) {
      fetchUpcoming();
    }
  }, [activeTab]);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backendApi.getBackendMovies();
      setMovies(data || []);
    } catch (err) {
      setError('Failed to load movies from server');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTheaters = async () => {
    try {
      const data = await backendApi.getTheaters(true);
      setTheaters(data || []);
    } catch (err) {
      console.error('Failed to load theaters:', err);
    }
  };

  const fetchUpcoming = async () => {
    setUpcomingLoading(true);
    try {
      const data = await getUpcomingBigMovies(3);
      setUpcomingMovies(data || []);
    } catch (err) {
      setError('Failed to fetch upcoming movies');
    } finally {
      setUpcomingLoading(false);
    }
  };

  const isAlreadyAdded = (tmdbId) => movies.some((movie) => movie._raw?.tmdbId === tmdbId);

  const handleQuickAdd = async (tmdbMovie) => {
    setAddingId(tmdbMovie.id);
    setError(null);
    try {
      let details = tmdbMovie;
      try {
        const full = await getMovieDetails(tmdbMovie.id);
        if (full) details = full;
      } catch (_) {
        // Ignore detail fetch failure, fallback to list data.
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
      if (created) {
        setActiveTab('movies');
        openShowtimeManager(created);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add movie');
    } finally {
      setAddingId(null);
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
    setIsCreating(false);
  };

  const openCreateMovie = () => {
    resetForm();
    setIsCreating(true);
    setShowForm(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingMovie && !isCreating) return;

    setSaving(true);
    setError(null);

    const movieData = {
      title: formData.title,
      description: formData.description,
      poster: formData.poster,
      backdrop: formData.backdrop || formData.poster,
      language: formData.language,
      country: formData.country,
      genre: formData.genre.split(',').map((g) => g.trim()).filter(Boolean),
      runtime: parseInt(formData.runtime, 10) || 120,
      rating: parseFloat(formData.rating) || 7.5,
      releaseDate: formData.releaseDate || null,
      tmdbId: formData.tmdbId || null,
      isNowPlaying: formData.isNowPlaying,
      bookingEnabled: formData.bookingEnabled
    };

    try {
      if (isCreating) {
        const created = await backendApi.createMovie(movieData);
        setSuccessMsg('Movie created successfully');
        await fetchMovies();
        resetForm();
        if (created) {
          openShowtimeManager(created);
        }
      } else {
        await backendApi.updateMovie(editingMovie._raw?._id || editingMovie.id, movieData);
        setSuccessMsg('Movie updated successfully');
        await fetchMovies();
        resetForm();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save movie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}" from theater?`)) return;
    setError(null);
    try {
      await backendApi.deleteMovie(movie._raw?._id || movie.id);
      setSuccessMsg('Movie removed from theater');
      await fetchMovies();
    } catch (err) {
      setError('Failed to delete movie');
    }
  };

  const openShowtimeManager = (movie) => {
    setShowtimeMovie(movie);
    setSelectedTheaterId('');
    setShowtimeForm({
      hall: '', date: '', time: '10:00 AM', price: 350, availableSeats: 100, theater: '', theaterName: ''
    });
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    if (!showtimeMovie) return;

    setShowtimeSaving(true);
    setError(null);
    try {
      const movieId = showtimeMovie._raw?._id || showtimeMovie.id;
      await backendApi.addShowtime(movieId, {
        ...showtimeForm,
        theater: showtimeForm.theater || null,
        theaterName: showtimeForm.theaterName || ''
      });
      setSuccessMsg('Showtime added');
      await fetchMovies();
      const updated = (await backendApi.getBackendMovies()).find((m) => (m._raw?._id || m.id) === movieId);
      if (updated) setShowtimeMovie(updated);
      setShowtimeForm((prev) => ({ ...prev, date: '', time: '10:00 AM' }));
    } catch (err) {
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
      const updated = (await backendApi.getBackendMovies()).find((m) => (m._raw?._id || m.id) === movieId);
      if (updated) setShowtimeMovie(updated);
    } catch (err) {
      setError('Failed to remove showtime');
    }
  };

  const selectedTheater = theaters.find((t) => t._id === selectedTheaterId);
  const hallOptions = selectedTheater?.halls?.map((h) => `${h.name} - ${h.type}`) || [];
  const timeSlots = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM', '7:00 PM', '8:30 PM', '10:00 PM'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Movies Management</h2>
          <p className="text-slate-400">Manage theater movies and showtimes ({movies.length} movies)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMovies} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-5 rounded-xl font-semibold transition-all disabled:opacity-50">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={openCreateMovie} className="bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 px-5 rounded-xl font-bold transition-all">
            + Add Movie
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white ml-3">x</button>
        </div>
      )}
      {successMsg && <div className="p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">{successMsg}</div>}

      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button onClick={() => setActiveTab('movies')} className={`py-2 px-5 rounded-lg font-semibold transition-all ${activeTab === 'movies' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          Theater Movies
        </button>
        <button onClick={() => setActiveTab('upcoming')} className={`py-2 px-5 rounded-lg font-semibold transition-all ${activeTab === 'upcoming' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          Upcoming Movies
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Upcoming Movies (Next 3 Months)</h3>
              <p className="text-slate-400 text-sm">Add upcoming TMDB releases to your theater.</p>
            </div>
            <button onClick={fetchUpcoming} disabled={upcomingLoading} className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
              {upcomingLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {upcomingLoading && <p className="text-slate-400 py-6">Fetching upcoming movies...</p>}

          {!upcomingLoading && upcomingMovies.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {upcomingMovies.map((movie) => {
                const added = isAlreadyAdded(movie.id);
                const isAdding = addingId === movie.id;
                const releaseDate = movie.releaseDate || movie.rawReleaseDate;
                return (
                  <div key={movie.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all group">
                    <div className="aspect-2/3 relative overflow-hidden">
                      {movie.image ? (
                        <img src={movie.image} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.onerror = null; e.target.src = '/no-poster.png'; }} />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600 text-sm">No Poster</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm truncate mb-1">{movie.title}</h4>
                      {releaseDate && <p className="text-xs text-slate-500 mb-2">{new Date(releaseDate).toLocaleDateString()}</p>}
                      {added ? (
                        <span className="block text-center text-xs text-cyan-400 bg-cyan-500/10 py-2 rounded-lg font-medium">Already Added</span>
                      ) : (
                        <button onClick={() => handleQuickAdd(movie)} disabled={isAdding} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-lg text-xs transition-all disabled:opacity-50">
                          {isAdding ? 'Adding...' : 'Add to Theater'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'movies' && (
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
                          <img src={movie.poster || movie.image || '/no-poster.png'} alt={movie.title} className="w-12 h-16 object-cover rounded" onError={(e) => { e.target.onerror = null; e.target.src = '/no-poster.png'; }} />
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
                          {movie.bookingEnabled && <span className="inline-block bg-cyan-500/20 text-cyan-400 text-xs px-2 py-1 rounded">Bookable</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${showtimeCount > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {showtimeCount} showtime{showtimeCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="p-4"><span className="bg-slate-800 px-2 py-1 rounded text-sm">{movie.rating?.toFixed(1) || 'N/A'}</span></td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openShowtimeManager(movie)} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all">Showtimes</button>
                          <button onClick={() => handleEdit(movie)} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-all">Edit</button>
                          <button onClick={() => handleDelete(movie)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6">{isCreating ? 'Add New Movie' : 'Edit Movie'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Genre (comma separated)</label>
                <input type="text" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. Drama, Comedy" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" rows={3} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Poster URL</label>
                <input type="text" value={formData.poster} onChange={(e) => setFormData({ ...formData, poster: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Backdrop URL</label>
                <input type="text" value={formData.backdrop} onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Language</label>
                  <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    <option value="ne">Nepali</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ko">Korean</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Country</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
                    <option value="Nepal">Nepal</option>
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="Korea">Korea</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Runtime (min)</label>
                  <input type="number" value={formData.runtime} min="0" onChange={(e) => setFormData({ ...formData, runtime: parseInt(e.target.value, 10) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Rating</label>
                  <input type="number" value={formData.rating} min="0" max="10" step="0.1" onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Release Date</label>
                  <input type="date" value={formData.releaseDate} onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isNowPlaying} onChange={(e) => setFormData({ ...formData, isNowPlaying: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                  <span className="text-sm text-slate-300">Now Playing</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.bookingEnabled} onChange={(e) => setFormData({ ...formData, bookingEnabled: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                  <span className="text-sm text-slate-300">Booking Enabled</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : isCreating ? 'Create Movie' : 'Update Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showtimeMovie && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Manage Showtimes</h3>
                <p className="text-slate-400 text-sm">{showtimeMovie.title}</p>
              </div>
              <button onClick={() => setShowtimeMovie(null)} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all">x</button>
            </div>

            <form onSubmit={handleAddShowtime} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add New Showtime</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Theater *</label>
                  <select
                    value={selectedTheaterId}
                    onChange={(e) => {
                      const tid = e.target.value;
                      setSelectedTheaterId(tid);
                      const t = theaters.find((th) => th._id === tid);
                      setShowtimeForm({ ...showtimeForm, theater: tid, theaterName: t?.name || '', hall: '' });
                    }}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    required
                  >
                    <option value="">Select Theater</option>
                    {theaters.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.location}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Hall *</label>
                  <select
                    value={showtimeForm.hall}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, hall: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                    required
                    disabled={!selectedTheaterId}
                  >
                    <option value="">{selectedTheaterId ? 'Select Hall' : 'Select theater first'}</option>
                    {hallOptions.map((hall) => <option key={hall} value={hall}>{hall}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date *</label>
                  <input type="date" value={showtimeForm.date} required min={new Date().toISOString().split('T')[0]} onChange={(e) => setShowtimeForm({ ...showtimeForm, date: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Time</label>
                  <select value={showtimeForm.time} onChange={(e) => setShowtimeForm({ ...showtimeForm, time: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Price (NPR)</label>
                  <input type="number" value={showtimeForm.price} min="0" onChange={(e) => setShowtimeForm({ ...showtimeForm, price: parseInt(e.target.value, 10) || 0 })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Available Seats</label>
                  <input type="number" value={showtimeForm.availableSeats} min="1" onChange={(e) => setShowtimeForm({ ...showtimeForm, availableSeats: parseInt(e.target.value, 10) || 100 })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <button type="submit" disabled={showtimeSaving} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-5 rounded-lg text-sm transition-all disabled:opacity-50">
                {showtimeSaving ? 'Adding...' : 'Add Showtime'}
              </button>
            </form>

            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Current Showtimes ({showtimeMovie._raw?.showtimes?.length || 0})</h4>
              {(!showtimeMovie._raw?.showtimes || showtimeMovie._raw.showtimes.length === 0) ? (
                <p className="text-center text-slate-500 py-6">No showtimes scheduled yet</p>
              ) : (
                <div className="space-y-2">
                  {showtimeMovie._raw.showtimes.map((st) => (
                    <div key={st._id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-800/50 border-slate-700">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-bold">{st.time}</p>
                          <p className="text-xs text-slate-400">{st.hall}</p>
                          {st.theaterName && <p className="text-xs text-cyan-400">{st.theaterName}</p>}
                        </div>
                        <p className="text-sm font-bold text-cyan-400">NPR {st.price}</p>
                      </div>
                      <button onClick={() => handleRemoveShowtime(st._id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviesAdmin;
