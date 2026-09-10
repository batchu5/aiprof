import React from 'react';

export const Loading = ({ fullScreen = false, message = 'Loading...' }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="py-12 flex justify-center items-center">{spinner}</div>;
};

export default Loading;
