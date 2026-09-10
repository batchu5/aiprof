import React from 'react';
import { BarChart3, TrendingUp, Award, Clock, Sparkles } from 'lucide-react';
import Card from '../../components/common/Card';

export const Analytics = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Learning Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">Track your study progress and mastery velocity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-purple-500/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Weekly Growth</p>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">+14.2%</h3>
            </div>
          </div>
        </Card>

        <Card className="hover:border-indigo-500/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Study Time</p>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">28.5 Hours</h3>
            </div>
          </div>
        </Card>

        <Card className="hover:border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Quizzes Mastered</p>
              <h3 className="text-xl font-bold text-slate-100 mt-0.5">18 Quizzes</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Advanced Analytics Dashboard - Coming Soon</h2>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Deep learning metrics, retention curves, and topic gap visualizer powered by Gemini AI will be rendered here.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
