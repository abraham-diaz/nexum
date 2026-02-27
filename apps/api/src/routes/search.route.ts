import { Router } from 'express';
import * as controller from '../controllers/search.controller.js';

const router: Router = Router();

router.get('/', controller.search);

export default router;
