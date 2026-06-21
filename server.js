require('dotenv').config();
const express = require('express');
const cors = require('cors');

const explainRoute = require('./routes/explain');
const quizRoute = require('./routes/quiz');

const app = express();
const port = process.env.PORT || 6700;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

app.use('/api/explain', explainRoute);
app.use('/api/quiz', quizRoute);

app.listen(port, function () {
  console.log("App running on http://localhost:" + port);
});