import { Router } from 'express';
import * as controller from '../controllers/databases.controller.js';

const router: Router = Router();

router.get('/templates', controller.listTemplates);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id/view-type', controller.updateViewType);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
