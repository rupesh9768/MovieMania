import React, { useState, useEffect } from 'react';
import {
  getTheaterAdmins,
  createTheaterAdmin,
  updateTheaterAdmin,
  deleteTheaterAdmin,
  getCities,
  getTheaters
} from '../../api/backendService';

const TheaterAdminsAdmin = () => {
  const [admins, setAdmins] = useState([]);
  const [cities, setCities] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', cityId: '', theaterId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adminsData, citiesData, theatersData] = await Promise.all([
        getTheaterAdmins(),
        getCities(),
        getTheaters()
      ]);
      setAdmins(adminsData);
      setCities(citiesData);
      setTheaters(theatersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTheaters = form.cityId
    ? theaters.filter(t => (t.city?._id || t.city) === form.cityId)
    : theaters;

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', cityId: '', theaterId: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await updateTheaterAdmin(editingId, {
          name: form.name,
          email: form.email,
          cityId: form.cityId,
          theaterId: form.theaterId
        });
        setSuccess('Theater admin updated');
      } else {
        if (!form.password) {
          setError('Password is required');
          return;
        }
        if (!form.theaterId) {
          setError('Theater is required');
          return;
        }
        await createTheaterAdmin({
          name: form.name,
          email: form.email,
          password: form.password,
          cityId: form.cityId,
          theaterId: form.theaterId
        });
        setSuccess('Theater admin created');
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (admin) => {
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      cityId: admin.assignedCity?._id || admin.assignedCity || '',
      theaterId: admin.assignedTheater?._id || admin.assignedTheater || ''
    });
    setEditingId(admin._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this theater admin?')) return;
    try {
      await deleteTheaterAdmin(id);
      setSuccess('Theater admin deleted');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Theater Admins</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-4 rounded-lg transition-all"
        >
          {showForm ? 'Cancel' : '+ Add Theater Admin'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-lg font-semibold mb-2">
            {editingId ? 'Edit Theater Admin' : 'Create Theater Admin'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">City</label>
              <select
                value={form.cityId}
                onChange={e => setForm({ ...form, cityId: e.target.value, theaterId: '' })}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select City</option>
                {cities.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Theater <span className="text-red-400">*</span></label>
              <select
                value={form.theaterId}
                onChange={e => setForm({ ...form, theaterId: e.target.value })}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Theater</option>
                {filteredTheaters.map(t => (
                  <option key={t._id} value={t._id}>{t.name} — {t.location}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 px-6 rounded-lg transition-all"
          >
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">City</th>
              <th className="text-left px-4 py-3">Theater</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-slate-500">No theater admins yet</td>
              </tr>
            ) : (
              admins.map(admin => (
                <tr key={admin._id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium">{admin.name}</td>
                  <td className="px-4 py-3 text-slate-400">{admin.email}</td>
                  <td className="px-4 py-3">{admin.assignedCity?.name || '—'}</td>
                  <td className="px-4 py-3">{admin.assignedTheater?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(admin._id)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TheaterAdminsAdmin;
