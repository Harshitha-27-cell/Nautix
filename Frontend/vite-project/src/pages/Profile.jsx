import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Calendar,
  MessageSquare,
  History,
  LogOut,
  Save,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { DEFAULT_AVATAR } from '../constants/ocean';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState({ conversationsCount: 0, queriesCount: 0 });
  const [loading, setLoading] = useState(true);

  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditAvatar(user.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const [convsRes, logsRes] = await Promise.all([
          api.get('/api/v1/conversations'),
          api.get('/api/v1/query_logs'),
        ]);
        setStats({
          conversationsCount: convsRes.data.length,
          queriesCount: logsRes.data.length,
        });
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserStats();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      await api.put('/api/v1/users/me', {
        name: editName,
        avatar_url: editAvatar.trim() || DEFAULT_AVATAR,
      });
      await refreshUser();
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatarPreview = editAvatar || user?.avatar_url || DEFAULT_AVATAR;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <img
          src={avatarPreview}
          alt={user?.name}
          className="h-20 w-20 rounded-full object-cover border-4 border-cyan-400/30 shadow-lg"
          onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
        />

        <div className="text-center md:text-left space-y-1.5 flex-1">
          <h2 className="font-heading text-2xl font-bold text-slate-100">{user?.name}</h2>
          <p className="text-slate-400 text-sm flex items-center justify-center md:justify-start gap-2">
            <Mail className="h-4 w-4 text-slate-500" />
            {user?.email}
          </p>
          {user?.created_at && (
            <p className="text-slate-500 text-xs flex items-center justify-center md:justify-start gap-2">
              <Calendar className="h-4 w-4 text-slate-600" />
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold transition-all duration-200 cursor-pointer border border-rose-500/20"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved Chat Sessions</p>
            <p className="font-heading text-2xl font-bold text-slate-200 mt-1">
              {loading ? <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded" /> : stats.conversationsCount}
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-400/30 text-purple-400 flex items-center justify-center">
            <History className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executed Queries</p>
            <p className="font-heading text-2xl font-bold text-slate-200 mt-1">
              {loading ? <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded" /> : stats.queriesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-cyan-500/10">
          <h3 className="font-heading text-base font-bold text-slate-100 flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-400" />
            Edit Profile
          </h3>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {saveMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {saveMsg}
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {saveError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 text-slate-100 text-sm outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="h-4 w-4" /> Profile Image URL
            </label>
            <input
              type="url"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/50 focus:border-cyan-400 text-slate-100 text-sm outline-none"
            />
            <div className="flex items-center gap-3 mt-2">
              <img
                src={avatarPreview}
                alt="Preview"
                className="h-12 w-12 rounded-full object-cover border-2 border-cyan-400/30"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <p className="text-xxs text-slate-500">Leave empty to use the default dolphin avatar</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

