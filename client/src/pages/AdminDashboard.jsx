import React, { useState } from 'react';
import { adminMovies } from '../data/adminMovies';

// INLINE MOCK: Local state for admin movies (will be replaced with API calls)
const AdminDashboard = () => {
  const [movies, setMovies] = useState(adminMovies);
  const [editingMovie, setEditingMovie] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    description: '',
    image: '',
    price: 350,
    duration: '120',
    rating: 7.5
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingMovie) {
      // Update existing movie
      setMovies(movies.map(m => 
        m.id === editingMovie.id ? { ...m, ...formData } : m
      ));
      setEditingMovie(null);
    } else {
      // Add new movie
      const newMovie = {
        id: `local-${Date.now()}`,
        ...formData
      };
      setMovies([...movies, newMovie]);
    }
    
    // Reset form
    setFormData({ title: '', genre: '', description: '', image: '', price: 350, duration: '120', rating: 7.5 });
    setShowForm(false);
    
    // TODO: POST/PUT to API when backend is ready
    // await fetch('/api/admin/movies', { method: 'POST', body: JSON.stringify(newMovie) });
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      genre: movie.genre,
      description: movie.description || '',
      image: movie.image,
      price: movie.price,
      duration: movie.duration || '120',
      rating: movie.rating || 7.5
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      setMovies(movies.filter(m => m.id !== id));
      // TODO: DELETE to API when backend is ready
      // await fetch(`/api/admin/movies/${id}`, { method: 'DELETE' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Manage movies showing at your theater</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingMovie(null); setFormData({ title: '', genre: '', description: '', image: '', price: 350, duration: '120', rating: 7.5 }); }}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-6 rounded-xl transition-all"
          >
            + Add Movie
          </button>
        </div>

        {/* Movie Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Genre</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., Action, Comedy"
                    required
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
                  <label className="block text-sm text-slate-400 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Price (NPR)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Duration (min)</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      max="10"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingMovie(null); }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition-all"
                  >
                    {editingMovie ? 'Update' : 'Add Movie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Movies Table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Movie</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Genre</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Price</th>
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
                          src={movie.image}
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <span className="font-semibold">{movie.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">{movie.genre}</td>
                    <td className="p-4">
                      <span className="text-cyan-400 font-bold">NPR {movie.price}</span>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-800 px-2 py-1 rounded text-sm">★ {movie.rating || 'N/A'}</span>
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
          
          {movies.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <p className="text-lg mb-2">No movies added yet</p>
              <p className="text-sm">Click "Add Movie" to get started</p>
            </div>
          )}
        </div>

        {/* Info Note */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-sm text-yellow-400">
            <strong>Note:</strong> Changes are stored in local state only. Connect to your backend API to persist changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
