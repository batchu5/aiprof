import React from 'react';

export const Card = ({ children, className = '', title, subtitle, footer, ...props }) => {
  return (
    <div
      className={`bg-slate-800/90 border border-slate-700/60 rounded-xl shadow-xl backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-slate-600 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-700/60 bg-slate-800/50">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-slate-700/60 bg-slate-900/40 text-sm text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
