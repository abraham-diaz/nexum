import { Router } from 'express';
import * as controller from '../controllers/assistant.controller.js';

const router: Router = Router();

router.post('/', controller.ask);

export default router;
