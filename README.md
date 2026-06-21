# CodeEars 🎧

**Listen to your code.** Paste a snippet, get it explained out loud in plain English (or 9 other languages), quizzed on it like a real interview, and visualized as a flowchart — all read aloud by your browser, no app to install.

Built for developers who learn better by listening, devs with low vision or reading fatigue, and anyone prepping for technical interviews.

---

## 🔗 Links


- **GitHub repo:** https://github.com/srinidhi0506/codeEars_AI

---

## The problem

Reading dense code explanations is slow, and most AI coding tools assume you're staring at a screen. CodeEars turns code comprehension into something you can *listen* to — while commuting, resting your eyes, or just multitasking — and adds an interview-prep layer most explainer tools skip entirely.

## Features

- 🗣️ **Explain mode** — paste any code snippet and get a structured, spoken-friendly explanation (summary → walkthrough → edge cases), pitched at Beginner / Intermediate / Senior level
- 🌍 **10 languages** — explanations and quiz questions can be generated in English, Spanish, French, German, Hindi, Telugu, Tamil, Mandarin, Japanese, or Portuguese
- 🧠 **Quiz me mode** — generates 4 real interview-style questions based on *your exact code*, with answers hidden until you reveal them — great for interview prep
- 📊 **Flowchart diagrams** — visualizes the code's actual logic and control flow as a Mermaid diagram, using the real variable names and conditions from your snippet
- 🔊 **Read aloud** — uses the browser's built-in text-to-speech, with language-matched voice selection where available
- 🎛️ **Studio-themed UI** — a custom "recording console" interface (not a generic template) with a live VU meter that pulses while the explanation plays

## Tech stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express |
| AI | OpenRouter API (free-tier models: Llama 3.3 70B, DeepSeek, Qwen3 Coder — with automatic fallback if one is unavailable) |
| Voice | Web Speech API (`SpeechSynthesis`) — built into the browser, no extra dependency |
| Diagrams | Mermaid.js (rendered client-side from AI-generated flowchart syntax) |
| Frontend | Vanilla HTML/CSS/JS — no framework, no build step |

### Why OpenRouter instead of calling Gemini directly?

We originally built this against Google's Gemini API directly, but hit a free-tier quota bug (`limit: 0`) that blocked all requests regardless of key or project. OpenRouter gives free access to several capable instruction-following models through one unified API, with no billing setup required — a better fit for a hackathon timeline. The integration is designed so a future swap back to a Gemini-native key is a one-line change in `gemini.js`.

## How it works

1. You paste code into the input panel and pick a mode (Explain or Quiz me), depth/difficulty, and language.
2. The frontend sends the code to `/api/explain`, `/api/quiz`, or `/api/diagram` on the Express backend.
3. The backend builds a tailored prompt and calls the OpenRouter API, trying a list of known-reliable free models in order until one succeeds (protects against any single free model being slow, overloaded, or unavailable).
4. The response is cleaned of markdown formatting (so it doesn't get read aloud as literal asterisks) and returned to the frontend.
5. In Explain mode, hit "Listen" to have it read aloud; in Quiz mode, reveal each answer on demand; in either, hit "Show flowchart" to visualize the logic.

## Project structure

```
codeEars_AI/
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── routes/
│   ├── explain.js
│   ├── quiz.js
│   └── diagram.js
├── gemini.js          # shared OpenRouter caller with fallback + timeout logic
├── server.js
├── .env               # not committed — see setup below
└── package.json
```

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Get a free API key from [OpenRouter](https://openrouter.ai) (Keys section, no billing required for free models).

3. Create a `.env` file in the project root:
   ```
   OPENROUTER_API_KEY=your_key_here
   PORT=6700
   ```

4. Run the server:
   ```bash
   node server.js
   ```

5. Open `http://localhost:6700` in your browser.

## Known limitations

- Free-tier models can occasionally be slow or rate-limited under heavy load — diagram generation in particular can take up to ~30 seconds in the worst case. The app uses timeouts and model fallbacks to keep this bounded rather than indefinite.
- Mermaid diagram quality depends on the model accurately tracking the code's logic; very long or complex snippets may produce a less accurate flowchart than short, focused ones.
- Voice quality and language coverage depend on the voices installed in the user's browser/OS.

## Roadmap

- Repo-aware mode: pull a GitHub file plus its callers for richer context
- Diff mode: explain a pull request instead of a single snippet
- Live line highlighting synced to the spoken explanation
- Voice input for follow-up questions ("wait, what's a closure?")
- Export explanations as a downloadable audio file

## Deployment

Deployed on [Render](https://render.com):
- Build command: `npm install`
- Start command: `node server.js`
- Environment variable: `OPENROUTER_API_KEY` set in the Render dashboard (never committed to the repo)

---

Built for the Creative Showcase Hackathon — *Voice & multimodal interfaces* theme.