import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Folder,
  ArrowRight,
  Play,
  Award,
  MessageSquare,
  Upload,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { homeApi } from '../../services/api';

export const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const res = await homeApi.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load home dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  if (loading) {
    return <Loading message="Loading your personal learning dashboard..." />;
  }

  const welcomeMsg = data?.welcome_message || 'Welcome back!';
  const continueLearning = data?.continue_learning;
  const recentProjects = data?.recent_projects || [];
  const overallProgress = data?.overall_progress || { total_concepts: 0, mastered: 0, overall_mastery: 0, active_streak: 0, total_spaces: 0, total_projects: 0 };
  const areasToImprove = data?.areas_to_improve || [];
  const recommendedActions = data?.recommended_actions || [];
  const activitySummary = data?.activity_summary || { this_week: { sessions: 0, questions_asked: 0, quizzes_taken: 0 }, vs_last_week: '+0%' };
  const sparklineData = activitySummary.daily_sparkline || [
    { day: 'Mon', events: 0 },
    { day: 'Tue', events: 0 },
    { day: 'Wed', events: 0 },
    { day: 'Thu', events: 0 },
    { day: 'Fri', events: 0 },
    { day: 'Sat', events: 0 },
    { day: 'Sun', events: 0 },
  ];

  // SVG Gauge calculations
  const masteryPct = Math.min(100, Math.max(0, overallProgress.overall_mastery || 0));
  const circleRadius = 54;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (masteryPct / 100) * circleCircumference;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. WELCOME BANNER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-glow pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Mastery Engine Active</span>
              <span className="inline-flex items-center gap-1 ml-2 pl-2 border-l border-indigo-500/30 text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {overallProgress.active_streak || 0} Day Streak
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {welcomeMsg} 👋
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Track your concept mastery, continue your AI study sessions, and review personalized quiz recommendations.
            </p>
          </div>

          {/* Quick Header Stats */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px] shadow-lg backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase">Spaces</p>
              <h4 className="text-xl font-bold text-indigo-400 mt-1">{overallProgress.total_spaces || 0}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px] shadow-lg backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase">Projects</p>
              <h4 className="text-xl font-bold text-purple-400 mt-1">{overallProgress.total_projects || 0}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[90px] shadow-lg backdrop-blur-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase">Mastery</p>
              <h4 className="text-xl font-bold text-cyan-400 mt-1">{masteryPct.toFixed(0)}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTINUE LEARNING FEATURED CARD */}
      {continueLearning ? (
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-indigo-500/30 p-6 sm:p-8 shadow-xl backdrop-blur-md hover:border-indigo-500/50 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Play className="w-3.5 h-3.5 fill-indigo-400" />
                Continue Where You Left Off
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">{continueLearning.project_name}</h3>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                  {continueLearning.space_name}
                </span>
                <span>•</span>
                <span>{continueLearning.last_action || 'Active study session'}</span>
              </p>
            </div>
            <Button
              onClick={() => navigate(`/projects/${continueLearning.project_id}`)}
              variant="primary"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform"
            >
              Continue Learning <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Folder}
          title="Start Your First Learning Journey"
          description="Create a study space and upload lecture notes or docs to activate Gemini AI study tools."
          actionText="Create Study Space"
          onAction={() => navigate('/spaces')}
        />
      )}

      {/* 3. RECENT PROJECTS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Folder className="w-5 h-5 text-indigo-400" />
              Recent Projects
            </h3>
            <p className="text-xs text-slate-400">Jump straight into active subjects</p>
          </div>
          <button
            onClick={() => navigate('/spaces')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            View All Spaces <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="group cursor-pointer p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all shadow-md hover:shadow-indigo-950/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {p.space_name || 'Study Space'}
                  </span>
                  <span className="text-xs text-slate-500">{p.last_activity || 'Recent'}</span>
                </div>
                <h4 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1 mb-3">
                  {p.name}
                </h4>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400">Mastery Progress</span>
                  <span className="text-xs font-bold text-cyan-400">{p.mastery}%</span>
                </div>
                <div className="mt-1.5 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, p.mastery)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Folder}
            title="You don't have any projects yet"
            description="Create your first study project within a space to upload notes and generate AI quizzes."
            actionText="Go to Spaces"
            onAction={() => navigate('/spaces')}
          />
        )}
      </div>

      {/* 4. PROGRESS OVERVIEW & WEEKLY ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Progress Overview (Gauge + Stats) */}
        <Card className="lg:col-span-7 flex flex-col justify-between" title="Progress Overview" subtitle="Global concept mastery across projects">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center my-auto py-2">
            {/* SVG Circular Gauge */}
            <div className="relative flex flex-col items-center justify-center">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={circleRadius}
                  stroke="url(#masteryGradient)"
                  strokeWidth="10"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="masteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white">{masteryPct.toFixed(0)}%</span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Mastery</span>
              </div>
            </div>

            {/* Overall Stats Breakdown */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mastered Concepts</p>
                    <p className="text-base font-bold text-slate-100">
                      {overallProgress.mastered} <span className="text-xs text-slate-500 font-normal">/ {overallProgress.total_concepts} total</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Weekly Activity vs Last Week</p>
                    <p className="text-base font-bold text-emerald-400">{activitySummary.vs_last_week || '+0%'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Weekly Activity Sparkline */}
        <Card className="lg:col-span-5 flex flex-col justify-between" title="Weekly Activity" subtitle="Study events completed last 7 days">
          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="colorSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="events" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpark)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Sessions</p>
              <p className="text-sm font-bold text-slate-200">{activitySummary.this_week?.sessions || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Questions</p>
              <p className="text-sm font-bold text-indigo-400">{activitySummary.this_week?.questions_asked || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Quizzes</p>
              <p className="text-sm font-bold text-purple-400">{activitySummary.this_week?.quizzes_taken || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. AREAS TO IMPROVE & 6. RECOMMENDED ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Areas to Improve */}
        <Card title="Areas to Improve" subtitle="Top weak concepts needing target review">
          {areasToImprove.length > 0 ? (
            <div className="space-y-4">
              {areasToImprove.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-sm font-bold text-slate-200 truncate">{item.concept}</p>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{item.project}</p>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${item.mastery}%` }}></div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/tutor?project_id=${item.project_id}&query=Explain ${encodeURIComponent(item.concept)}`)}
                    className="flex items-center gap-1 shrink-0"
                  >
                    Study <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Weak Areas Identified Yet</p>
              <p className="text-xs text-slate-400 mt-1">Take quizzes and study materials to generate targeted weak concept tracking.</p>
            </div>
          )}
        </Card>

        {/* Right: Recommended Actions */}
        <Card title="Recommended Actions" subtitle="AI-powered next steps to boost retention">
          {recommendedActions.length > 0 ? (
            <div className="space-y-4">
              {recommendedActions.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                      {rec.type === 'take_quiz' ? (
                        <Award className="w-5 h-5 text-purple-400" />
                      ) : rec.type === 'tutor_session' ? (
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Upload className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{rec.title}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{rec.description}</p>
                      <span className="inline-block text-[10px] font-semibold text-slate-500 mt-1">{rec.project_name}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (rec.type === 'take_quiz') navigate(`/quiz?project_id=${rec.project_id}`);
                      else if (rec.type === 'tutor_session') navigate(`/tutor?project_id=${rec.project_id}`);
                      else navigate(`/projects/${rec.project_id}`);
                    }}
                    className="shrink-0"
                  >
                    Action
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Recommendations Yet</p>
              <p className="text-xs text-slate-400 mt-1">Create a space and upload study materials to receive personalized AI recommendations.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Home;
