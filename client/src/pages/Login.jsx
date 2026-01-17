import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login logic here (e.g., check API)
    console.log('Logging in with:', formData);
    
    // Redirect to Home after login
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0b1121] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase">Password</label>
              <a href="#" className="text-xs text-cyan-500 hover:text-cyan-400">Forgot Password?</a>
            </div>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-500 font-bold hover:text-cyan-400 transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;