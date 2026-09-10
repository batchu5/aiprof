import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HelpCircle, CheckCircle2, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

export const QuizView = () => {
  const { id } = useParams();
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const sampleQuestion = {
    question: 'What is the primary function of Vector Embeddings in RAG applications?',
    options: [
      'Compressing PDF files for web transfer',
      'Converting text into mathematical vectors for semantic search',
      'Encrypting user authentication tokens',
      'Formatting JSON responses in FastAPI',
    ],
    correct: 1,
    explanation: 'Vector embeddings map text semantic meanings into multi-dimensional space, enabling high-precision similarity search using pgvector.',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to={`/projects/${id}`} className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Project
      </Link>

      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-cyan-400" />
            AI Mastery Quiz
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generated from Project #{id} materials</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          Question 1 of 5
        </span>
      </div>

      <Card title={sampleQuestion.question} subtitle="Select the best answer below">
        <div className="space-y-3 mt-4">
          {sampleQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === sampleQuestion.correct;

            let btnStyle = 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-600';
            if (submitted) {
              if (isCorrect) {
                btnStyle = 'border-emerald-500/80 bg-emerald-500/10 text-emerald-300';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'border-red-500/80 bg-red-500/10 text-red-300';
              }
            } else if (isSelected) {
              btnStyle = 'border-indigo-500 bg-indigo-600/20 text-indigo-200';
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {submitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-sm">
            <p className="font-semibold text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Explanation:
            </p>
            <p className="text-slate-300 mt-1">{sampleQuestion.explanation}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          {!submitted ? (
            <Button
              variant="primary"
              disabled={selectedOption === null}
              onClick={() => setSubmitted(true)}
            >
              Submit Answer
            </Button>
          ) : (
            <Button variant="outline" onClick={() => { setSubmitted(false); setSelectedOption(null); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Next Question
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuizView;
