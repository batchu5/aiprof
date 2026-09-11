import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, FolderPlus, ArrowRight, Sparkles, Layers, Activity } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { spacesApi } from '../../services/api';

const EMOJI_OPTIONS = ['📚', '💻', '📐', '🤖', '🔬', '🎨', '💼', '🚀', '🧠', '🌐', '📊', '⚡'];
const COLOR_PRESETS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const SpacesList = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [color, setColor] = useState('#6366f1');

  const navigate = useNavigate();

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const res = await spacesApi.list();
      setSpaces(res?.spaces || []);
    } catch (err) {
      console.error('Error loading spaces:', err);
      toast.error('Failed to load spaces. Showing available local data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleCreateSpace = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a space name.');
      return;
    }

    setCreating(true);
    try {
      const newSpace = await spacesApi.create({
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
      });

      toast.success(`Space "${name}" created successfully!`);
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setIcon('📚');
      setColor('#6366f1');
      fetchSpaces();
    } catch (err) {
      console.error('Create space error:', err);
      toast.error(err.message || 'Failed to create space');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc' } }} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-7 h-7" />
            </span>
            My Learning Spaces
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize your academic domains, courses, and project repositories.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 py-3 px-5 shadow-lg shadow-indigo-600/20 text-sm font-semibold"
        >
          <Plus className="w-5 h-5" />
          Create Space
        </Button>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <Loading message="Fetching your study spaces..." />
      ) : spaces.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-inner">
            <FolderPlus className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No learning spaces found</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Create your first learning space to group your projects, upload PDFs, and begin tracking your Gemini AI study analytics.
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} className="mx-auto flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create First Space
          </Button>
        </div>
      ) : (
        /* Spaces Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => {
            const progress = space.overall_progress || 0;
            return (
              <div
                key={space.id}
                onClick={() => navigate(`/spaces/${space.id}`)}
                className="group relative bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500/50 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Accent Glow */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity"
                  style={{ backgroundColor: space.color || '#6366f1' }}
                />

                <div>
                  {/* Top Bar with Emoji Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border border-white/10"
                      style={{ backgroundColor: `${space.color || '#6366f1'}20`, color: space.color || '#6366f1' }}
                    >
                      {space.icon || '📚'}
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 font-medium">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{space.project_count || 0} Projects</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {space.name}
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {space.description || 'No description provided for this space.'}
                  </p>
                </div>

                {/* Progress Bar & Footer */}
                <div className="mt-6 pt-4 border-t border-slate-700/40 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-400">Mastery Progress</span>
                      <span className="text-indigo-400">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      {space.recent_activity || 'Active'}
                    </span>
                    <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SPACE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Learning Space">
        <form onSubmit={handleCreateSpace} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Space Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science, Machine Learning"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of course or domain topics..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Space Icon
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`p-2.5 text-xl rounded-lg transition-all ${
                    icon === e ? 'bg-indigo-600/30 border border-indigo-500 scale-110' : 'hover:bg-slate-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color Preset Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Theme Color
            </label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={creating}>
              Create Space
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SpacesList;
