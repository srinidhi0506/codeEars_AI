const express = require('express');
const { callGemini } = require('../gemini');

const router = express.Router();

const DEPTH_INSTRUCTIONS = {
  beginner: 'Explain it like the reader is new to programming. Use a simple analogy.',
  intermediate: 'Explain it for someone comfortable with the basics of programming.',
  senior: 'Explain it concisely for a senior engineer. Focus on intent and trade-offs.',
};

router.post('/', async (req, res) => {
  try {
    const { code, depth = 'intermediate' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required.' });
    }

    const depthInstruction = DEPTH_INSTRUCTIONS[depth] || DEPTH_INSTRUCTIONS.intermediate;

    const prompt = `You are explaining code out loud to a developer, read by text-to-speech.

${depthInstruction}

Structure: 1) one sentence summary, 2) step-by-step walkthrough, 3) edge cases.
Plain spoken sentences only, no markdown, no code syntax.

Code:
${code}`;

    const explanation = await callGemini(prompt);
    res.json({ explanation });
  } catch (err) {
    console.error('Error in /api/explain:', err.message);
    res.status(500).json({ error: 'Failed to generate explanation.' });
  }
});

module.exports = router;