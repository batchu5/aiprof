import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Folder, Clock, Plus, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const SpaceDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link to="/spaces" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Spaces
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Space Details #{id}</h1>
              <p className="text-sm text-slate-400 mt-0.5">Space Overview & Projects</p>
            </div>
          </div>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Space #{id} Dashboard - Coming Soon</h2>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Interactive space details, project categorization, and aggregated knowledge statistics are currently under active synthesis.
        </p>
      </div>
    </div>
  );
};

export default SpaceDetail;
