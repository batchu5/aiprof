import React from 'react';

export const Card = ({ children, className = '', title, subtitle, footer, ...props }) => {
  return (
    <div
      className={`bg-white/90 border border-slate-200/60 rounded-xl shadow-md backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-slate-300 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-200/60 bg-white">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-slate-200/60 bg-white/40 text-sm text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
