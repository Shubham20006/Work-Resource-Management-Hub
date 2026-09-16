import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { UserModel } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'workhub_secret_jwt_token_key_2026_safe';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please provide your name, email, and password.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
      res.status(500).json({ error: 'We couldn\'t create your account right now. Please try again.', details: error.message });
    }
  };
  
  export const login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        res.status(400).json({ error: 'Please provide both your email and password.' });
        return;
      }
  
      const normalizedEmail = email.trim().toLowerCase();
  
      // Find user
      const user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({ error: 'The email or password you entered is incorrect.' });
        return;
      }
  
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password || '');
      if (!isMatch) {
        res.status(401).json({ error: 'The email or password you entered is incorrect.' });
        return;
      }
  
      // Generate token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
  
      res.status(200).json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'We couldn\'t log you in right now. Please try again.', details: error.message });
    }
  };
  
  export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'You need to be logged in to do this.' });
        return;
      }
  
      const user = await UserModel.findById(req.user.userId).select('-password');
      if (!user) {
        res.status(404).json({ error: 'We couldn\'t find your account.' });
        return;
      }
  
      res.status(200).json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error: any) {
      console.error('GetMe error:', error);
      res.status(500).json({ error: 'We couldn\'t load your profile right now.', details: error.message });
    }
  };
  
  export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await UserModel.find().select('name email _id');
      const mappedUsers = users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email
      }));
      res.status(200).json(mappedUsers);
    } catch (error: any) {
      console.error('GetAllUsers error:', error);
      res.status(500).json({ error: 'We couldn\'t load the user list right now.', details: error.message });
  }
};
