export type Language = 'pt' | 'en' | 'es';

export interface SearchabilityTip {
  name: string;
  status: 'pass' | 'fail' | 'info';
  message: string;
}

export interface Skill {
  skill: string;
  resumeCount: number; // -1 indicates "Not found"
  jdCount: number;
}

export interface RecruiterTip {
  name: string;
  status: 'pass' | 'warning' | 'info';
  message: string;
}

export interface Report {
  searchability: {
    issues: number;
    tips: SearchabilityTip[];
  };
  hardSkills: {
    issues: number;
    skills: Skill[];
  };
  softSkills: {
    issues: number;
    skills: Skill[];
  };
  recruiterTips: {
    issues: number;
    tips: RecruiterTip[];
  };
}

export interface AnalysisResult {
  report: Report;
  optimizedResume: string;
}
