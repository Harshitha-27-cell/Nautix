import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Anchor, User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, ImageIcon } from 'lucide-react';
import OceanBackground from '../components/ocean/OceanBackground';
import { NAUTIX_BRAND, DEFAULT_AVATAR } from '../constants/ocean';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(name, email, password, avatarUrl.trim() || undefined);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <h2 className="font-heading text-2xl font-bold tracking-wide text-white">Create Account</h2>
          <p className="text-slate-400 text-sm mt-2">Get started with {NAUTIX_BRAND}</p>
        </div>

        {success && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>Registration successful! Redirecting to login...</p>
          </div>
        )}

        {error && !success && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 text-slate-100 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

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
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 text-slate-100 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Password (min. 6 chars)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 text-slate-100 text-sm outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Profile Image URL <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/your-photo.png"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 text-slate-100 text-sm outline-none transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={avatarUrl || DEFAULT_AVATAR}
                  alt="Preview"
                  className="h-10 w-10 rounded-full object-cover border-2 border-cyan-400/30"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
                />
                <p className="text-xxs text-slate-500">Default dolphin avatar used if left empty</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#4cc9f0] hover:bg-[#00b4d8] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold transition-all duration-200 shadow-lg shadow-cyan-500/20 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-slate-400">
          <span>Already have an account? </span>
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

