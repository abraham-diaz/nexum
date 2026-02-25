import type { RequestHandler } from 'express';
import * as propertiesService from '../services/properties.service.js';

export const list: RequestHandler = async (req, res) => {
  const properties = await propertiesService.findAll(req.params.databaseId);
  res.json(properties);
};

export const create: RequestHandler = async (req, res) => {
  const { name, type, order, config, relationDatabaseId } = req.body;
  const property = await propertiesService.create({
    databaseId: req.params.databaseId,
    name,
    type,
    order,
    config,
    relationDatabaseId,
  });
  res.status(201).json(property);
};

export const update: RequestHandler = async (req, res) => {
  const { name, order, config } = req.body;
  const property = await propertiesService.update(req.params.id, { name, order, config });
  res.json(property);
};

export const remove: RequestHandler = async (req, res) => {
  await propertiesService.remove(req.params.id);
  res.status(204).end();
};
