import React, { useState, useCallback, useRef } from 'react';
import type { Language, AnalysisResult } from './types';
import { optimizeResume } from './services/geminiService';
import ResultsStep from './components/ResultsStep';
import LoadingSpinner from './components/LoadingSpinner';
import NewScanModal from './components/NewScanModal';
import SparklesIcon from './components/icons/SparklesIcon';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [originalResume, setOriginalResume] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleScan = useCallback(async (jobDescription: string, resumeText: string, jobLanguage: Language) => {
    if (!jobDescription || !resumeText) return;

    setIsModalOpen(false);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setProgress(0);
    setOriginalResume(resumeText);

    const loadingMessages = [
      'Parsing resume text...',
      'Analyzing job description...',
      'Identifying key skills...',
      'Checking for ATS compatibility...',
      'Generating optimizations...',
      'Rewriting resume sections...',
      'Finalizing your report...',
    ];
    let messageIndex = 0;
    setLoadingText(loadingMessages[messageIndex]);

    const simulationDuration = 6000;
    const updateInterval = 50; 
    const steps = simulationDuration / updateInterval;
    const progressIncrement = 90 / steps;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setProgress(oldProgress => {
        const newProgress = oldProgress + progressIncrement;
        if (newProgress >= 90) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 90;
        }
        return newProgress;
      });
    }, updateInterval);

    if (textIntervalRef.current) clearInterval(textIntervalRef.current);
    textIntervalRef.current = setInterval(() => {
      messageIndex++;
      if(messageIndex < loadingMessages.length) {
        setLoadingText(loadingMessages[messageIndex]);
      } else {
        if (textIntervalRef.current) clearInterval(textIntervalRef.current);
      }
    }, 1000);

    try {
      const result = await optimizeResume(jobDescription, resumeText, jobLanguage);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (textIntervalRef.current) clearInterval(textIntervalRef.current);

      setProgress(100);
      setLoadingText('Complete!');
      
      setTimeout(() => {
        setAnalysisResult(result);
        setIsLoading(false);
      }, 500);

    } catch (e) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (textIntervalRef.current) clearInterval(textIntervalRef.current);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Analysis failed. ${errorMessage.replace('Error: ','')}`);
      setIsLoading(false);
      setIsModalOpen(true); // Re-open modal to show error
    }
  }, []);
  
  const handleNewScan = useCallback(() => {
    setAnalysisResult(null);
    setOriginalResume('');
    setError(null);
    setIsModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {isLoading && <LoadingSpinner text={loadingText} progress={progress} />}
      {isModalOpen && (
        <NewScanModal
          onClose={() => setIsModalOpen(false)}
          onScan={handleScan}
          initialError={error}
        />
      )}
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex-grow">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ATS Resume Scanner</h1>
          </div>
          {analysisResult && (
            <button 
              onClick={handleNewScan}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
            >
              + New Scan
            </button>
          )}
        </header>

        <main>
          {analysisResult ? (
            <ResultsStep 
              analysisResult={analysisResult} 
              originalResume={originalResume}
            />
          ) : (
            <div className="text-center bg-white p-12 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center">
              <SparklesIcon className="w-16 h-16 text-blue-500 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900">Optimize your resume in seconds</h2>
              <p className="text-gray-600 mt-2 max-w-xl">
                Get past the bots. Compare your resume to a job description and get an instant analysis of what you need to improve.
              </p>
              <button 
                onClick={handleNewScan}
                className="mt-8 px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Start a New Scan
              </button>
            </div>
          )}
        </main>
      </div>
       <footer className="w-full text-center p-4">
        <p className="text-gray-500 text-sm">
          Powered by Google Gemini
        </p>
      </footer>
    </div>
  );
}

export default App;