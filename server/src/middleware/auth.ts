import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.cookies && req.cookies.fyro_token) {
    token = req.cookies.fyro_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fyro_jwt_secret_change_in_prod_2026');
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};
