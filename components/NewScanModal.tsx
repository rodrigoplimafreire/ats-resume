import React, { useState, useRef } from 'react';
import type { Language } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface NewScanModalProps {
  onClose: () => void;
  onScan: (jobDescription: string, resumeText: string, language: Language) => void;
  initialError: string | null;
}

const NewScanModal: React.FC<NewScanModalProps> = ({ onClose, onScan, initialError }) => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLanguage, setJobLanguage] = useState<Language>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setIsProcessing(true);
      if (file.type === 'text/plain' || file.type === 'application/pdf') {
        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              let textContent = '';
              if (file.type === 'text/plain') {
                textContent = e.target?.result as string;
              } else {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const text = await page.getTextContent();
                  textContent += text.items.map((item: any) => item.str).join(' ');
                  if (i < pdf.numPages) textContent += '\n\n';
                }
              }
              setResumeText(textContent);
            } catch (err) {
              console.error('Error parsing file:', err);
              setError('Could not read text from file. Please ensure it is text-based or paste the content directly.');
            } finally {
              setIsProcessing(false);
            }
          };
          reader.onerror = () => {
            setError('Failed to read the file.');
            setIsProcessing(false);
          };
          if (file.type === 'text/plain') {
            reader.readAsText(file);
          } else {
            reader.readAsArrayBuffer(file);
          }
        } catch (err) {
            setError('An error occurred while processing the file.');
            setIsProcessing(false);
        }
      } else {
        setError('Unsupported file type. Please upload a .txt or .pdf file.');
        setIsProcessing(false);
      }
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleScanClick = () => {
      if (!resumeText.trim() || !jobDescription.trim()) {
          setError("Please provide both a resume and a job description.");
          return;
      }
      onScan(jobDescription, resumeText, jobLanguage);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">New Scan</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>

        <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* --- Column 1: Resume --- */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Step 1: Upload or paste resume</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt,.pdf" />
                    <button onClick={handleUploadClick} disabled={isProcessing} className="w-full px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                        {isProcessing ? 'Processing...' : 'Drag & Drop or Upload Your Resume'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">.txt or .pdf files supported</p>
                </div>
                <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Or copy and paste resume here."
                    className="w-full h-48 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm resize-y"
                />
                 {resumeText && !isProcessing && (
                    <div className="bg-gray-100 p-2 rounded-lg text-xs text-gray-600 truncate">
                        <strong>Preview:</strong> {resumeText}
                    </div>
                 )}
            </div>

            {/* --- Column 2: Job Description --- */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Step 2: Paste a job description</h3>
                <div>
                  <label htmlFor="job-language" className="block text-sm font-medium text-gray-700 mb-1">
                      Report Language
                  </label>
                  <select
                      id="job-language"
                      value={jobLanguage}
                      onChange={(e) => setJobLanguage(e.target.value as Language)}
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                  >
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                      <option value="es">Español</option>
                  </select>
                   <p className="text-xs text-gray-500 mt-1">The report and optimized resume will be in this language.</p>
                </div>
                <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Copy and paste job description here. Aim to exclude benefits, perks, and legal disclaimers."
                    className="w-full flex-grow p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm resize-y"
                />
            </div>
        </div>
        
        {error && (
            <div className="px-8 pb-4">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        )}

        <div className="flex justify-end items-center p-6 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors mr-4">
            Cancel
          </button>
          <button
            onClick={handleScanClick}
            disabled={!resumeText.trim() || !jobDescription.trim()}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
          >
            Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewScanModal;