import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import HamaliProfile from '../models/HamaliProfile';
import Referral from '../models/Referral';
import { generateReferralCode } from '../utils/generateId';

export const register = async (req: Request, res: Response) => {
  const { name, email, phone, password, role, referralCode } = req.body;

  // Check unique constraints
  if (email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered' });
  }
  
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) return res.status(400).json({ success: false, message: 'Phone already registered' });

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  const newReferralCode = generateReferralCode();

  let referredBy = undefined;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) referredBy = referrer._id;
  }

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    referralCode: newReferralCode,
    referredBy
  });

  if (referredBy) {
    await Referral.create({
      referrerId: referredBy,
      refereeId: user._id,
      code: referralCode,
      status: 'pending'
    });
  }

  if (role === 'driver') {
    await Vehicle.create({
      driverId: user._id,
      type: 'mini_truck',
      isAvailable: false,
      currentLocation: { type: 'Point', coordinates: [80.6480, 16.5062] }
    });
  } else if (role === 'hamali') {
    await HamaliProfile.create({
      workerId: user._id,
      isAvailable: false,
      currentLocation: { type: 'Point', coordinates: [80.6480, 16.5062] }
    });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role, name: user.name, email: user.email }, 
    process.env.JWT_SECRET || 'fyro_jwt_secret_change_in_prod_2026', 
    { expiresIn: '7d' }
  );

  res.cookie('fyro_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const userRes = user.toObject() as any;
  delete userRes.passwordHash;

  res.status(201).json({ success: true, data: { user: userRes } });
};

export const login = async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }]
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role, name: user.name, email: user.email }, 
    process.env.JWT_SECRET || 'fyro_jwt_secret_change_in_prod_2026', 
    { expiresIn: '7d' }
  );

  res.cookie('fyro_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const userRes = user.toObject() as any;
  delete userRes.passwordHash;

  res.status(200).json({ success: true, data: { user: userRes } });
};

export const logout = (req: Request, res: Response) => {
  res.cookie('fyro_token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user._id).select('-passwordHash');
  res.status(200).json({ success: true, data: user });
};
