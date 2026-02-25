import type { RequestHandler } from 'express';
import * as cellsService from '../services/cells.service.js';

export const upsert: RequestHandler = async (req, res) => {
  const { rowId, propertyId } = req.params;
  const cell = await cellsService.upsert(rowId, propertyId, req.body.value);
  res.json(cell);
};

export const remove: RequestHandler = async (req, res) => {
  const { rowId, propertyId } = req.params;
  await cellsService.remove(rowId, propertyId);
  res.status(204).end();
};
