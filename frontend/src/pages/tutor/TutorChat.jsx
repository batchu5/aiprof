import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  ArrowLeft,
  Bot,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  RotateCcw,
  Clock,
  Layers
} from 'lucide-react';
import { tutorApi, projectsApi } from '../../services/api';
import toast from 'react-hot-toast';

export const TutorChat = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convsLoading, setConvsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load project details & conversations list
  useEffect(() => {
    const fetchProjectAndConvs = async () => {
      try {
        setConvsLoading(true);
        const projData = await projectsApi.get(projectId);
        setProject(projData);

        const convList = await tutorApi.listConversations(projectId);
        setConversations(convList);

        if (convList && convList.length > 0) {
          setActiveConvId(convList[0].id);
        } else {
          // Create initial default conversation
          handleCreateNewConversation();
        }
      } catch (err) {
        console.error('Error initializing Tutor Chat:', err);
        toast.error('Failed to load tutoring session');
      } finally {
        setConvsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectAndConvs();
    }
  }, [projectId]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConvId || !projectId) return;
      try {
        setMessagesLoading(true);
        const data = await tutorApi.getConversation(projectId, activeConvId);
        setMessages(data?.messages || []);
      } catch (err) {
        console.error('Error fetching conversation messages:', err);
        toast.error('Failed to load chat history');
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [activeConvId, projectId]);

  // Handle textarea auto-expand
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Create new conversation
  const handleCreateNewConversation = async () => {
    try {
      const newConv = await tutorApi.createConversation(projectId, 'New Tutoring Session');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setMobileDrawerOpen(false);
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast.error('Could not start new conversation');
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await tutorApi.deleteConversation(projectId, convId);
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);

      if (activeConvId === convId) {
        if (updated.length > 0) {
          setActiveConvId(updated[0].id);
        } else {
          handleCreateNewConversation();
        }
      }
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || input;
    if (!text.trim() || loading || !activeConvId) return;

    const userMsgId = `temp_${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const aiResponse = await tutorApi.sendMessage(projectId, activeConvId, text.trim());
      setMessages((prev) => [...prev, aiResponse]);

      // Update local conversation list title/message_count if auto-titled
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                title: c.title === 'New Tutoring Session' ? text.slice(0, 30) + '...' : c.title,
                message_count: (c.message_count || 0) + 2,
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Error sending tutor message:', err);
      toast.error('Failed to get response from AI Tutor');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId ? { ...m, error: true } : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const starterQuestions = [
    'Summarize the key concepts from my study materials',
    'Explain the core mechanism in simple step-by-step terms',
    'What are the main takeaways and formulas I need to remember?',
  ];

  return (
    <div className="flex h-[calc(100vh-5.5rem)] overflow-hidden bg-slate-50 text-slate-900 rounded-2xl border border-slate-200 shadow-2xl relative">
      {/* LEFT SIDEBAR - Desktop */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0 hidden md:flex md:w-0'
        } transition-all duration-300 ease-in-out bg-white/90 border-r border-slate-200 flex-col shrink-0 relative overflow-hidden`}
      >
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <button
            onClick={handleCreateNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-blue-600 text-slate-900 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Past Conversations
          </p>

          {convsLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-10 bg-white/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-500">
              No previous conversations found.
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-indigo-200 border border-blue-500/30'
                      : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold">{conv.title || 'Untitled Session'}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm md:hidden flex">
          <div className="w-72 bg-white h-full border-r border-slate-200 flex flex-col p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-700">Conversations</span>
              <button onClick={() => setMobileDrawerOpen(false)} className="text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleCreateNewConversation}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-slate-900 rounded-xl text-sm font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" /> New Conversation
            </button>
            <div className="flex-1 overflow-y-auto mt-4 space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileDrawerOpen(false);
                  }}
                  className={`p-3 rounded-xl text-xs font-medium cursor-pointer ${
                    conv.id === activeConvId ? 'bg-blue-600/30 text-indigo-300' : 'bg-white text-slate-600'
                  }`}
                >
                  <p className="font-semibold truncate">{conv.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40 relative">
        {/* CHAT HEADER */}
        <div className="px-4 py-3.5 border-b border-slate-200/80 bg-white/60 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/70 transition-colors"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={`/projects/${projectId}`}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
              title="Back to Project"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="p-2 rounded-xl bg-blue-500/10 text-indigo-400 border border-blue-500/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2 truncate">
                {project?.name || `Project #${projectId}`}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shrink-0">
                  RAG Tutor
                </span>
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {conversations.find((c) => c.id === activeConvId)?.title || 'Tutoring Session'}
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGES FEED */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {messagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-500">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm">Loading tutoring conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            /* EMPTY CONVERSATION STATE */
            <div className="flex flex-col items-center justify-center min-h-[70%] text-center p-6 space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-blue-500/10">
                <BookOpen className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Ask me anything about your learning materials! 🎓</h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  I search across your uploaded PDF materials in real-time, explain complex topics step-by-step, and provide exact page-level source citations.
                </p>
              </div>

              {/* STARTER QUESTION CHIPS */}
              <div className="w-full space-y-2 pt-2">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left">
                  Suggested Questions:
                </p>
                {starterQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="w-full text-left p-3 rounded-xl bg-white/80 hover:bg-blue-600/10 border border-slate-200 hover:border-blue-500/40 text-slate-600 hover:text-indigo-200 text-xs transition-all flex items-center justify-between group"
                  >
                    <span>{q}</span>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user' || msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-tr from-blue-500 to-blue-700 text-slate-900'
                        : 'bg-white text-indigo-400 border border-slate-200'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-2xl flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-5 py-4 text-sm shadow-lg leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-slate-900 rounded-tr-none'
                          : 'bg-white/90 text-slate-700 border border-slate-200 rounded-tl-none backdrop-blur-sm'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert max-w-none text-xs sm:text-sm prose-p:leading-relaxed prose-headings:text-slate-900 prose-strong:text-indigo-300 prose-code:text-purple-300">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* SOURCE CITATIONS / WARNING BADGES FOR ASSISTANT MESSAGES */}
                    {!isUser && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {msg.sources && msg.sources.length > 0 ? (
                          msg.sources.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedSource(src)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/40 text-[11px] font-semibold transition-all hover:scale-[1.02] shadow-sm"
                            >
                              <FileText className="w-3 h-3 text-cyan-400" />
                              <span>
                                {src.material_name} — Page {src.page_number}
                              </span>
                            </button>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-400 border border-amber-800/40 text-[11px] font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            General Knowledge Response
                          </span>
                        )}
                      </div>
                    )}

                    {/* ERROR RETRY OPTION */}
                    {msg.error && (
                      <button
                        onClick={() => handleSendMessage(msg.content)}
                        className="mt-2 text-xs text-rose-400 flex items-center gap-1 hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry message
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* TYPING INDICATOR (3 BOUNCING DOTS) */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-indigo-400 border border-slate-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>

              <div className="bg-white/90 text-slate-600 rounded-2xl px-5 py-4 border border-slate-200 flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">AI Tutor is searching materials</span>
                <div className="flex items-center gap-1 ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM AT BOTTOM */}
        <div className="p-4 border-t border-slate-200/80 bg-white/80 backdrop-blur-md shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex flex-col gap-2"
          >
            <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 focus-within:border-blue-500 rounded-2xl p-2 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your study materials..."
                rows={1}
                disabled={loading}
                className="w-full bg-transparent text-slate-900 placeholder-slate-500 text-xs sm:text-sm px-3 py-2 focus:outline-none resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-2 text-[10px] text-slate-500 font-medium">
              <span>Shift + Enter for new line • Enter to send</span>
              <span>{input.length} chars</span>
            </div>
          </form>
        </div>
      </div>

      {/* SOURCE CHUNK PREVIEW MODAL */}
      {selectedSource && (
        <div className="fixed inset-0 z-50 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-cyan-800/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedSource.material_name} — Page {selectedSource.page_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-slate-500 hover:text-slate-900 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
              <p className="font-semibold text-cyan-400 mb-1">Source Passage Snippet:</p>
              <p className="italic">{selectedSource.content_preview || 'Passage content retrieved from PDF page.'}</p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Relevance Score: {(selectedSource.relevance * 100).toFixed(1)}%</span>
              <button
                onClick={() => setSelectedSource(null)}
                className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorChat;
