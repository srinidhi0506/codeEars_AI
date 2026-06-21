const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Auto-router: always picks a currently-available free model
const MODEL = 'openrouter/free';

async function callGemini(prompt, modelOverride, timeoutMs = 20000) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelOverride || MODEL,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`OpenRouter request timed out after ${timeoutMs / 1000}s (model: ${modelOverride || MODEL})`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('OpenRouter API returned no text content');
  }

  return text;
}

/**
 * Strips common markdown symbols that models add despite instructions
 * not to. Prevents "asterisk asterisk" being read aloud by TTS, and
 * keeps displayed text clean too.
 * @param {string} text
 * @returns {string}
 */
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')   // **bold**
    .replace(/\*(.*?)\*/g, '$1')        // *italic*
    .replace(/^#{1,6}\s+/gm, '')        // # headings
    .replace(/^[-*+]\s+/gm, '')         // bullet markers
    .replace(/`{1,3}/g, '')             // backticks / code fences
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1') // _italic_ / __bold__
    .trim();
}

module.exports = { callGemini, stripMarkdown };