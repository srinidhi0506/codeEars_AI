const express = require('express');
const { callGemini } = require('../gemini');

const router = express.Router();

// Code-structure reasoning benefits from a coding-focused model rather
// than the general free-tier router, since it needs to track variables
// and conditions accurately rather than just produce fluent text.
const DIAGRAM_MODEL = 'qwen/qwen3-coder:free';

router.post('/', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required.' });
    }

    const prompt = `Look at this exact code and represent ITS SPECIFIC control flow as a Mermaid flowchart.

CRITICAL: The diagram must reflect the actual variables, conditions, and logic in the code below. Do not use generic placeholder labels like "Is input valid" or "Check condition" or "Process search" - use the real variable names and real conditions from this exact code. For example, if the code checks "low <= high", the node should say something like "low <= high" not "Check condition".

Respond with ONLY valid Mermaid flowchart syntax, nothing else - no markdown fences, no explanation, no commentary before or after.

Strict syntax rules:
- Start with exactly: flowchart TD
- Each node must have a short ID followed by its label, e.g. A[Start] or B{low less than high}
- Use square brackets [text] for actions/steps, curly braces {text} for decisions, and rounded ([text]) for start/end points
- Node labels must not contain quotes, colons, square brackets, or parentheses inside them - keep labels to plain words, numbers, and simple comparisons only (use "less than" instead of "<" if needed to be safe, or use the symbol alone without other punctuation)
- Connect nodes with --> and label decision branches like A -->|Yes| B
- Keep it to 6-10 nodes maximum
- Do not use subgraphs, classDef, or styling directives
- The node labels MUST reference real variable names, function names, or conditions found in the actual code below, not generic descriptions

Code to diagram:
${code}`;

    let raw;
    try {
      raw = await callGemini(prompt, DIAGRAM_MODEL, 15000); // 15s before trying fallback
    } catch (modelErr) {
      console.error('Diagram model unavailable or slow, falling back:', modelErr.message);
      raw = await callGemini(prompt, undefined, 20000); // 20s on the fallback router
    }
    // Defensive cleanup in case the model wraps it in fences anyway
    const mermaidCode = raw.replace(/```mermaid|```/g, '').trim();

    res.json({ mermaidCode });
  } catch (err) {
    console.error('Error in /api/diagram:', err.message);
    res.status(500).json({ error: 'Failed to generate diagram.' });
  }
});

module.exports = router;