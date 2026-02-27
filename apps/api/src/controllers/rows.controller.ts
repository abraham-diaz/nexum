import type { RequestHandler } from 'express';
import * as rowsService from '../services/rows.service.js';

export const list: RequestHandler = async (req, res) => {
  const rows = await rowsService.findAll(req.params.databaseId);
  res.json(rows);
};

export const create: RequestHandler = async (req, res) => {
  const { order, cells } = req.body;
  const row = await rowsService.create({
    databaseId: req.params.databaseId,
    order,
    cells,
  });
  res.status(201).json(row);
};

export const update: RequestHandler = async (req, res) => {
  const row = await rowsService.update(req.params.id, req.body.order);
  res.json(row);
};

export const remove: RequestHandler = async (req, res) => {
  await rowsService.remove(req.params.id);
  res.status(204).end();
};

export const reorder: RequestHandler = async (req, res) => {
  const { orderedIds } = req.body;
  await rowsService.reorder(orderedIds);
  res.json({ ok: true });
};
