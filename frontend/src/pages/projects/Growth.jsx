import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Bot,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Calendar,
  Zap,
  BarChart2,
  SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { masteryApi, recommendationsApi } from '../../services/api';

export const Growth = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [generatingRecs, setGeneratingRecs] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [growthData, setGrowthData] = useState(null);
  const [masteryData, setMasteryData] = useState(null);
  const [recommendationsList, setRecommendationsList] = useState([]);
  const [sortOption, setSortOption] = useState('mastery'); // 'mastery' | 'trend' | 'alphabetical'

  useEffect(() => {
    if (projectId) {
      loadAllGrowthData();
    }
  }, [projectId]);

  const loadAllGrowthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [growthRes, masteryRes, recsRes] = await Promise.all([
        masteryApi.getGrowth(projectId),
        masteryApi.getOverview(projectId),
        recommendationsApi.list(projectId)
      ]);

      setGrowthData(growthRes);
      setMasteryData(masteryRes);
      setRecommendationsList(recsRes || []);
    } catch (err) {
      console.error('Error loading growth tracking analytics:', err);
      setError('Failed to load growth tracking data. Please refresh or try again.');
    } fontFinally: {
      setLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setGeneratingRecs(true);
    try {
      const freshRecs = await recommendationsApi.generate(projectId);
      setRecommendationsList(freshRecs || []);
    } catch (err) {
      console.error('Error generating recommendations:', err);
    } finally {
      setGeneratingRecs(false);
    }
  };

  const handleDismissRecommendation = async (recId) => {
    setRecommendationsList((prev) => prev.filter((r) => r.id !== recId));
    try {
      await recommendationsApi.dismiss(recId);
    } catch (err) {
      console.warn('Error dismissing recommendation:', err);
    }
  };

  const handleActionRecommendation = (rec) => {
    const recType = (rec.type || '').toLowerCase();
    if (recType.includes('quiz')) {
      navigate(`/projects/${projectId}/quiz`);
    } else if (recType.includes('tutor')) {
      navigate(`/projects/${projectId}/tutor`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  if (loading) return <Loading message="Analyzing concept mastery & growth trends..." />;

  const growthSummary = growthData?.growth_summary || {
    improving_count: 0,
    stable_count: 0,
    needs_attention_count: 0,
    overall_trend: 'improving'
  };

  const conceptTrends = growthData?.concept_trends || masteryData?.concepts || [];
  const quizPerf = growthData?.quiz_performance || {
    total_quizzes: 0,
    average_score: 0,
    recent_scores: [65, 70, 78, 85],
    improvement: 'Consistent progress'
  };
  const strengths = growthData?.strengths || [];
  const weaknesses = growthData?.weaknesses || [];
  const milestones = growthData?.milestones || [];

  // Prepare chart data
  const chartData = (quizPerf.recent_scores || []).map((score, index) => ({
    name: `Quiz ${index + 1}`,
    score: score,
    avg: quizPerf.average_score || 70
  }));

  // Sort concept trends
  const sortedConcepts = [...conceptTrends].sort((a, b) => {
    if (sortOption === 'mastery') {
      return (b.current_mastery || b.mastery_level || 0) - (a.current_mastery || a.mastery_level || 0);
    }
    if (sortOption === 'trend') {
      const weight = (t) => (t === 'improving' ? 3 : t === 'stable' ? 2 : 1);
      return weight(b.trend) - weight(a.trend);
    }
    if (sortOption === 'alphabetical') {
      return (a.concept_name || a.name || '').localeCompare(b.concept_name || b.name || '');
    }
    return 0;
  });

  // Helper for recommendation icons
  const getRecommendationIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('quiz')) return <HelpCircle className="w-5 h-5 text-cyan-400" />;
    if (t.includes('tutor')) return <Bot className="w-5 h-5 text-purple-400" />;
    if (t.includes('review') || t.includes('material')) return <BookOpen className="w-5 h-5 text-indigo-400" />;
    if (t.includes('focus')) return <Target className="w-5 h-5 text-amber-400" />;
    return <Award className="w-5 h-5 text-emerald-400" />;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto px-4 py-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Project Dashboard
        </Link>

        <button
          onClick={loadAllGrowthData}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/60 p-6 sm:p-8 border border-indigo-500/20 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> Growth Analytics
          </div>
          <h1 className="text-3xl font-extrabold text-white">Mastery Model & Growth Tracking</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Track concept comprehension trajectory, quiz performance milestones, and real-time AI study recommendations.
          </p>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <div>
            <p className="text-xs text-slate-400 font-medium">Overall Direction</p>
            <p className="text-sm font-bold text-emerald-400">
              {growthSummary.overall_trend === 'improving' ? 'Learning is Improving!' : 'Attention Required'}
            </p>
          </div>
        </div>
      </div>

      {/* 1. GROWTH OVERVIEW (Top Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Improving */}
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Improving Concepts</p>
            <p className="text-3xl font-extrabold text-white">{growthSummary.improving_count}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Stable */}
        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Stable Concepts</p>
            <p className="text-3xl font-extrabold text-white">{growthSummary.stable_count}</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300">
            <Minus className="w-6 h-6" />
          </div>
        </div>

        {/* Needs Attention */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Needs Attention</p>
            <p className="text-3xl font-extrabold text-white">{growthSummary.needs_attention_count}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. CONCEPT MASTERY BREAKDOWN (Main Section) */}
      <Card
        title="Concept Mastery Trajectory"
        subtitle="Visual representation of concept levels and changes over time"
      >
        {/* Sort Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" /> Sort Concepts:
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: 'mastery', label: 'By Mastery' },
              { id: 'trend', label: 'By Trend' },
              { id: 'alphabetical', label: 'Alphabetical' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortOption(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortOption === opt.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Concept Rows */}
        <div className="space-y-4">
          {sortedConcepts.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-xs">No concepts recorded for this project yet.</p>
          ) : (
            sortedConcepts.map((item, idx) => {
              const name = item.concept_name || item.name || 'Concept';
              const curr = item.current_mastery !== undefined ? item.current_mastery : (item.mastery_level || 0);
              const change = item.change !== undefined ? item.change : (curr - (item.previous_level || 0));

              let barGradient = 'from-emerald-500 to-teal-400';
              if (curr < 40) barGradient = 'from-rose-500 to-red-400';
              else if (curr < 75) barGradient = 'from-amber-500 to-yellow-400';

              let trendIcon = <Minus className="w-4 h-4 text-slate-400" />;
              if (item.trend === 'improving' || change > 0) trendIcon = <TrendingUp className="w-4 h-4 text-emerald-400" />;
              if (item.trend === 'needs_attention' || item.trend === 'declining' || change < 0) trendIcon = <TrendingDown className="w-4 h-4 text-rose-400" />;

              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100">{name}</span>
                      {trendIcon}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        change > 0 ? 'bg-emerald-500/10 text-emerald-400' : change < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {change > 0 ? `+${change}%` : `${change}%`}
                      </span>
                      <span className="text-slate-200 font-extrabold text-sm">{Math.round(curr)}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                    <div
                      className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out rounded-full`}
                      style={{ width: `${Math.max(4, Math.min(100, curr))}%` }}
                    />
                  </div>

                  {item.trend_description && (
                    <p className="text-[11px] text-slate-400">{item.trend_description}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* 3. QUIZ PERFORMANCE CHART */}
      <Card
        title="Quiz Assessment Score Trend"
        subtitle={`Average score: ${quizPerf.average_score}% • ${quizPerf.improvement}`}
      >
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <ReferenceLine y={quizPerf.average_score} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Avg', fill: '#f59e0b', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', r: 5, strokeWidth: 2, stroke: '#1e1b4b' }}
                activeDot={{ r: 8, fill: '#ec4899' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. STRENGTHS & WEAKNESSES & MILESTONES (2 Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strengths & Weaknesses */}
        <Card title="Strengths & Target Areas" subtitle="Concept comprehension grouping">
          <div className="space-y-6 mt-2">
            {/* Strengths Column */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                💪 Mastered Strengths (≥80%)
              </h4>
              <div className="flex flex-wrap gap-2">
                {strengths.length === 0 ? (
                  <span className="text-xs text-slate-500">Keep practicing to achieve concept mastery.</span>
                ) : (
                  strengths.map((st, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {st}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Weaknesses Column */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                🎯 Target Areas to Improve (&lt;40%)
              </h4>
              <div className="flex flex-wrap gap-2">
                {weaknesses.length === 0 ? (
                  <span className="text-xs text-emerald-400/90 font-medium">No concepts currently below target threshold! 🎉</span>
                ) : (
                  weaknesses.map((wk, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {wk}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Milestones Timeline */}
        <Card title="Achievement Milestones" subtitle="Timeline of study achievements">
          <div className="space-y-4 mt-2 max-h-[260px] overflow-y-auto pr-1">
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-500">Complete quizzes and tutor sessions to unlock milestones.</p>
            ) : (
              milestones.map((m, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-200">{m.text}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{m.date || 'Recent'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 5. RECOMMENDATIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> AI Action Recommendations
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Dynamically synthesized based on your mastery profile and recent activity</p>
          </div>

          <Button
            variant="outline"
            disabled={generatingRecs}
            onClick={handleGenerateRecommendations}
            className="text-xs flex items-center gap-2"
          >
            {generatingRecs ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" /> Generate New Recommendations
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendationsList.length === 0 ? (
            <div className="md:col-span-2 p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs">
              No active recommendations. Click "Generate New Recommendations" to ask AI for fresh study actions.
            </div>
          ) : (
            recommendationsList.map((rec) => {
              const priority = rec.priority || 5;
              let priorityClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
              let priorityLabel = 'Low Priority';

              if (priority >= 8) {
                priorityClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
                priorityLabel = 'High Priority';
              } else if (priority >= 5) {
                priorityClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                priorityLabel = 'Medium Priority';
              }

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all backdrop-blur-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-800/80">
                          {getRecommendationIcon(rec.type)}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priorityClass}`}>
                          {priorityLabel}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDismissRecommendation(rec.id)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{rec.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => handleActionRecommendation(rec)}
                      className="text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      Start Action <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Growth;
