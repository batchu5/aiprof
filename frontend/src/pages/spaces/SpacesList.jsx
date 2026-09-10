import React from 'react';
import { BookOpen, Plus, Sparkles, Folder, ArrowRight } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const SpacesList = () => {
  const spaces = [
    { id: '1', title: 'Computer Science', description: 'Algorithms, Data Structures & Operating Systems', projectsCount: 4 },
    { id: '2', title: 'Mathematics & Statistics', description: 'Calculus, Linear Algebra & Probability', projectsCount: 3 },
    { id: '3', title: 'Artificial Intelligence', description: 'Machine Learning, Deep Learning & LLMs', projectsCount: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            Study Spaces
          </h1>
          <p className="text-sm text-slate-400 mt-1">Organize your courses, subjects, and study domains</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Space
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <Card key={space.id} className="hover:border-indigo-500/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Folder className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                  {space.projectsCount} Projects
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{space.title}</h3>
              <p className="text-sm text-slate-400 mt-2 line-clamp-2">{space.description}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Knowledge Vectorized
              </span>
              <Button size="sm" variant="ghost" className="flex items-center gap-1">
                View <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SpacesList;
