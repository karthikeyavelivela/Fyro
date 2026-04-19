import express from 'express';
import { protect } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = express.Router();

router.get('/stats', (req, res) => res.json({ success: true }));

export default router;
