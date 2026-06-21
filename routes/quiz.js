const express = require('express');
const { callGemini } = require('../gemini');

const router = express.Router();

const DIFFICULTY_INSTRUCTIONS = {
  junior: 'Ask junior-level questions about what the code does and basic reasoning.',
  mid: 'Ask mid-level questions about design decisions and edge cases.',
  senior: 'Ask senior-level questions about trade-offs, scalability, and failure modes.',
};

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  zh: 'Mandarin Chinese',
  ja: 'Japanese',
  pt: 'Portuguese',
};

router.post('/', async (req, res) => {
  try {
    const { code, difficulty = 'mid', language = 'en' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required.' });
    }

    const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.mid;
    const languageName = LANGUAGE_NAMES[language] || 'English';

    const prompt = `You are an interviewer. Based on this code, generate exactly 4 interview questions.

${difficultyInstruction}

Write both the questions and answers entirely in ${languageName}.

Respond ONLY with valid JSON, no markdown fences, no asterisks, no extra commentary:
[
  { "question": "...", "answer": "..." }
]

Code:
${code}`;

    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Model returned unexpected format.' });
    }

    res.json({ questions });
  } catch (err) {
    console.error('Error in /api/quiz:', err.message);
    res.status(500).json({ error: 'Failed to generate questions.' });
  }
});

module.exports = router;