import express from 'express';
import { body } from 'express-validator';
import { register, login, logout, getMe } from '../controllers/auth';
import { validate } from '../middleware/validate';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  body('role').isIn(['customer', 'driver', 'hamali', 'admin']).withMessage('Invalid role'),
  validate
], asyncHandler(register));

router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], asyncHandler(login));

router.post('/logout', logout);

router.get('/me', protect, asyncHandler(getMe));

export default router;
