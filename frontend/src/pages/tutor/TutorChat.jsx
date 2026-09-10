import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageSquare, Send, Sparkles, User, ArrowLeft, Bot } from 'lucide-react';
import Button from '../../components/common/Button';

export const TutorChat = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your AI Study Tutor powered by Gemini. Ask me anything about your project materials!',
      timestamp: '10:00 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `That's a great question regarding Project #${id}. Based on your uploaded materials, key concepts involve structured step-by-step reasoning and core principles.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${id}`} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Gemini AI Tutor <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">Online</span>
            </h1>
            <p className="text-xs text-slate-400">Contextual RAG Tutor for Project #{id}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4 backdrop-blur-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
                  : 'bg-slate-800 text-indigo-400 border border-slate-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-lg rounded-2xl px-4 py-3 text-sm shadow-md ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-none'
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <span className={`block text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800 text-slate-400 rounded-2xl px-4 py-3 text-xs border border-slate-700">
              Gemini is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI tutor a question..."
          className="flex-1 px-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <Button type="submit" variant="primary" disabled={!input.trim() || loading} className="py-3.5 px-5">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default TutorChat;
