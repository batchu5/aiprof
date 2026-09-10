import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, MessageSquare, HelpCircle, FileText, Upload, Sparkles, ArrowRight } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const ProjectDashboard = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Project #{id} Dashboard</h1>
              <p className="text-sm text-slate-400 mt-0.5">Manage study materials, AI sessions, and quizzes</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/projects/${id}/tutor`}>
            <Button variant="primary" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> AI Tutor Chat
            </Button>
          </Link>
          <Link to={`/projects/${id}/quiz`}>
            <Button variant="accent" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Take Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to={`/projects/${id}/tutor`}>
          <Card className="hover:border-indigo-500/60 cursor-pointer group transition-all">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <MessageSquare className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-4">AI Study Tutor</h3>
            <p className="text-sm text-slate-400 mt-1">Chat interactively with Gemini trained on your study material.</p>
          </Card>
        </Link>

        <Link to={`/projects/${id}/quiz`}>
          <Card className="hover:border-cyan-500/60 cursor-pointer group transition-all">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                <HelpCircle className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-4">Generate & Attempt Quiz</h3>
            <p className="text-sm text-slate-400 mt-1">Test your mastery with AI-generated multiple choice questions.</p>
          </Card>
        </Link>
      </div>

      {/* Uploaded Materials */}
      <Card title="Study Materials" subtitle="PDFs and notes attached to this project">
        <div className="border-2 border-dashed border-slate-700/80 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer mb-6">
          <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">Upload PDF or Text document</p>
          <p className="text-xs text-slate-500 mt-1">Gemini will automatically extract & vectorize contents for RAG</p>
        </div>

        <div className="space-y-3">
          {['Lecture_Notes_Week_1.pdf', 'Syllabus_and_Core_Concepts.pdf'].map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium text-slate-200">{doc}</span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Vectorized
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ProjectDashboard;
