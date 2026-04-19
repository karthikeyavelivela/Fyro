import express from 'express';
const router = express.Router();
router.get('/my-code', (req, res) => res.json({ success: true }));
export default router;
