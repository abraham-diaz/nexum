import type { RequestHandler } from 'express';
import * as searchService from '../services/search.service.js';

export const search: RequestHandler = async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    res.json({ projects: [], databases: [], documents: [] });
    return;
  }
  try {
    const results = await searchService.search(q);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};
