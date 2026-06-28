import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Anchor, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import OceanBackground from '../components/ocean/OceanBackground';
import { NAUTIX_BRAND } from '../constants/ocean';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-6 selection:bg-sky-500 selection:text-slate-950">
      <OceanBackground density="medium" />

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 mb-4">
            <Anchor className="h-8 w-8 animate-pulse" />
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-wide text-white">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-2">Access the {NAUTIX_BRAND} Ocean Discovery Platform</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 text-slate-100 text-sm outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 text-slate-100 text-sm outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#4cc9f0] hover:bg-[#00b4d8] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold transition-all duration-200 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

