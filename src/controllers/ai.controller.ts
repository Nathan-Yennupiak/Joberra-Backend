import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';

// Controller to generate a job description
export const generateJobDescription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, company, category, location, jobType } = req.body;

    if (!title || !company) {
      return res.status(400).json({ message: 'Title and Company are required to generate a description.' });
    }

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `You are an expert technical recruiter and HR specialist.
Write a professional, engaging job description for the following position:
- Job Title: ${title}
- Company: ${company}
- Category: ${category || 'General'}
- Location: ${location || 'Not specified'}
- Job Type: ${jobType || 'Full-time'}

Please output ONLY the job description formatted in plain text. Do NOT use HTML tags. 
The text should include:
- A brief engaging company introduction.
- The role overview.
- Key responsibilities (using standard bullet points like - or *).
- Requirements/Qualifications.
- Benefits.

Make it sound professional, welcoming, and modern. Output ONLY the raw text. Use empty lines to separate paragraphs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let generatedHtml = response.text || '';
    
    // Clean up potential markdown formatting if the AI still included it
    generatedHtml = generatedHtml.replace(/^```html/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    res.status(200).json({ description: generatedHtml });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ message: 'Failed to generate description with AI.', details: error.message });
  }
};
