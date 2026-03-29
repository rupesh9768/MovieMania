import React, { useEffect, useState } from 'react';
import { backendApi } from '../../api';

const TheatersAdmin = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Theater form
  const [showForm, setShowForm] = useState(false);
  const [editingTheater, setEditingTheater] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', address: '', phone: '', isActive: true });
  const [saving, setSaving] = useState(false);

  // Hall form
  const [hallTheater, setHallTheater] = useState(null);
  const [hallForm, setHallForm] = useState({ name: '', totalSeats: 100, type: 'Standard' });
  const [hallSaving, setHallSaving] = useState(false);

  useEffect(() => {
    fetchTheaters();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const fetchTheaters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await backendApi.getTheaters();
      setTheaters(data || []);
    } catch (err) {
      setError('Failed to load theaters');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', location: '', address: '', phone: '', isActive: true });
    setShowForm(false);
    setEditingTheater(null);
  };

  const openCreate = () => {
    resetForm();
    setEditingTheater(null);
    setShowForm(true);
  };

  const openEdit = (theater) => {
    setEditingTheater(theater);
    setFormData({
      name: theater.name || '',
      location: theater.location || '',
      address: theater.address || '',
      phone: theater.phone || '',
      isActive: theater.isActive !== false
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingTheater) {
        await backendApi.updateTheater(editingTheater._id, formData);
        setSuccessMsg('Theater updated');
      } else {
        await backendApi.createTheater(formData);
        setSuccessMsg('Theater created');
      }
      await fetchTheaters();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save theater');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (theater) => {
    if (!window.confirm(`Delete "${theater.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await backendApi.deleteTheater(theater._id);
      setSuccessMsg('Theater deleted');
      await fetchTheaters();
    } catch (err) {
      setError('Failed to delete theater');
    }
  };

  const openHallManager = (theater) => {
    setHallTheater(theater);
    setHallForm({ name: '', totalSeats: 100, type: 'Standard' });
  };

  const handleAddHall = async (e) => {
    e.preventDefault();
    if (!hallTheater) return;
    setHallSaving(true);
    setError(null);
    try {
      const updated = await backendApi.addHallToTheater(hallTheater._id, hallForm);
      setSuccessMsg('Hall added');
      setHallTheater(updated);
      setHallForm({ name: '', totalSeats: 100, type: 'Standard' });
      await fetchTheaters();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add hall');
    } finally {
      setHallSaving(false);
    }
  };

  const handleRemoveHall = async (hallId) => {
    if (!hallTheater) return;
    setError(null);
    try {
      const updated = await backendApi.removeHallFromTheater(hallTheater._id, hallId);
      setSuccessMsg('Hall removed');
      setHallTheater(updated);
      await fetchTheaters();
    } catch (err) {
      setError('Failed to remove hall');
    }
  };

  const hallTypes = ['Standard', 'Premium', 'IMAX', 'Dolby Atmos', 'VIP'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black">Theaters Management</h2>
          <p className="text-slate-400">Manage theaters and their halls ({theaters.length} theaters)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTheaters} disabled={loading} className="bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-5 rounded-xl font-semibold transition-all disabled:opacity-50">
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={openCreate} className="bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 px-5 rounded-xl font-bold transition-all">
            + Add Theater
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-white ml-3">✕</button>
        </div>
      )}
      {successMsg && <div className="p-4 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">{successMsg}</div>}

      {loading && <p className="text-slate-400 text-center py-10">Loading theaters...</p>}

      {!loading && theaters.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-500 text-lg mb-4">No theaters yet</p>
          <button onClick={openCreate} className="bg-cyan-500 hover:bg-cyan-400 text-black py-3 px-6 rounded-xl font-bold transition-all">
            Create First Theater
          </button>
        </div>
      )}

      {!loading && theaters.length > 0 && (
        <div className="grid gap-4">
          {theaters.map((theater) => (
            <div key={theater._id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{theater.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theater.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {theater.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{theater.location}</p>
                  {theater.address && <p className="text-xs text-slate-500 mt-1">{theater.address}</p>}
                  {theater.phone && <p className="text-xs text-slate-500">{theater.phone}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openHallManager(theater)} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                    Halls ({theater.halls?.length || 0})
                  </button>
                  <button onClick={() => openEdit(theater)} className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(theater)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg text-sm font-semibold transition-all">
                    Delete
                  </button>
                </div>
              </div>

              {theater.halls?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {theater.halls.map((hall) => (
                    <span key={hall._id} className="bg-slate-800 border border-slate-700 text-sm px-3 py-1.5 rounded-lg text-slate-300">
                      {hall.name} <span className="text-slate-500">({hall.type} · {hall.totalSeats} seats)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Theater Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold mb-6">{editingTheater ? 'Edit Theater' : 'Add New Theater'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Theater Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" required placeholder="e.g. MovieMania Kathmandu" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Location *</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" required placeholder="e.g. Kathmandu, Nepal" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. New Baneshwor Road" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="e.g. 01-4234567" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                <label htmlFor="isActive" className="text-sm text-slate-300">Active (visible to users)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : editingTheater ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hall Manager Modal */}
      {hallTheater && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">Manage Halls</h3>
                <p className="text-slate-400 text-sm">{hallTheater.name} — {hallTheater.location}</p>
              </div>
              <button onClick={() => setHallTheater(null)} className="bg-slate-800 hover:bg-slate-700 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all">✕</button>
            </div>

            <form onSubmit={handleAddHall} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add New Hall</h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Hall Name *</label>
                  <input type="text" value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" required placeholder="e.g. Hall A" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Total Seats</label>
                  <input type="number" value={hallForm.totalSeats} min="1" onChange={(e) => setHallForm({ ...hallForm, totalSeats: parseInt(e.target.value, 10) || 100 })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select value={hallForm.type} onChange={(e) => setHallForm({ ...hallForm, type: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm">
                    {hallTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={hallSaving} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-5 rounded-lg text-sm transition-all disabled:opacity-50">
                {hallSaving ? 'Adding...' : 'Add Hall'}
              </button>
            </form>

            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Current Halls ({hallTheater.halls?.length || 0})</h4>
              {(!hallTheater.halls || hallTheater.halls.length === 0) ? (
                <p className="text-center text-slate-500 py-6">No halls added yet</p>
              ) : (
                <div className="space-y-2">
                  {hallTheater.halls.map((hall) => (
                    <div key={hall._id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-800/50 border-slate-700">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-bold">{hall.name}</p>
                          <p className="text-xs text-slate-400">{hall.type} · {hall.totalSeats} seats</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveHall(hall._id)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">Remove</button>
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

export default TheatersAdmin;
