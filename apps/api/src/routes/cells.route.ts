import { Router } from 'express';
import * as controller from '../controllers/cells.controller.js';

const router: Router = Router({ mergeParams: true });

router.put('/:propertyId', controller.upsert);
router.delete('/:propertyId', controller.remove);

export default router;
