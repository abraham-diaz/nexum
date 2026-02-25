import type { RequestHandler } from 'express';
import * as databasesService from '../services/databases.service.js';

export const list: RequestHandler = async (req, res) => {
  const projectId = req.query.projectId as string | undefined;
  const databases = await databasesService.findAll(projectId);
  res.json(databases);
};

export const getById: RequestHandler = async (req, res) => {
  const db = await databasesService.findById(req.params.id);
  if (!db) return res.status(404).json({ error: 'Database not found' });
  res.json(db);
};

export const create: RequestHandler = async (req, res) => {
  const db = await databasesService.create(req.body.name, req.body.projectId);
  res.status(201).json(db);
};

export const update: RequestHandler = async (req, res) => {
  const db = await databasesService.update(req.params.id, req.body.name);
  res.json(db);
};

export const remove: RequestHandler = async (req, res) => {
  await databasesService.remove(req.params.id);
  res.status(204).end();
};
