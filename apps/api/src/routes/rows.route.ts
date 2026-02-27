import { Router } from 'express';
import * as controller from '../controllers/rows.controller.js';

const router: Router = Router({ mergeParams: true });

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/reorder', controller.reorder);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
