import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
  
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white focus:ring-indigo-500 border border-indigo-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500',
    accent: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold focus:ring-cyan-400',
    outline: 'border border-slate-700 hover:bg-slate-800 text-slate-300 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white focus:ring-slate-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
