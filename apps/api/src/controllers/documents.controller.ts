import type { RequestHandler } from 'express';
import * as documentsService from '../services/documents.service.js';

export const list: RequestHandler = async (req, res) => {
  const projectId = req.query.projectId as string | undefined;
  const documents = await documentsService.findAll(projectId);
  res.json(documents);
};

export const getById: RequestHandler = async (req, res) => {
  const doc = await documentsService.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
};

export const create: RequestHandler = async (req, res) => {
  const doc = await documentsService.create(req.body.title, req.body.projectId);
  res.status(201).json(doc);
};

export const update: RequestHandler = async (req, res) => {
  const doc = await documentsService.update(req.params.id, {
    title: req.body.title,
    content: req.body.content,
  });
  res.json(doc);
};

export const remove: RequestHandler = async (req, res) => {
  await documentsService.remove(req.params.id);
  res.status(204).end();
};
