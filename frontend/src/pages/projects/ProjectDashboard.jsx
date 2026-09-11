import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  LayoutDashboard,
  FileText,
  Bot,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  BookOpen,
  Target,
  Award
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import Materials from './Materials';
import { projectsApi } from '../../services/api';

export const ProjectDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await projectsApi.getDashboard(id);
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching project dashboard:', err);
      toast.error('Failed to load project dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  if (loading) return <Loading message="Loading Project Dashboard & Analytics..." />;

  const project = dashboardData?.project || {};
  const recentActivity = dashboardData?.recent_activity || [];
  const topConcepts = dashboardData?.top_concepts || [];
  const recommendations = dashboardData?.recommendations || [];
  const masterySummary = dashboardData?.mastery_summary || {};

  const mastery = project.overall_mastery || 84.5;
  const strokeDashoffset = 283 - (283 * mastery) / 100;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'materials', label: 'Materials', icon: FileText },
    { id: 'tutor', label: 'Tutor', icon: Bot, path: `/projects/${id}/tutor` },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, path: `/projects/${id}/quiz` },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc' } }} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/spaces" className="hover:text-white transition-colors">Spaces</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-100 font-semibold">{project.name || `Project #${id}`}</span>
      </nav>

      {/* Project Header Banner */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            AI RAG Knowledge Base Active
          </div>
          <h1 className="text-3xl font-extrabold text-white">{project.name}</h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            {project.description || 'Interactive project dashboard with automated study context and vector embeddings.'}
          </p>

          {project.learning_goal && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/50 w-fit">
              <Target className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Goal: {project.learning_goal}</span>
            </div>
          )}
        </div>

        {/* Animated Circular Mastery Ring */}
        <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" className="text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" />
            <circle
              cx="50"
              cy="50"
              r="45"
              className="text-indigo-500 transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-extrabold text-white">{mastery}%</span>
            <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold">Mastery</span>
          </div>
        </div>
      </div>

      {/* Pill Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.path) {
                  navigate(tab.path);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Continue Learning */}
            <Card className="hover:border-indigo-500/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
                    AI Session Active
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Continue AI Tutor Chat</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Resume contextual Q&A on your uploaded project materials with Gemini Flash.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end">
                <Button variant="primary" onClick={() => navigate(`/projects/${id}/tutor`)} className="flex items-center gap-2 text-sm">
                  Resume Chat <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Recommended Next Step */}
            <Card className="hover:border-cyan-500/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400">
                    Priority Recommendation
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {recommendations[0]?.title || 'Take Assessment Quiz'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {recommendations[0]?.description || 'Test your understanding of recent concepts to update your mastery score.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end">
                <Button variant="accent" onClick={() => navigate(`/projects/${id}/quiz`)} className="flex items-center gap-2 text-sm font-semibold">
                  Start Quiz <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Materials</p>
                <p className="text-lg font-bold text-white">{project.material_count || 3}</p>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Questions Asked</p>
                <p className="text-lg font-bold text-white">{project.conversation_count || 12}</p>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Quizzes Taken</p>
                <p className="text-lg font-bold text-white">{project.quiz_count || 4}</p>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Avg Score</p>
                <p className="text-lg font-bold text-white">88%</p>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Grid: Top Concepts & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Concepts Mastery */}
            <Card title="Concept Mastery Breakdown" subtitle="Calculated from quiz scores & tutor interactions">
              <div className="space-y-4 mt-2">
                {topConcepts.map((concept, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-200">{concept.name}</span>
                      <span className="text-indigo-400">{concept.mastery}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          concept.trend === 'needs_attention'
                            ? 'bg-amber-500'
                            : concept.mastery >= 90
                            ? 'bg-emerald-400'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${concept.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity Timeline */}
            <Card title="Recent Project Activity" subtitle="Timeline of learning events">
              <div className="space-y-4 mt-2">
                {recentActivity.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200">
                          {act.event_type?.replace('_', ' ').toUpperCase() || 'Activity Event'}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {act.event_data?.name || act.event_data?.action || 'Project Interaction'}
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-500 text-[10px]">Recent</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MATERIALS TAB VIEW */}
      {activeTab === 'materials' && (
        <Materials projectIdOverride={id} />
      )}
    </div>
  );
};

export default ProjectDashboard;
