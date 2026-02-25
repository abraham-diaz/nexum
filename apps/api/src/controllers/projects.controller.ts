import type { RequestHandler } from 'express';
import * as projectsService from '../services/projects.service.js';

export const list: RequestHandler = async (req, res) => {
  const parentId = req.query.parentId as string | undefined;
  const projects = await projectsService.findAll(parentId);
  res.json(projects);
};

export const getById: RequestHandler = async (req, res) => {
  const project = await projectsService.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
};

export const create: RequestHandler = async (req, res) => {
  const project = await projectsService.create(req.body.name, req.body.parentId);
  res.status(201).json(project);
};

export const update: RequestHandler = async (req, res) => {
  const project = await projectsService.update(req.params.id, req.body.name);
  res.json(project);
};

export const remove: RequestHandler = async (req, res) => {
  await projectsService.remove(req.params.id);
  res.status(204).end();
};
