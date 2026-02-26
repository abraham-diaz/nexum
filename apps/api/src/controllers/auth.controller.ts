import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';

export function login(req: Request, res: Response) {
  const { user, password } = req.body;

  if (!user || !password) {
    res.status(400).json({ error: 'User and password are required' });
    return;
  }

  const result = authService.login(user, password);

  if (!result) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ accessToken: result.accessToken });
}

export function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  try {
    const result = authService.refresh(token);
    res.json({ accessToken: result.accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.status(204).end();
}
