require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const explainRoute = require('./routes/explain');
const quizRoute = require('./routes/quiz');
const diagramRoute = require('./routes/Diagram');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/api/explain', explainRoute);
app.use('/api/quiz', quizRoute);
app.use('/api/diagram', diagramRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CodeEars server running on http://localhost:${PORT}`);
});