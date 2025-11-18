import { GoogleGenAI, Type } from "@google/genai";
import type { Language, AnalysisResult } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'MISSING_API_KEY' });

const SYSTEM_PROMPT = `You are an expert resume analyzer and optimizer, designed to help job seekers get past Applicant Tracking Systems (ATS). Your task is to compare a resume against a job description and provide a detailed analysis report and an optimized version of the resume. You MUST output your response as a single JSON object that adheres to the provided schema. Do not include any text, markdown, or code block formatting outside of the JSON object.

The JSON object must have two top-level keys: "report" and "optimizedResume".

1.  **"report" key**: This will contain the analysis of the *original* resume.
    *   \`searchability\`: An object analyzing how well an ATS can parse the resume.
        *   \`issues\`: Total count of 'fail' statuses in the tips.
        *   \`tips\`: An array of objects for checks like "ATS Tip", "Contact Information", "Summary", "Section Headings", "Job Title Match", "Date Formatting", "Education Match", "File Type". For "File Type", provide a generic good practice tip since you are processing text.
    *   \`hardSkills\`: An object analyzing keywords.
        *   \`issues\`: Total count of skills present in the JD but not in the resume.
        *   \`skills\`: An array of key hard skills from the job description. If a skill is not found in the resume, set 'resumeCount' to -1. Provide an estimated 'jdCount' based on frequency in the job description.
    *   \`softSkills\`: Same structure as 'hardSkills'. If no soft skills are found, return an empty array for 'skills'.
    *   \`recruiterTips\`: An object with general advice.
        *   \`issues\`: Total count of 'warning' statuses in the tips.
        *   \`tips\`: An array of objects for categories like "Job Level Match", "Measurable Results", "Resume Tone", "Web Presence", "Word Count".

2.  **"optimizedResume" key**: This will contain the full text of the rewritten, ATS-friendly resume as a single string, formatted with newline characters (\\n) for proper section breaks and readability. The optimized resume should strategically incorporate missing keywords and align with the job description. IMPORTANT: The final optimized resume MUST be concise and its content should not exceed two standard A4 pages when pasted into a document. This is a strict requirement. A resume longer than two pages is considered a failure.

Analyze the provided resume and job description thoroughly to generate accurate and helpful results. The language of the report and optimized resume should match the 'job_language' provided.`;

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        report: {
            type: Type.OBJECT,
            properties: {
                searchability: {
                    type: Type.OBJECT,
                    properties: {
                        issues: { type: Type.INTEGER },
                        tips: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    status: { type: Type.STRING, enum: ['pass', 'fail', 'info'] },
                                    message: { type: Type.STRING },
                                },
                                required: ['name', 'status', 'message'],
                            },
                        },
                    },
                    required: ['issues', 'tips'],
                },
                hardSkills: {
                    type: Type.OBJECT,
                    properties: {
                        issues: { type: Type.INTEGER },
                        skills: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    skill: { type: Type.STRING },
                                    resumeCount: { type: Type.INTEGER, description: "Count of skill in resume. -1 if not found." },
                                    jdCount: { type: Type.INTEGER },
                                },
                                required: ['skill', 'resumeCount', 'jdCount'],
                            },
                        },
                    },
                    required: ['issues', 'skills'],
                },
                softSkills: {
                    type: Type.OBJECT,
                    properties: {
                        issues: { type: Type.INTEGER },
                        skills: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    skill: { type: Type.STRING },
                                    resumeCount: { type: Type.INTEGER, description: "Count of skill in resume. -1 if not found." },
                                    jdCount: { type: Type.INTEGER },
                                },
                                required: ['skill', 'resumeCount', 'jdCount'],
                            },
                        },
                    },
                    required: ['issues', 'skills'],
                },
                recruiterTips: {
                    type: Type.OBJECT,
                    properties: {
                        issues: { type: Type.INTEGER },
                        tips: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    status: { type: Type.STRING, enum: ['pass', 'warning', 'info'] },
                                    message: { type: Type.STRING },
                                },
                                required: ['name', 'status', 'message'],
                            },
                        },
                    },
                    required: ['issues', 'tips'],
                },
            },
            required: ['searchability', 'hardSkills', 'softSkills', 'recruiterTips'],
        },
        optimizedResume: { type: Type.STRING, description: "The full optimized resume text, formatted with newline characters for readability. The content must not exceed the length of two standard A4 pages." },
    },
    required: ['report', 'optimizedResume'],
};

export const optimizeResume = async (
    jobDescription: string,
    candidateCv: string,
    jobLanguage: Language
): Promise<AnalysisResult> => {
    const userPrompt = `
Here is the job and resume data:
{
  "job_description": ${JSON.stringify(jobDescription)},
  "candidate_cv": ${JSON.stringify(candidateCv)},
  "job_language": "${jobLanguage}"
}

Please provide the analysis and the optimized resume in the specified JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0, // Set to 0 for deterministic and consistent results
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText) as AnalysisResult;
        
        return result;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            let message = error.message;
            if (error.message.includes('JSON')) {
                message = "The model returned an invalid analysis structure. Please try again."
            } else if (error.message.includes('API_KEY')) {
                 message = "Invalid API Key provided."
            }
            throw new Error(`An error occurred while processing your request. Details: ${message}`);
        }
        throw new Error("An unknown error occurred while processing your request.");
    }
};