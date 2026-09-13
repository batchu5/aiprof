import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Layers,
  MessageSquare,
  HelpCircle,
  BarChart3,
  ArrowRight,
  Target,
  Sparkles,
  Activity
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loading from '../../components/common/Loading';
import { spacesApi, projectsApi } from '../../services/api';

export const SpaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [space, setSpace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Space Edit Form State
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');

  // New Project Form State
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projGoal, setProjGoal] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const spaceRes = await spacesApi.get(id);
      const spaceObj = spaceRes?.space || spaceRes;
      setSpace(spaceObj);
      setSpaceName(spaceObj.name || '');
      setSpaceDesc(spaceObj.description || '');

      const projList = await projectsApi.list(id);
      setProjects(projList || []);
    } catch (err) {
      console.error('Error loading space detail:', err);
      toast.error('Failed to load space data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateSpace = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await spacesApi.update(id, { name: spaceName, description: spaceDesc });
      toast.success('Space updated successfully!');
      setIsEditSpaceOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to update space.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSpace = async () => {
    if (!window.confirm(`Are you sure you want to delete space "${space?.name}"? This action cannot be undone.`)) return;
    try {
      await spacesApi.delete(id);
      toast.success('Space deleted successfully.');
      navigate('/spaces');
    } catch (err) {
      toast.error(err.message || 'Failed to delete space.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim()) {
      toast.error('Please enter a project name.');
      return;
    }

    setSubmitting(true);
    try {
      await projectsApi.create({
        space_id: id,
        name: projName.trim(),
        description: projDesc.trim(),
        learning_goal: projGoal.trim(),
      });

      toast.success(`Project "${projName}" created successfully!`);
      setIsAddProjectOpen(false);
      setProjName('');
      setProjDesc('');
      setProjGoal('');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading space details and projects..." />;

  return (
    <div className="space-y-8 animate-fade-in">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc' } }} />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/spaces" className="hover:text-slate-900 transition-colors">Spaces</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-semibold">{space?.name || 'Space Details'}</span>
      </nav>

      {/* Space Header */}
      <div className="bg-white/60 border border-slate-200 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10 shrink-0"
            style={{ backgroundColor: `${space?.color || '#6366f1'}20` }}
          >
            {space?.icon || '📚'}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">{space?.name}</h1>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
              {space?.description || 'No description available.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" onClick={() => setIsEditSpaceOpen(true)} className="flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit
          </Button>
          <Button variant="danger" onClick={handleDeleteSpace} className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/50 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Projects</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
        </div>
        <div className="bg-white border border-slate-200/50 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Overall Progress</p>
          <p className="text-2xl font-bold text-indigo-400 mt-1">{space?.overall_progress || 80}%</p>
        </div>
        <div className="bg-white border border-slate-200/50 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active Projects</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {projects.filter(p => p.status !== 'archived').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200/50 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Last Activity</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">Today</p>
        </div>
      </div>

      {/* Projects Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" /> Attached Projects
        </h2>
        <Button variant="primary" onClick={() => setIsAddProjectOpen(true)} className="flex items-center gap-2 py-2 px-4 text-sm">
          <Plus className="w-4 h-4" /> Add Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const mastery = proj.overall_mastery || 0;
          return (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="group bg-white backdrop-blur-md border border-slate-200/50 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {proj.status || 'Active'}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-400" /> Goal Set
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              {/* Progress & Quick Actions */}
              <div className="mt-6 pt-4 border-t border-slate-200/40 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Mastery</span>
                    <span className="text-indigo-400">{mastery}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/projects/${proj.id}/tutor`); }}
                      title="AI Tutor"
                      className="p-2 rounded-xl bg-white hover:bg-blue-600/20 text-slate-600 hover:text-indigo-400 transition-colors border border-slate-200/60"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/projects/${proj.id}/quiz`); }}
                      title="Take Quiz"
                      className="p-2 rounded-xl bg-white hover:bg-blue-700/20 text-slate-600 hover:text-purple-400 transition-colors border border-slate-200/60"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Project Card */}
        <div
          onClick={() => setIsAddProjectOpen(true)}
          className="border-2 border-dashed border-slate-200/80 hover:border-blue-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/30 transition-all min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-indigo-400 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-900">Add New Project</p>
          <p className="text-xs text-slate-500 mt-1">Attach a new course module or project domain</p>
        </div>
      </div>

      {/* EDIT SPACE MODAL */}
      <Modal isOpen={isEditSpaceOpen} onClose={() => setIsEditSpaceOpen(false)} title="Edit Space">
        <form onSubmit={handleUpdateSpace} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Space Name</label>
            <input
              type="text"
              required
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={3}
              value={spaceDesc}
              onChange={(e) => setSpaceDesc(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsEditSpaceOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* CREATE PROJECT MODAL */}
      <Modal isOpen={isAddProjectOpen} onClose={() => setIsAddProjectOpen(false)} title="Add New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Project Name *</label>
            <input
              type="text"
              required
              value={projName}
              onChange={(e) => setProjName(e.target.value)}
              placeholder="e.g. Neural Networks & CNNs"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Description</label>
            <textarea
              rows={2}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Module overview or course summary..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Learning Goal</label>
            <input
              type="text"
              value={projGoal}
              onChange={(e) => setProjGoal(e.target.value)}
              placeholder="e.g. Master backprop equations and pass quiz"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setIsAddProjectOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SpaceDetail;
