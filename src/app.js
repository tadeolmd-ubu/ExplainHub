import express from 'express';

const app = express();

app.use(express.json());

// Healt
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;