const express = require('express');
const { callGemini, stripMarkdown } = require('../gemini');

const router = express.Router();

const DEPTH_INSTRUCTIONS = {
  beginner:
    'Explain it like the reader is new to programming. Use a simple analogy. Avoid jargon, or define any term you must use.',
  intermediate:
    'Explain it for someone comfortable with the basics of programming but new to this specific pattern or language feature.',
  senior:
    'Explain it concisely for a senior engineer. Focus on intent, trade-offs, and anything non-obvious. Skip explaining basic syntax.',
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
    const { code, depth = 'intermediate', language = 'en' } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required and must be a non-empty string.' });
    }

    const depthInstruction = DEPTH_INSTRUCTIONS[depth] || DEPTH_INSTRUCTIONS.intermediate;
    const languageName = LANGUAGE_NAMES[language] || 'English';

    const prompt = `You are explaining a piece of code out loud to a developer who will hear this read by a text-to-speech engine.

${depthInstruction}

Respond entirely in ${languageName}. Do not mix in English unless the code itself uses English keywords that have no natural translation.

Structure your explanation as:
1. One sentence summary of what the code does overall.
2. A short walkthrough of the logic, step by step.
3. Any edge cases or gotchas worth knowing.

Keep it conversational since it will be read aloud. Do not use any markdown formatting whatsoever - no asterisks, no underscores, no headings, no bullet symbols, no backticks, no code syntax. Write it exactly as a person would say it out loud.

Code:
${code}`;

    const raw = await callGemini(prompt);
    const explanation = stripMarkdown(raw);

    res.json({ explanation });
  } catch (err) {
    console.error('Error in /api/explain:', err.message);
    res.status(500).json({ error: 'Failed to generate explanation.' });
  }
});

module.exports = router;