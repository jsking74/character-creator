import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/data-source.js';
import { User } from '../models/User.js';
import { AuthService, RegisterInput, LoginInput } from '../services/AuthService.js';
import { authenticateToken } from '../middlewares/auth.js';
import { registerSchema, loginSchema } from '../schemas/auth.js';

const router = Router();

// Cookie configuration for tokens
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // Only send over HTTPS in production
  sameSite: isProduction ? 'strict' as const : 'lax' as const,
  path: '/',
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

// Get services - lazy loaded to ensure DB is initialized
const getAuthService = () => {
  const userRepository = AppDataSource.getRepository(User);
  return new AuthService(userRepository);
};

// Register endpoint
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const authService = getAuthService();
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const input: RegisterInput = {
      email: value.email,
      password: value.password,
      displayName: value.displayName,
    };

    const authResponse = await authService.register(input);

    // Set tokens in httpOnly cookies
    setAuthCookies(res, authResponse.accessToken, authResponse.refreshToken);

    // Return user info but not tokens (they're in cookies now)
    res.json({
      user: authResponse.user,
      // Include tokens in response for backward compatibility (can be removed later)
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const authService = getAuthService();
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const input: LoginInput = {
      email: value.email,
      password: value.password,
    };

    const authResponse = await authService.login(input);

    // Set tokens in httpOnly cookies
    setAuthCookies(res, authResponse.accessToken, authResponse.refreshToken);

    // Return user info but not tokens (they're in cookies now)
    res.json({
      user: authResponse.user,
      // Include tokens in response for backward compatibility (can be removed later)
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const authService = getAuthService();

    // Try to get refresh token from cookie first, then body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    // Set new access token in cookie
    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({
      accessToken: result.accessToken,
    });
  } catch (err: any) {
    // Clear cookies on refresh failure
    clearAuthCookies(res);
    res.status(401).json({ error: err.message });
  }
});

// Get current user endpoint (protected)
router.get('/user', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const authService = getAuthService();
    if (!req.user) {
      res.status(401).json({ error: 'User not found in token' });
      return;
    }

    const user = await authService.getUser(req.user.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint - clears auth cookies
router.post('/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
});

export default router;
