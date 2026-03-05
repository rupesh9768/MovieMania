import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Floating movie poster data for the animated left panel
const POSTER_URLS = [
  'https://image.tmdb.org/t/p/w300/qJ2tW6WMUDux911kpUpFoagIC6.jpg',
  'https://image.tmdb.org/t/p/w300/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
  'https://image.tmdb.org/t/p/w300/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
  'https://image.tmdb.org/t/p/w300/rktDFPbfHfUbArZ6OOOKsXcv0Bm.jpg',
  'https://image.tmdb.org/t/p/w300/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
  'https://image.tmdb.org/t/p/w300/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
  'https://image.tmdb.org/t/p/w300/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
  'https://image.tmdb.org/t/p/w300/sv1xJUazXeYqALzczSZ3O6nkH75.jpg',
  'https://image.tmdb.org/t/p/w300/7WsyChQLEftFiDhRkCCIsj56Z9.jpg',
  'https://image.tmdb.org/t/p/w300/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
  'https://image.tmdb.org/t/p/w300/6CoRTJTmijhBLJTUNoVSUNxZMEI.jpg',
  'https://image.tmdb.org/t/p/w300/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      if (data.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex relative overflow-hidden">
      
      {/* ========== LEFT PANEL - Animated Movie Posters ========== */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#0a0f1a]">
        {/* Animated glow orbs */}
        <div className="absolute top-[15%] right-[20%] w-80 h-80 bg-purple-500/10 rounded-full blur-[130px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[15%] left-[15%] w-72 h-72 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[40%] w-56 h-56 bg-blue-600/8 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '3s' }}></div>

        {/* Floating poster grid */}
        <div className="relative w-full h-full overflow-hidden">
          {/* Column 1 */}
          <div className="absolute left-[5%] top-0 w-32 animate-scroll-up opacity-40 hover:opacity-70 transition-opacity duration-500">
            <div className="flex flex-col gap-4">
              {[...POSTER_URLS.slice(0, 4), ...POSTER_URLS.slice(0, 4)].map((url, i) => (
                <div key={`col1-${i}`} className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 transform hover:scale-105 transition-transform duration-500">
                  <img src={url} alt="" className="w-full h-auto object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div className="absolute left-[30%] top-0 w-36 animate-scroll-down opacity-50 hover:opacity-80 transition-opacity duration-500" style={{ animationDelay: '1s' }}>
            <div className="flex flex-col gap-4">
              {[...POSTER_URLS.slice(4, 8), ...POSTER_URLS.slice(4, 8)].map((url, i) => (
                <div key={`col2-${i}`} className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 transform hover:scale-105 transition-transform duration-500">
                  <img src={url} alt="" className="w-full h-auto object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 3 */}
          <div className="absolute left-[58%] top-0 w-32 animate-scroll-up-slow opacity-35 hover:opacity-65 transition-opacity duration-500" style={{ animationDelay: '2s' }}>
            <div className="flex flex-col gap-4">
              {[...POSTER_URLS.slice(8, 12), ...POSTER_URLS.slice(8, 12)].map((url, i) => (
                <div key={`col3-${i}`} className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 transform hover:scale-105 transition-transform duration-500">
                  <img src={url} alt="" className="w-full h-auto object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          {/* Column 4 */}
          <div className="absolute left-[82%] top-0 w-28 animate-scroll-down opacity-30 hover:opacity-60 transition-opacity duration-500" style={{ animationDelay: '3s' }}>
            <div className="flex flex-col gap-4">
              {[...POSTER_URLS.slice(2, 6), ...POSTER_URLS.slice(2, 6)].map((url, i) => (
                <div key={`col4-${i}`} className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50 transform hover:scale-105 transition-transform duration-500">
                  <img src={url} alt="" className="w-full h-auto object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0b1121] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1121] via-transparent to-[#0b1121]/60 pointer-events-none"></div>


      </div>

      {/* ========== RIGHT PANEL - Register Form ========== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        {/* Subtle background */}
        <div className="absolute top-[10%] right-[10%] w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] left-[10%] w-48 h-48 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-3xl font-black tracking-tighter">
              MOVIE<span className="text-cyan-400">MANIA</span>
            </h2>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Create Account</h1>
            <p className="text-slate-500 text-sm">Join MovieMania and start exploring</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-shake">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3.5 pr-10 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm</label>
                <div className="relative group">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3.5 pr-10 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:bg-slate-900 transition-all placeholder:text-slate-600"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password strength indicator */}
            {formData.password && (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(level => (
                  <div 
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      formData.password.length >= level * 3 
                        ? level <= 1 ? 'bg-red-500' : level <= 2 ? 'bg-amber-500' : level <= 3 ? 'bg-cyan-500' : 'bg-green-500'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="relative z-10">{loading ? 'Creating Account...' : 'Create Account'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-xs text-slate-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* Login Link */}
          <div className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;


