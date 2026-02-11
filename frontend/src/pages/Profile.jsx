import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateProfile, uploadAvatarImage, getUserComments } from '../api/profileService';

const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const getPosterUrl = (poster) => {
  if (!poster) return null;
  if (poster.startsWith('http')) return poster;
  return `${IMG_BASE}${poster}`;
};

const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('http')) return avatar;
  return `${BACKEND_URL}${avatar}`;
};

// ============================================
// Time formatter
// ============================================
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

// ============================================
// Profile Page
// ============================================
const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  // Which user are we viewing?
  const viewingUserId = userId || authUser?.id || authUser?._id;
  const isOwnProfile = isAuthenticated && viewingUserId === (authUser?.id || authUser?._id);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('favorites');
  const [saveMessage, setSaveMessage] = useState('');

  // Comment history
  const [commentHistory, setCommentHistory] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // ============================================
  // Fetch profile
  // ============================================
  useEffect(() => {
    const fetchProfile = async () => {
      if (!viewingUserId) {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getUserProfile(viewingUserId);
        if (data.success) {
          setProfile(data.profile);
          setEditForm({
            name: data.profile.name || '',
            bio: data.profile.bio || '',
            gender: data.profile.gender || '',
            location: data.profile.location || '',
            avatar: data.profile.avatar || '',
            profileVisibility: data.profile.profileVisibility || 'public',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [viewingUserId, isAuthenticated]);

  // ============================================
  // Fetch comment history when tab switches
  // ============================================
  useEffect(() => {
    if (activeTab === 'comments' && viewingUserId) {
      const fetchComments = async () => {
        setCommentsLoading(true);
        try {
          const data = await getUserComments(viewingUserId);
          if (data.success) {
            setCommentHistory(data.contentItems || []);
          }
        } catch (err) {
          console.error('Failed to load comments:', err);
        } finally {
          setCommentsLoading(false);
        }
      };
      fetchComments();
    }
  }, [activeTab, viewingUserId]);

  // ============================================
  // Handle avatar file upload
  // ============================================
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadAvatarImage(file);
      if (data.success) {
        setProfile(prev => ({ ...prev, avatar: data.avatar }));
        setEditForm(prev => ({ ...prev, avatar: data.avatar }));
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({ ...parsed, avatar: data.avatar }));
        }
        if (refreshUser) refreshUser();
        setSaveMessage('Avatar updated!');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ============================================
  // Save profile
  // ============================================
  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updateProfile({
        name: editForm.name,
        bio: editForm.bio,
        gender: editForm.gender,
        location: editForm.location,
        profileVisibility: editForm.profileVisibility,
      });
      if (data.success) {
        setProfile(prev => ({ ...prev, ...data.user }));
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({ ...parsed, ...data.user }));
        }
        setEditing(false);
        setSaveMessage('Profile updated!');
        setTimeout(() => setSaveMessage(''), 3000);
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Navigate to details
  // ============================================
  const goToDetails = (item) => {
    const mediaId = item?.mediaId || item?.contentId;
    const mediaType = item?.mediaType || item?.contentType;
    if (!mediaId) return;
    if (mediaType === 'anime') {
      navigate(`/details/anime/${mediaId}`);
    } else {
      navigate(`/details/${mediaType || 'movie'}/${mediaId}`);
    }
  };

  // Avatar color fallback
  const getAvatarColor = (name) => {
    const colors = [
      'from-cyan-500 to-blue-600',
      'from-purple-500 to-pink-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-yellow-500 to-amber-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-violet-600',
    ];
    return colors[(name || '').charCodeAt(0) % colors.length];
  };

  // Gender label
  const getGenderLabel = (gender) => {
    if (gender === 'male') return 'Male';
    if (gender === 'female') return 'Female';
    if (gender === 'other') return 'Other';
    return '';
  };

  // Content type helpers
  const getContentTypeLabel = (type) => {
    if (type === 'movie') return 'Movie';
    if (type === 'tv') return 'TV Show';
    if (type === 'anime') return 'Anime';
    if (type === 'theater') return 'Theater';
    return type;
  };

  const getContentTypeColor = (type) => {
    if (type === 'movie') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    if (type === 'tv') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (type === 'anime') return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (type === 'theater') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  // ============================================
  // Loading
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error
  // ============================================
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-slate-400 mb-6">{error || 'This user does not exist.'}</p>
        <button onClick={() => navigate(-1)} className="text-cyan-400 hover:underline">Go back</button>
      </div>
    );
  }

  // ============================================
  // Private profile view
  // ============================================
  if (profile.isPrivate && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-dark-bg text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="mb-6">
            {profile.avatar ? (
              <img src={getAvatarUrl(profile.avatar)} alt={profile.name} className="w-24 h-24 rounded-full mx-auto border-4 border-slate-700 object-cover" />
            ) : (
              <div className={`w-24 h-24 rounded-full mx-auto bg-linear-to-br ${getAvatarColor(profile.name)} flex items-center justify-center text-white text-3xl font-bold`}>
                {profile.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">{profile.name}</h1>
          {profile.role === 'admin' && (
            <span className="inline-block mb-4 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase rounded-full border border-red-500/30">Admin</span>
          )}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-8 max-w-md mx-auto mt-6">
            <svg className="w-10 h-10 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="text-slate-400">This profile is private</p>
            <p className="text-slate-500 text-sm mt-2">Member since {formatDate(profile.createdAt)}</p>
          </div>
          <button onClick={() => navigate(-1)} className="mt-6 text-cyan-400 hover:underline text-sm">Go back</button>
        </div>
      </div>
    );
  }

  const favoritesCount = profile.favorites?.length || 0;
  const watchlistCount = profile.watchlist?.length || 0;

  // ============================================
  // Main render
  // ============================================
  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />

      {/* Hero Banner */}
      <div className="relative bg-linear-to-b from-cyan-900/20 via-slate-900/50 to-dark-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar */}
            <div className="relative group">
              {profile.avatar ? (
                <img
                  src={getAvatarUrl(profile.avatar)}
                  alt={profile.name}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-slate-700 object-cover shadow-2xl"
                />
              ) : (
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full bg-linear-to-br ${getAvatarColor(profile.name)} flex items-center justify-center text-white text-4xl md:text-5xl font-bold border-4 border-slate-700 shadow-2xl`}>
                  {profile.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 w-9 h-9 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Upload photo"
                >
                  {uploading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black">{profile.name}</h1>
                {profile.role === 'admin' && (
                  <span className="px-2.5 py-1 bg-red-500/20 text-red-400 text-[11px] font-bold uppercase rounded-full border border-red-500/30">Admin</span>
                )}
                {isOwnProfile && (
                  <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-400 text-[11px] font-bold uppercase rounded-full border border-cyan-500/25">You</span>
                )}
              </div>

              {profile.bio && (
                <p className="text-slate-400 mt-2 max-w-lg text-sm leading-relaxed">{profile.bio}</p>
              )}

              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
                {profile.location && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profile.location}
                  </span>
                )}
                {profile.gender && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {getGenderLabel(profile.gender)}
                  </span>
                )}
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 justify-center md:justify-start">
                <div className="text-center">
                  <p className="text-xl font-bold text-pink-400">{favoritesCount}</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Favorites</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-cyan-400">{watchlistCount}</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-wide">Watchlist</p>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          {saveMessage}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Edit Form */}
        {editing && isOwnProfile && (
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit Profile
            </h2>

            {/* Avatar upload section */}
            <div className="mb-5 flex items-center gap-4">
              <div className="relative">
                {editForm.avatar ? (
                  <img src={getAvatarUrl(editForm.avatar)} alt="" className="w-16 h-16 rounded-full border-2 border-slate-700 object-cover" />
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-linear-to-br ${getAvatarColor(editForm.name)} flex items-center justify-center text-white text-xl font-bold border-2 border-slate-700`}>
                    {editForm.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Upload Photo
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP. Max 5MB.</p>
              </div>
              {editForm.avatar && (
                <button
                  onClick={async () => {
                    setEditForm(prev => ({ ...prev, avatar: '' }));
                    try {
                      await updateProfile({ avatar: '' });
                      setProfile(prev => ({ ...prev, avatar: '' }));
                      const stored = localStorage.getItem('user');
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        localStorage.setItem('user', JSON.stringify({ ...parsed, avatar: '' }));
                      }
                      if (refreshUser) refreshUser();
                    } catch (err) {
                      console.error('Failed to remove avatar:', err);
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  maxLength={50}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Gender</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40 cursor-pointer"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                  placeholder="e.g. Kathmandu, Nepal"
                  maxLength={100}
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">Profile Visibility</label>
                <select
                  value={editForm.profileVisibility}
                  onChange={(e) => setEditForm({ ...editForm, profileVisibility: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/40 cursor-pointer"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5 block">
                Bio <span className="text-slate-600 normal-case">({(editForm.bio || '').length}/300)</span>
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                rows={3}
                maxLength={300}
                placeholder="Tell others about yourself..."
              />
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-800/50">
              <button
                onClick={handleSave}
                disabled={saving || !editForm.name?.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    name: profile.name || '',
                    bio: profile.bio || '',
                    gender: profile.gender || '',
                    location: profile.location || '',
                    avatar: profile.avatar || '',
                    profileVisibility: profile.profileVisibility || 'public',
                  });
                }}
                className="text-slate-400 hover:text-white text-sm px-5 py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-800/50">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'favorites'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Favorites ({favoritesCount})
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'watchlist'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Watchlist ({watchlistCount})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'comments'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Comments
          </button>
        </div>

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <>
            {favoritesCount === 0 ? (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                <p className="text-slate-500 text-sm">
                  {isOwnProfile ? "You haven't added any favorites yet." : 'No favorites yet.'}
                </p>
                {isOwnProfile && (
                  <Link to="/browse" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm">
                    Browse content
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {profile.favorites.map((item) => (
                  <div
                    key={`${item.mediaType}-${item.mediaId}`}
                    onClick={() => goToDetails(item)}
                    className="cursor-pointer group"
                  >
                    <div className="relative aspect-2/3 rounded-xl overflow-hidden border border-slate-800/50 group-hover:border-pink-500/40 transition-all shadow-lg">
                      {item.poster ? (
                        <img
                          src={getPosterUrl(item.poster)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.mediaType === 'movie'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : item.mediaType === 'tv'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      }`}>
                        {item.mediaType}
                      </div>
                      {item.rating > 0 && (
                        <div className="absolute top-1.5 right-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                          <span className="text-yellow-400">&#9733;</span> {item.rating.toFixed(1)}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white font-medium text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">{item.title}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 truncate font-medium">{item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <>
            {watchlistCount === 0 ? (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="text-slate-500 text-sm">
                  {isOwnProfile ? "You haven't added anything to your watchlist yet." : 'No watchlist items yet.'}
                </p>
                {isOwnProfile && (
                  <Link to="/browse" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm">
                    Browse content
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {profile.watchlist.map((item) => (
                  <div
                    key={`${item.mediaType}-${item.mediaId}`}
                    onClick={() => goToDetails(item)}
                    className="cursor-pointer group"
                  >
                    <div className="relative aspect-2/3 rounded-xl overflow-hidden border border-slate-800/50 group-hover:border-cyan-500/40 transition-all shadow-lg">
                      {item.poster ? (
                        <img
                          src={getPosterUrl(item.poster)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.mediaType === 'movie'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : item.mediaType === 'tv'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      }`}>
                        {item.mediaType}
                      </div>
                      {item.rating > 0 && (
                        <div className="absolute top-1.5 right-1.5 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                          <span className="text-yellow-400">&#9733;</span> {item.rating.toFixed(1)}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-white font-medium text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">{item.title}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 truncate font-medium">{item.title}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <>
            {commentsLoading ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500 text-sm">Loading comments...</p>
              </div>
            ) : commentHistory.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-slate-500 text-sm">
                  {isOwnProfile ? "You haven't commented on anything yet." : 'No comments yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {commentHistory.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => goToDetails(item)}
                    className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getContentTypeColor(item.contentType)}`}>
                            {getContentTypeLabel(item.contentType)}
                          </span>
                          <span className="text-xs text-slate-500">{timeAgo(item.lastCommentAt)}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
                          {item.contentTitle || `${getContentTypeLabel(item.contentType)} #${item.contentId}`}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
                        </p>
                        {item.latestComment && (
                          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 italic">
                            &quot;{item.latestComment.length > 120 ? item.latestComment.slice(0, 120) + '...' : item.latestComment}&quot;
                          </p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
