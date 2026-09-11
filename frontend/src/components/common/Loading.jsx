import React from 'react';

export const Loading = ({ fullScreen = false, skeleton = false, message = 'Loading your learning journey...' }) => {
  if (skeleton) {
    return (
      <div className="space-y-4 w-full animate-pulse">
        <div className="h-8 bg-slate-800/60 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
          <div className="h-28 bg-slate-800/60 rounded-xl"></div>
        </div>
        <div className="h-48 bg-slate-800/60 rounded-xl w-full"></div>
      </div>
    );
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-14 h-14">
        {/* outer glowing gradient ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 blur-sm opacity-60 animate-pulse"></div>
        {/* background ring */}
        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
        {/* animated spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-400 border-r-purple-400 animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-slate-300 tracking-wide">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="py-16 flex justify-center items-center">{spinner}</div>;
};

export default Loading;
