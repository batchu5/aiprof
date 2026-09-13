import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Trophy,
  Target,
  Award,
  BookOpen,
  CheckSquare,
  Layers,
  Lightbulb,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { quizApi } from '../../services/api';

// Lightweight visual confetti component for correct answers & completion
const ConfettiEffect = () => {
  const pieces = Array.from({ length: 24 });
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {pieces.map((_, i) => {
        const bg = colors[i % colors.length];
        const left = `${(i * 4.3) % 100}%`;
        const delay = `${(i * 0.08).toFixed(2)}s`;
        const size = `${6 + (i % 6)}px`;
        return (
          <div
            key={i}
            className="absolute rounded-full animate-ping opacity-75"
            style={{
              left,
              top: `${10 + (i * 3) % 80}%`,
              width: size,
              height: size,
              backgroundColor: bg,
              animationDelay: delay,
              animationDuration: '1.2s'
            }}
          />
        );
      })}
    </div>
  );
};

// Animated Score Ring Component
const ScoreRing = ({ score = 0, size = 140, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = 'stroke-emerald-400';
  if (score < 60) strokeColor = 'stroke-rose-500';
  else if (score < 80) strokeColor = 'stroke-amber-400';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${strokeColor} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold text-slate-900">{Math.round(score)}%</span>
        <span className="text-xs font-medium text-slate-500">Score</span>
      </div>
    </div>
  );
};

export const QuizView = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  // App State: 'start' | 'question' | 'complete'
  const [quizState, setQuizState] = useState('start');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  // Start Settings State
  const [numQuestions, setNumQuestions] = useState(5);
  const [includeMCQ, setIncludeMCQ] = useState(true);
  const [includeOpenEnded, setIncludeOpenEnded] = useState(true);
  const [quizHistory, setQuizHistory] = useState([]);

  // Active Quiz State
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);

  // User Interaction State
  const [selectedMcqOption, setSelectedMcqOption] = useState(null);
  const [openEndedText, setOpenEndedText] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Completion State
  const [quizSummary, setQuizSummary] = useState(null);

  // Load history on initial mount
  useEffect(() => {
    if (projectId) {
      loadQuizHistory();
    }
  }, [projectId]);

  const loadQuizHistory = async () => {
    try {
      const history = await quizApi.getHistory(projectId);
      setQuizHistory(history || []);
    } catch (err) {
      console.warn('Failed to load quiz history:', err);
    }
  };

  const handleStartQuiz = async () => {
    if (!includeMCQ && !includeOpenEnded) {
      setError('Please select at least one question type (MCQ or Open-Ended).');
      return;
    }
    setError(null);
    setLoading(true);

    const questionTypes = [];
    if (includeMCQ) questionTypes.push('mcq');
    if (includeOpenEnded) questionTypes.push('open_ended');

    try {
      const data = await quizApi.start(projectId, {
        num_questions: numQuestions,
        question_types: questionTypes,
      });

      const qzId = data?.quiz_id || data?.quiz?.id;
      const firstQ = data?.first_question || data?.question;

      if (!qzId || !firstQ) {
        throw new Error('Failed to initialize quiz session.');
      }

      setActiveQuizId(qzId);
      setCurrentQuestion(firstQ);
      setQuestionIndex(1);
      setTotalQuestions(data?.quiz?.total_questions || numQuestions);
      setSelectedMcqOption(null);
      setOpenEndedText('');
      setSubmitResult(null);
      setQuizState('question');
    } catch (err) {
      setError(err?.message || 'Error starting quiz. Please ensure learning material exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const answerPayload = currentQuestion.question_type === 'mcq'
      ? selectedMcqOption
      : openEndedText.trim();

    if (!answerPayload) {
      setError('Please select or write an answer before submitting.');
      return;
    }

    setError(null);
    setEvaluating(true);

    try {
      const result = await quizApi.submitAnswer(projectId, activeQuizId, currentQuestion.id, answerPayload);
      setSubmitResult(result);

      if (result.is_correct) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
      }
    } catch (err) {
      setError(err?.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!submitResult) return;

    if (!submitResult.has_next || questionIndex >= totalQuestions) {
      // Quiz complete
      handleFinishQuiz();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const questionTypes = [];
      if (includeMCQ) questionTypes.push('mcq');
      if (includeOpenEnded) questionTypes.push('open_ended');

      const nextQ = await quizApi.getNext(projectId, activeQuizId);
      if (!nextQ || !nextQ.id) {
        // Fallback to finish if no next question returned
        handleFinishQuiz();
        return;
      }

      setCurrentQuestion(nextQ);
      setQuestionIndex((prev) => prev + 1);
      setSelectedMcqOption(null);
      setOpenEndedText('');
      setSubmitResult(null);
    } catch (err) {
      setError('Error fetching next question. Finishing quiz...');
      handleFinishQuiz();
    } finally {
      setLoading(false);
    }
  };

  const handleFinishQuiz = async () => {
    setLoading(true);
    try {
      const summary = await quizApi.complete(projectId, activeQuizId);
      setQuizSummary(summary);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      setQuizState('complete');
      loadQuizHistory();
    } catch (err) {
      console.error('Error completing quiz:', err);
      setQuizState('complete');
    } finally {
      setLoading(false);
    }
  };

  const handleResetQuiz = () => {
    setQuizState('start');
    setActiveQuizId(null);
    setCurrentQuestion(null);
    setSelectedMcqOption(null);
    setOpenEndedText('');
    setSubmitResult(null);
    setQuizSummary(null);
    setError(null);
  };

  // Helper styling for difficulty badge
  const renderDifficultyBadge = (difficulty = 'medium') => {
    const diff = difficulty.toLowerCase();
    let badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (diff === 'easy') badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (diff === 'hard') badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

    return (
      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeClass} uppercase tracking-wider`}>
        {diff}
      </span>
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] space-y-6 max-w-4xl mx-auto px-4 py-6">
      {showConfetti && <ConfettiEffect />}

      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Project
        </Link>

        {quizState === 'question' && (
          <button
            onClick={handleResetQuiz}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Exit Quiz
          </button>
        )}
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* STATE 1: QUIZ START SCREEN */}
      {quizState === 'start' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/60 via-slate-900 to-purple-950/40 p-8 border border-blue-500/20 backdrop-blur-md shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Brain className="w-48 h-48 text-indigo-400" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" /> Adaptive AI Engine
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                Test Your Knowledge <span className="text-3xl">🧠</span>
              </h1>
              <p className="text-slate-600 mt-3 text-base leading-relaxed">
                Generates personalized questions tailored to your target concepts, dynamically adjusting difficulty based on your real-time mastery.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card title="Quiz Settings" subtitle="Configure your assessment parameters">
                <div className="space-y-6 mt-4">
                  {/* Number of Questions Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <label className="font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" /> Number of Questions:
                      </label>
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-indigo-300 font-bold rounded-lg text-sm">
                        {numQuestions} Questions
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="10"
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                      className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 px-1">
                      <span>3 (Quick)</span>
                      <span>5 (Standard)</span>
                      <span>10 (Comprehensive)</span>
                    </div>
                  </div>

                  {/* Question Types Checkboxes */}
                  <div className="space-y-3">
                    <label className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-cyan-400" /> Question Formats:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          includeMCQ
                            ? 'border-blue-500 bg-indigo-950/30 text-slate-900'
                            : 'border-slate-200 bg-white/40 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={includeMCQ}
                          onChange={(e) => setIncludeMCQ(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-500 focus:ring-0"
                        />
                        <div>
                          <p className="font-medium text-sm">Multiple Choice (MCQ)</p>
                          <p className="text-xs text-slate-500">4 options, single answer</p>
                        </div>
                      </label>

                      <label
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          includeOpenEnded
                            ? 'border-blue-500 bg-indigo-950/30 text-slate-900'
                            : 'border-slate-200 bg-white/40 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={includeOpenEnded}
                          onChange={(e) => setIncludeOpenEnded(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-500 focus:ring-0"
                        />
                        <div>
                          <p className="font-medium text-sm">Open-Ended</p>
                          <p className="text-xs text-slate-500">Deep AI feedback & rubric scoring</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Start Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleStartQuiz}
                      disabled={loading}
                      className="w-full py-4 px-6 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all transform active:scale-[0.99] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 text-base disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Generating Assessment...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-cyan-200" /> Start Adaptive Quiz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* History Sidebar */}
            <div className="space-y-6">
              <Card title="Past Quizzes" subtitle="Recent performance history">
                <div className="space-y-3 mt-4 max-h-[340px] overflow-y-auto pr-1">
                  {quizHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      <Trophy className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                      No past quizzes taken yet.
                    </div>
                  ) : (
                    quizHistory.map((q) => {
                      const scoreVal = q.score || q.score_percentage || 0;
                      const dateStr = q.created_at ? new Date(q.created_at).toLocaleDateString() : 'Recent';
                      return (
                        <div
                          key={q.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white/50 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{q.title || `Quiz #${q.id.slice(0, 6)}`}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{dateStr} • {q.total_questions || 5} questions</p>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                              scoreVal >= 80
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : scoreVal >= 60
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {Math.round(scoreVal)}%
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: QUESTION SCREEN */}
      {quizState === 'question' && currentQuestion && (
        <div className="space-y-6 animate-fade-in">
          {/* Progress Header */}
          <div className="bg-white/80 border border-slate-200 rounded-2xl p-4 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Target className="w-4 h-4 text-cyan-400" /> Question {questionIndex} of {totalQuestions}
              </span>
              <span>{Math.round((questionIndex / totalQuestions) * 100)}% Completed</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-400 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Question Card */}
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2">
                {renderDifficultyBadge(currentQuestion.difficulty)}
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-blue-600/10 text-purple-300 border-blue-600/30">
                  Concept: {currentQuestion.concept_name || 'General Domain'}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {currentQuestion.question_type === 'mcq' ? 'Multiple Choice' : 'Open-Ended Written'}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question_text}
            </h2>

            {/* FOR MCQ QUESTION */}
            {currentQuestion.question_type === 'mcq' && (
              <div className="space-y-3 pt-2">
                {(currentQuestion.options || []).map((opt) => {
                  const isSelected = selectedMcqOption === opt.label;
                  const isSubmitted = submitResult !== null;
                  const isCorrectOpt = submitResult && submitResult.correct_answer === opt.label;

                  let optClass = 'border-slate-200 bg-white/60 text-slate-700 hover:border-slate-200 hover:bg-white';

                  if (isSubmitted) {
                    if (isCorrectOpt) {
                      optClass = 'border-emerald-500/80 bg-emerald-500/15 text-emerald-200 font-semibold shadow-lg shadow-emerald-500/10';
                    } else if (isSelected && !isCorrectOpt) {
                      optClass = 'border-rose-500/80 bg-rose-500/15 text-rose-200 font-semibold';
                    } else {
                      optClass = 'border-slate-200/50 bg-slate-50/40 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optClass = 'border-blue-500 bg-blue-600/20 text-indigo-200 font-semibold ring-1 ring-blue-500/50';
                  }

                  return (
                    <button
                      key={opt.label}
                      disabled={isSubmitted}
                      onClick={() => setSelectedMcqOption(opt.label)}
                      className={`w-full text-left p-4.5 rounded-xl border text-base transition-all flex items-center justify-between gap-4 ${optClass}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isSelected || (isSubmitted && isCorrectOpt)
                            ? 'bg-blue-500/20 border-indigo-400 text-indigo-300'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}>
                          {opt.label}
                        </span>
                        <span className="text-sm leading-relaxed">{opt.text}</span>
                      </div>

                      {isSubmitted && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {isSubmitted && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* FOR OPEN-ENDED QUESTION */}
            {currentQuestion.question_type === 'open_ended' && (
              <div className="space-y-3 pt-2">
                <textarea
                  disabled={submitResult !== null}
                  rows={5}
                  value={openEndedText}
                  onChange={(e) => setOpenEndedText(e.target.value)}
                  placeholder="Write your explanation in detail..."
                  className="w-full p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-y disabled:opacity-75"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                  <span>Be clear & comprehensive. AI evaluates core concepts.</span>
                  <span>{openEndedText.trim().split(/\s+/).filter(Boolean).length} Words</span>
                </div>
              </div>
            )}

            {/* SUBMITTED FEEDBACK CARD */}
            {submitResult && (
              <div className="mt-6 p-6 rounded-xl bg-slate-50/90 border border-slate-200 space-y-4 animate-fade-in">
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    {submitResult.is_correct ? (
                      <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400">
                        <XCircle className="w-5 h-5" />
                      </span>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {submitResult.is_correct ? 'Great Job! Correct Answer' : 'Needs Review'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {currentQuestion.question_type === 'mcq'
                          ? `Correct Option: ${submitResult.correct_answer}`
                          : `Evaluation Score: ${submitResult.score}%`}
                      </p>
                    </div>
                  </div>

                  {submitResult.mastery_update && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200">
                      <span className="text-slate-500">{submitResult.mastery_update.concept}:</span>
                      <span className="text-slate-600">{submitResult.mastery_update.old}%</span>
                      <span className="text-slate-500">→</span>
                      <span className={submitResult.mastery_update.change >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {submitResult.mastery_update.new}%
                      </span>
                      {submitResult.mastery_update.change >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Explanation / Feedback body */}
                <div className="text-sm text-slate-600 space-y-3">
                  <p className="leading-relaxed">{submitResult.feedback}</p>

                  {/* Open-Ended Detailed Sections */}
                  {currentQuestion.question_type === 'open_ended' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {submitResult.concepts_demonstrated?.length > 0 && (
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                          <p className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> What You Got Right
                          </p>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {submitResult.concepts_demonstrated.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {submitResult.concepts_missing?.length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
                          <p className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-3.5 h-3.5" /> What Was Missing
                          </p>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {submitResult.concepts_missing.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {submitResult.suggestion && (
                    <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>AI Suggestion:</strong> {submitResult.suggestion}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex justify-end pt-4 border-t border-slate-200/80">
              {!submitResult ? (
                <Button
                  variant="primary"
                  disabled={
                    evaluating ||
                    (currentQuestion.question_type === 'mcq' && !selectedMcqOption) ||
                    (currentQuestion.question_type === 'open_ended' && !openEndedText.trim())
                  }
                  onClick={handleSubmitAnswer}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 font-bold rounded-xl"
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating Answer...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={loading}
                  onClick={handleNextQuestion}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-900 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : questionIndex >= totalQuestions ? (
                    <>
                      Finish Quiz <Trophy className="w-4 h-4 text-amber-300" />
                    </>
                  ) : (
                    <>
                      Next Question <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: QUIZ COMPLETE SCREEN */}
      {quizState === 'complete' && (
        <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 backdrop-blur-md text-center space-y-6 shadow-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-2xl mx-auto">
              🎉
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Quiz Complete!
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                Great job completing your adaptive assessment session. Here is your performance overview:
              </p>
            </div>

            {/* Ring & Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4 border-y border-slate-200">
              <ScoreRing score={quizSummary?.score || 0} size={150} strokeWidth={12} />

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200">
                  <p className="text-xs text-slate-500">Total Questions</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{quizSummary?.total_questions || totalQuestions}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200">
                  <p className="text-xs text-slate-500">Correct Answers</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{quizSummary?.correct_answers || 0}</p>
                </div>
              </div>
            </div>

            {/* Concept Mastery Changes */}
            {quizSummary?.mastery_changes?.length > 0 && (
              <div className="space-y-3 text-left">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> Concept Mastery Updates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {quizSummary.mastery_changes.map((item, idx) => {
                    let trendIcon = <Minus className="w-4 h-4 text-slate-500" />;
                    let trendClass = 'text-slate-500 border-slate-200 bg-slate-50/40';

                    if (item.trend === 'improving') {
                      trendIcon = <TrendingUp className="w-4 h-4 text-emerald-400" />;
                      trendClass = 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5';
                    } else if (item.trend === 'declining' || item.trend === 'needs_attention') {
                      trendIcon = <TrendingDown className="w-4 h-4 text-rose-400" />;
                      trendClass = 'text-rose-300 border-rose-500/20 bg-rose-500/5';
                    }

                    return (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${trendClass}`}>
                        <span className="font-semibold">{item.concept}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{item.mastery_level}%</span>
                          {trendIcon}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Summary Card */}
            {quizSummary?.summary && (
              <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 text-left space-y-2">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Performance Summary
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{quizSummary.summary}</p>
              </div>
            )}

            {/* Recommendation Card */}
            {quizSummary?.recommendation && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/20 text-left space-y-2">
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" /> Recommended Next Steps
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{quizSummary.recommendation}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                onClick={handleResetQuiz}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Take Another Quiz
              </Button>

              <Link
                to={`/projects/${projectId}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-all text-center"
              >
                Back to Project Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
