import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/common/Button';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return false;
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await register(email, password, fullName);
      if (data?.session) {
        navigate('/');
      } else {
        // Registration succeeded but no session = email confirmation required
        setError('Account created! Please check your email to verify your account before logging in.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* LEFT SIDE: Premium Animated Gradient Hero Branding */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 overflow-hidden border-b lg:border-b-0 lg:border-r border-indigo-500/30">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        
        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-white text-blue-600 shadow-xl shadow-indigo-900/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">
              🎓 AI Study Companion
            </span>
          </div>
          <h2 className="text-sm font-semibold tracking-widest text-indigo-200 uppercase">
            Your Personal AI Learning Partner
          </h2>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 my-12 space-y-6 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Master Any Course Material with Gemini Flash RAG & Adaptive Quizzes
          </h1>
          <p className="text-indigo-100 text-base leading-relaxed">
            Upload your PDFs, generate interactive study spaces, and practice with automated mastery analytics tailored to your goals.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Instant access to AI Tutor session history',
              'Unlimited document vector indexing via pgvector',
              'Personalized review recommendations',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-indigo-100 text-sm font-medium">
                <CheckCircle className="w-5 h-5 text-indigo-300 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-indigo-200/80">
          © {new Date().getFullYear()} AI Study Companion • Built with React 18, FastAPI & Supabase
        </div>
      </div>

      {/* RIGHT SIDE: Dark Card Form Container */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-slate-500 text-sm mt-2">Get started with your free AI Study Companion account.</p>
          </div>

          <div className="bg-white/60 border border-slate-200 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full py-3.5 mt-2 font-semibold text-sm flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20"
              >
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 pt-6 border-t border-slate-200/60">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
