import type { RequestHandler } from 'express';
import * as assistantService from '../services/assistant.service.js';

export const ask: RequestHandler = async (req, res) => {
  const q = String(req.body.query ?? '').trim();
  if (!q) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }
  try {
    const result = await assistantService.ask(q);
    res.json(result);
  } catch (err) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: 'Assistant failed' });
  }
};
