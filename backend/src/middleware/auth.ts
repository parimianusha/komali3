import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isLiveSupabaseConfigured } from '../config/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  displayName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development without live Supabase configured, support mock user for local verification
    if (!isLiveSupabaseConfigured && process.env.NODE_ENV !== 'production') {
      const mockUserId = (req.headers['x-mock-user-id'] as string) || '00000000-0000-0000-0000-000000000001';
      req.user = {
        id: mockUserId,
        email: 'demo@example.com',
        displayName: 'Demo User',
      };
      req.token = 'mock-dev-token';
      return next();
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or malformed',
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid, expired, or revoked authentication session',
        },
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
    };
    req.token = token;

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_VERIFICATION_FAILED',
        message: 'Could not verify authentication credentials',
      },
    });
  }
}
