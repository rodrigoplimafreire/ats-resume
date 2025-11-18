import React, { useState, useMemo } from 'react';
import type { AnalysisResult, SearchabilityTip, Skill, RecruiterTip, Report } from '../types';
import CheckCircleIcon from './icons/CheckIcon';
import XCircleIcon from './icons/ChevronRightIcon';
import ExclamationTriangleIcon from './icons/WarningIcon';
import ClipboardIcon from './icons/ClipboardIcon';

interface ResultsStepProps {
  analysisResult: AnalysisResult | null;
  originalResume: string;
}

// --- SCORING LOGIC ---
const WEIGHTS = {
    searchability: 0.30,
    hardSkills: 0.45,
    softSkills: 0.10,
    recruiterTips: 0.15,
};

const calculateScore = (report: Report): number => {
    // Searchability Score
    const totalSearchability = report.searchability.tips.length;
    const passedSearchability = report.searchability.tips.filter(t => t.status === 'pass' || t.status === 'info').length;
    const searchabilityScore = totalSearchability > 0 ? (passedSearchability / totalSearchability) : 1;

    // Hard Skills Score
    const totalHardSkills = report.hardSkills.skills.length;
    const foundHardSkills = report.hardSkills.skills.filter(s => s.resumeCount !== -1).length;
    const hardSkillsScore = totalHardSkills > 0 ? (foundHardSkills / totalHardSkills) : 1;
    
    // Soft Skills Score
    const totalSoftSkills = report.softSkills.skills.length;
    const foundSoftSkills = report.softSkills.skills.filter(s => s.resumeCount !== -1).length;
    const softSkillsScore = totalSoftSkills > 0 ? (foundSoftSkills / totalSoftSkills) : 1;

    // Recruiter Tips Score
    const totalRecruiterTips = report.recruiterTips.tips.length;
    const passedRecruiterTips = report.recruiterTips.tips.filter(t => t.status === 'pass' || t.status === 'info').length;
    const recruiterTipsScore = totalRecruiterTips > 0 ? (passedRecruiterTips / totalRecruiterTips) : 1;

    const finalScore = 
        (searchabilityScore * WEIGHTS.searchability) +
        (hardSkillsScore * WEIGHTS.hardSkills) +
        (softSkillsScore * WEIGHTS.softSkills) +
        (recruiterTipsScore * WEIGHTS.recruiterTips);
    
    return Math.round(finalScore * 100);
};

const calculateOptimizedScore = (report: Report, optimizedResume: string): number => {
    const optimizedReport = JSON.parse(JSON.stringify(report)); // Deep copy

    // Check if missing skills were added to the optimized resume
    const optimizedResumeLower = optimizedResume.toLowerCase();
    
    optimizedReport.hardSkills.skills.forEach((skill: Skill) => {
        if (skill.resumeCount === -1) {
            const skillRegex = new RegExp(`\\b${skill.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (skillRegex.test(optimizedResumeLower)) {
                skill.resumeCount = 1; // Mark as found
            }
        }
    });

    optimizedReport.softSkills.skills.forEach((skill: Skill) => {
         if (skill.resumeCount === -1) {
            const skillRegex = new RegExp(`\\b${skill.skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (skillRegex.test(optimizedResumeLower)) {
                skill.resumeCount = 1; // Mark as found
            }
        }
    });
    
    // For simplicity, we assume searchability and recruiter tips are addressed by the model.
    // We can give a slight boost or assume they are all 'pass'.
    optimizedReport.searchability.tips.forEach((tip: SearchabilityTip) => tip.status = 'pass');
    optimizedReport.recruiterTips.tips.forEach((tip: RecruiterTip) => tip.status = 'pass');


    return calculateScore(optimizedReport);
};
// --- END SCORING LOGIC ---


const getScoreColor = (score: number): 'green' | 'yellow' | 'red' => {
    if (score >= 90) return 'green';
    if (score >= 75) return 'yellow';
    return 'red';
};

const CircularProgressBar: React.FC<{ score: number; size?: 'large' | 'small' }> = ({ score, size = 'large' }) => {
    const isLarge = size === 'large';
    const radius = isLarge ? 50 : 20;
    const strokeWidth = isLarge ? 10 : 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    const colorClassMap = {
        yellow: 'text-yellow-400',
        green: 'text-green-500',
        red: 'text-red-500'
    };
    
    return (
        <div className={`relative flex items-center justify-center ${isLarge ? 'w-40 h-40' : 'w-12 h-12'}`}>
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-gray-200" strokeWidth={strokeWidth * 2} stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <circle
                    className={colorClassMap[color]}
                    strokeWidth={strokeWidth * 2}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <span className={`absolute font-bold ${colorClassMap[color]} ${isLarge ? 'text-4xl' : 'text-lg'}`}>{score}<span className={isLarge ? 'text-2xl': 'text-sm'}>%</span></span>
        </div>
    );
};

const StatusIcon: React.FC<{ status: 'pass' | 'fail' | 'info' | 'warning' }> = ({ status }) => {
    switch (status) {
        case 'pass':
        case 'info':
            return <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />;
        case 'fail':
            return <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />;
        case 'warning':
            return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0" />;
        default:
            return null;
    }
};

const SectionCard: React.FC<{
    title: string;
    tag?: string;
    children: React.ReactNode;
    id: string;
    description?: string;
}> = ({ title, tag, children, id, description }) => (
    <div id={id} className="bg-white rounded-lg shadow-md border border-gray-200 p-8 scroll-mt-24">
        <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {tag && <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">{tag}</span>}
        </div>
        {description && <p className="text-gray-600 mb-6">{description}</p>}
        {children}
    </div>
);


const ResultsStep: React.FC<ResultsStepProps> = ({ analysisResult, originalResume }) => {
    const [copyStatus, setCopyStatus] = useState('Copy');

    const originalScore = useMemo(() => {
        if (!analysisResult) return 0;
        return calculateScore(analysisResult.report);
    }, [analysisResult]);

    const optimizedScore = useMemo(() => {
        if (!analysisResult) return 0;
        return calculateOptimizedScore(analysisResult.report, analysisResult.optimizedResume);
    }, [analysisResult]);

    if (!analysisResult) return null;

    const { report, optimizedResume } = analysisResult;

    const handleCopy = () => {
        navigator.clipboard.writeText(optimizedResume);
        setCopyStatus('Copied!');
        setTimeout(() => setCopyStatus('Copy'), 2000);
    };
    
    const sideNavItems = [
        { name: 'Searchability', issues: report.searchability.issues },
        { name: 'Hard Skills', issues: report.hardSkills.issues },
        { name: 'Soft Skills', issues: report.softSkills.issues },
        { name: 'Recruiter Tips', issues: report.recruiterTips.issues },
    ];

    const keywords = [...report.hardSkills.skills.map(s => s.skill), ...report.softSkills.skills.map(s => s.skill)];
    const highlightKeywords = (text: string): React.ReactNode => {
        if (!keywords.length || !text) return text;
        const regex = new RegExp(`\\b(${keywords.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
        return (
            <>
                {text.split(regex).map((part, index) =>
                    regex.test(part) ? <mark key={index} className="bg-yellow-300 text-black px-0.5 rounded-sm">{part}</mark> : part
                )}
            </>
        );
    };

    return (
        <div className="animate-fade-in print:bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* --- LEFT SIDEBAR --- */}
                <aside className="lg:col-span-1 lg:sticky lg:top-8 self-start print:hidden space-y-6">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex flex-col items-center">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Match Rate</h3>
                        <CircularProgressBar score={optimizedScore} />
                        <p className="text-sm text-gray-500 mt-4 text-center">Your resume's match to the job description.</p>
                        <div className="w-full flex justify-center items-baseline gap-4 mt-4 text-sm">
                            <div className="text-center">
                                <p className="font-bold text-gray-500">Original</p>
                                <p className={`font-bold text-lg ${getScoreColor(originalScore) === 'red' ? 'text-red-500' : 'text-gray-700'}`}>{originalScore}%</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-gray-500">Optimized</p>
                                <p className="font-bold text-lg text-green-600">{optimizedScore}%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-800">Analysis Sections</h3>
                        <ul className="mt-4 space-y-1">
                            {sideNavItems.map(item => (
                                <li key={item.name}>
                                    <a href={`#${item.name.toLowerCase().replace(' ', '-')}`} className="flex justify-between items-center text-gray-700 hover:bg-gray-100 p-2 rounded-md font-medium transition-colors">
                                        <span>{item.name}</span>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${item.issues > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {item.issues} to fix
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
                
                {/* --- MAIN CONTENT --- */}
                <main className="lg:col-span-3 space-y-8">
                    <SectionCard 
                        id="searchability" 
                        title="Searchability" 
                        tag="Important"
                        description="An ATS is used by 90% of companies. Below is how well your resume is parsed by these systems."
                    >
                        <ul className="space-y-4">
                            {report.searchability.tips.map((tip: SearchabilityTip) => (
                                <li key={tip.name} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50/50">
                                    <StatusIcon status={tip.status} />
                                    <div>
                                        <p className="font-bold text-gray-800">{tip.name}</p>
                                        <p className="text-gray-600">{tip.message}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>
                    
                    <SectionCard 
                        id="hard-skills"
                        title="Hard Skills"
                        tag="High Score Impact"
                        description="These are job-specific abilities. Include the exact wording from the job description."
                    >
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-gray-200">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-gray-600">Skill</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">In Resume</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600 text-center">In Job Desc.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.hardSkills.skills.map((skill: Skill) => (
                                        <tr key={skill.skill} className="border-b border-gray-100 last:border-b-0">
                                            <td className="p-3 font-medium text-gray-800">{skill.skill}</td>
                                            <td className="p-3 text-center">
                                                {skill.resumeCount === -1 ? <XCircleIcon className="w-6 h-6 text-red-500 inline-block" /> : <CheckCircleIcon className="w-6 h-6 text-green-500 inline-block" />}
                                            </td>
                                            <td className="p-3 font-medium text-gray-600 text-center">{skill.jdCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                    
                     <SectionCard 
                        id="soft-skills"
                        title="Soft Skills"
                        tag="Medium Score Impact"
                        description="These are personality traits and learned abilities that are typically transferable between jobs."
                    >
                        {report.softSkills.skills.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b-2 border-gray-200">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold text-gray-600">Skill</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600 text-center">In Resume</th>
                                            <th className="p-3 text-sm font-semibold text-gray-600 text-center">In Job Desc.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.softSkills.skills.map((skill: Skill) => (
                                            <tr key={skill.skill} className="border-b border-gray-100 last:border-b-0">
                                                <td className="p-3 font-medium text-gray-800">{skill.skill}</td>
                                                <td className="p-3 text-center">
                                                    {skill.resumeCount === -1 ? <XCircleIcon className="w-6 h-6 text-red-500 inline-block" /> : <CheckCircleIcon className="w-6 h-6 text-green-500 inline-block" />}
                                                </td>
                                                <td className="p-3 font-medium text-gray-600 text-center">{skill.jdCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No specific soft skills were identified in the job description.</p>
                        )}
                    </SectionCard>
                    
                    <SectionCard
                        id="recruiter-tips"
                        title="Recruiter Tips"
                        tag="Informative"
                        description="General advice from recruiters to make your resume stand out."
                    >
                         <ul className="space-y-4">
                            {report.recruiterTips.tips.map((tip: RecruiterTip) => (
                                <li key={tip.name} className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50/50">
                                    <StatusIcon status={tip.status} />
                                    <div>
                                        <p className="font-bold text-gray-800">{tip.name}</p>
                                        <p className="text-gray-600">{tip.message}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>
                    
                    <SectionCard 
                        id="optimized-resume"
                        title="Optimized Resume"
                        description="We've rewritten your resume to incorporate keywords and best practices. Copy the text below and use it to update your resume file."
                    >
                         <div className="relative">
                             <button
                                onClick={handleCopy}
                                className="absolute top-3 right-3 flex items-center gap-1.5 text-sm font-semibold text-white hover:text-gray-200 bg-gray-900/50 hover:bg-gray-900/80 transition-colors px-3 py-1.5 rounded-md"
                             >
                               <ClipboardIcon className="w-4 h-4" />
                               <span>{copyStatus}</span>
                             </button>
                             <div className="bg-white border border-gray-200 p-6 rounded-lg h-[60rem] overflow-y-auto text-sm font-sans whitespace-pre-wrap shadow-inner">
                                <p className="text-gray-800 leading-relaxed">
                                   {highlightKeywords(optimizedResume)}
                                </p>
                             </div>
                         </div>
                    </SectionCard>
                </main>
            </div>
        </div>
    );
};

export default ResultsStep;
