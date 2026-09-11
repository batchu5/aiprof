import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { materialsApi } from '../../services/api';

export const Materials = ({ projectIdOverride }) => {
  const { id: routeProjectId } = useParams();
  const projectId = projectIdOverride || routeProjectId;

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag & Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState({});

  const fileInputRef = useRef(null);

  const fetchMaterials = async () => {
    try {
      const list = await materialsApi.list(projectId);
      setMaterials(list || []);
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [projectId]);

  // Polling for processing status every 3 seconds while any material is non-terminal ('ready'/'failed')
  useEffect(() => {
    const hasProcessing = materials.some(
      (m) => m.processing_status && !['ready', 'failed'].includes(m.processing_status)
    );

    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      let updated = false;
      const newMaterials = await Promise.all(
        materials.map(async (mat) => {
          if (!['ready', 'failed'].includes(mat.processing_status)) {
            try {
              const statusData = await materialsApi.getStatus(projectId, mat.id);
              if (statusData?.processing_status !== mat.processing_status) {
                updated = true;
                return {
                  ...mat,
                  processing_status: statusData.processing_status,
                  processing_error: statusData.processing_error,
                  page_count: statusData.page_count || mat.page_count,
                  chunk_count: statusData.chunk_count || mat.chunk_count,
                  summary: statusData.summary || mat.summary,
                };
              }
            } catch (err) {
              console.warn(`Polling status failed for ${mat.id}:`, err);
            }
          }
          return mat;
        })
      );

      if (updated) {
        setMaterials(newMaterials);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [materials, projectId]);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF (.pdf) files are supported.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds 20MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e?.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      await materialsApi.upload(projectId, selectedFile);
      toast.success(`"${selectedFile.name}" uploaded successfully! Document processing queued.`);
      setSelectedFile(null);
      fetchMaterials();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await materialsApi.delete(projectId, materialId);
      toast.success('Material deleted successfully.');
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete material.');
    }
  };

  const toggleSummary = (materialId) => {
    setExpandedSummary((prev) => ({ ...prev, [materialId]: !prev[materialId] }));
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderStatusBadge = (mat) => {
    const status = mat.processing_status || 'ready';

    switch (status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            ⏳ Queued
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            🔄 Processing...
          </span>
        );
      case 'reading':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BookOpen className="w-3.5 h-3.5 animate-pulse" />
            📖 Reading OCR...
          </span>
        );
      case 'extracting':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            🧠 Extracting Knowledge...
          </span>
        );
      case 'embedding':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-3.5 h-3.5 animate-spin" />
            🔍 Creating Vector Index...
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ✅ Ready
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            ❌ Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc' } }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-6 h-6" />
            </span>
            Learning Materials
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upload PDFs for Gemini 1.5 Flash parsing, OCR, and pgvector RAG indexing.
          </p>
        </div>
      </div>

      {/* Upload Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 backdrop-blur-md ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-600/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-800/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          accept="application/pdf"
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {selectedFile ? selectedFile.name : 'Drop PDF here or click to upload'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">Max file size 20MB • PDF documents only</p>

        {selectedFile && (
          <div className="max-w-xs mx-auto space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-semibold text-indigo-300 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-800/40 flex items-center justify-between">
              <span className="truncate">{selectedFile.name}</span>
              <span className="shrink-0">{formatBytes(selectedFile.size)}</span>
            </div>
            <Button variant="primary" onClick={handleUpload} isLoading={uploading} className="w-full py-2.5 text-sm font-semibold">
              Start Upload & Processing
            </Button>
          </div>
        )}
      </div>

      {/* Materials List */}
      {loading ? (
        <Loading message="Loading study materials..." />
      ) : materials.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">No learning materials uploaded yet</h4>
          <p className="text-xs text-slate-400">Upload your course PDFs above to enable RAG tutor search and automatic quiz generation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Uploaded Materials ({materials.length})
          </h3>

          <div className="space-y-4">
            {materials.map((mat) => {
              const isReady = mat.processing_status === 'ready';
              const isFailed = mat.processing_status === 'failed';
              const isExpanded = expandedSummary[mat.id];

              return (
                <div
                  key={mat.id}
                  className="bg-slate-800/50 backdrop-blur-md border border-slate-700/60 rounded-2xl p-5 shadow-xl space-y-4 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white line-clamp-1">{mat.file_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{formatBytes(mat.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(mat.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {renderStatusBadge(mat)}

                      <button
                        onClick={() => handleDelete(mat.id, mat.file_name)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Ready Stats & Summary */}
                  {isReady && (
                    <div className="pt-3 border-t border-slate-700/50 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-300">
                        <div className="flex items-center gap-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700">
                            📄 {mat.page_count || 1} Pages
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700">
                            🔍 {mat.chunk_count || 0} Chunks Indexed
                          </span>
                        </div>

                        {mat.summary && (
                          <button
                            onClick={() => toggleSummary(mat.id)}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            <span>{isExpanded ? 'Hide Summary' : 'View AI Summary'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {isExpanded && mat.summary && (
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-slate-300 space-y-1 animate-fade-in">
                          <p className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5" /> AI Summary Takeaways:
                          </p>
                          <p className="leading-relaxed whitespace-pre-line">{mat.summary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Retry Message */}
                  {isFailed && mat.processing_error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center justify-between">
                      <span>Error: {mat.processing_error}</span>
                      <Button size="sm" variant="outline" onClick={fetchMaterials}>
                        Retry Polling
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
