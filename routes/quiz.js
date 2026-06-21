const express = require('express');
const { callGemini } = require('../gemini');

const router = express.Router();

const DIFFICULTY_INSTRUCTIONS = {
  junior: 'Ask junior-level questions about what the code does and basic reasoning.',
  mid: 'Ask mid-level questions about design decisions and edge cases.',
  senior: 'Ask senior-level questions about trade-offs, scalability, and failure modes.',
};

router.post('/', async (req, res) => {
  try {
    const { code, difficulty = 'mid' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required.' });
    }

    const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.mid;

    const prompt = `You are an interviewer. Based on this code, generate exactly 4 interview questions.

${difficultyInstruction}

Respond ONLY with valid JSON, no markdown fences:
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