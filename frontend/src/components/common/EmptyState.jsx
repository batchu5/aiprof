import React from 'react';
import { FolderOpen, ArrowRight } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No items found',
  description = 'Get started by creating your first resource.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`py-12 px-6 flex flex-col items-center justify-center text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800/80 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-950/20 animate-pulse">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 tracking-tight mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary" className="flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          {actionText}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
