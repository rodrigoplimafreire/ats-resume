import React from 'react';

interface LoadingSpinnerProps {
  text: string;
  progress: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text, progress }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
      <div className="text-center w-full max-w-md p-8 bg-white rounded-xl shadow-2xl border">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Scanning your resume...</h2>
        <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-linear" 
              style={{ width: `${progress}%` }}>
            </div>
        </div>
        <p className="mt-4 text-gray-700 font-medium tracking-wide h-6">{text}</p>
        <p className="mt-8 text-sm text-gray-500 animate-pulse">
            This can take up to 30 seconds. Please wait while we work our magic...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;