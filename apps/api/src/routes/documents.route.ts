import { Router } from 'express';
import * as controller from '../controllers/documents.controller.js';

const router: Router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
