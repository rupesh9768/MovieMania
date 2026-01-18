import React, { useState } from 'react';
import { adminMovies as initialMovies } from '../data/adminMovies';

const AdminDashboard = () => {
  const [movies, setMovies] = useState(initialMovies);
  const [newMovie, setNewMovie] = useState({
    title: '',
    genre: '',
    price: '',
    image: '',
    rating: '5.0'
  });

  const handleInputChange = (e) => {
    setNewMovie({ ...newMovie, [e.target.name]: e.target.value });
  };

  const handleAddMovie = (e) => {
    e.preventDefault();
    const id = `nep-${Date.now()}`;
    const movieToAdd = { ...newMovie, id, price: Number(newMovie.price) };
    
    // For now, this only updates the state (local memory)
    // Later, this will be a 'POST' request to your backend
    setMovies([movieToAdd, ...movies]);
    
    // Reset form
    setNewMovie({ title: '', genre: '', price: '', image: '', rating: '5.0' });
    alert("Movie added to list! (Note: This is temporary until we add the backend)");
  };

  return (
    <div className="min-h-screen bg-[#0b1121] text-white pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-10 flex items-center gap-4">
          <span className="p-3 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
             {/* Admin Icon */}
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </span>
          Admin Control Center
        </h1>

        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* LEFT: ADD MOVIE FORM */}
          <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-400 uppercase tracking-widest">Add New Movie</h2>
            
            <form onSubmit={handleAddMovie} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Movie Title</label>
                  <input name="title" value={newMovie.title} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" placeholder="e.g. Kabaddi 5" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Genre</label>
                  <input name="genre" value={newMovie.genre} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" placeholder="Action, Comedy" required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ticket Price (NPR)</label>
                  <input name="price" type="number" value={newMovie.price} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" placeholder="350" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Poster Image URL</label>
                  <input name="image" value={newMovie.image} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-red-600 outline-none transition-all" placeholder="https://..." required />
                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2">
                Publish Movie to Home Page
              </button>
            </form>
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div>
            <h2 className="text-xl font-bold mb-6 text-slate-400 uppercase tracking-widest">Live Preview</h2>
            <div className="bg-slate-900 rounded-3xl border-2 border-dashed border-slate-800 p-4 opacity-80 group">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-slate-950 flex items-center justify-center">
                  {newMovie.image ? (
                    <img src={newMovie.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-700 font-bold">No Image Provided</span>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-red-500">
                    NPR {newMovie.price || '0'}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{newMovie.title || 'Movie Title'}</h3>
                <p className="text-slate-400 text-sm mb-4">{newMovie.genre || 'Genre Information'}</p>
                <div className="w-full bg-slate-800 h-10 rounded-xl"></div>
            </div>
            <p className="mt-4 text-xs text-slate-500 italic text-center text-balance">
              This is how your movie will appear to users in the "Now Showing" section.
            </p>
          </div>

        </div>

        {/* RECENTLY ADDED LIST */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold mb-8 opacity-50 uppercase tracking-tighter">Existing Movie Database</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="pb-4 px-4">Movie</th>
                  <th className="pb-4 px-4">Genre</th>
                  <th className="pb-4 px-4">Price</th>
                  <th className="pb-4 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <tr key={movie.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 font-bold">{movie.title}</td>
                    <td className="py-4 px-4 text-slate-400 text-sm">{movie.genre}</td>
                    <td className="py-4 px-4 text-red-500 font-mono">NPR {movie.price}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-1 rounded border border-green-500/20 uppercase">Now Showing</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;