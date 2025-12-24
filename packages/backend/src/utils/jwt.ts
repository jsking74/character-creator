import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  email: string;
}

// Validate JWT_SECRET at startup - fail fast if not configured
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'CRITICAL: JWT_SECRET environment variable is not set. ' +
      'Please set a strong secret (at least 32 characters) before starting the server.'
    );
  }
  if (secret.length < 32) {
    throw new Error(
      'CRITICAL: JWT_SECRET must be at least 32 characters long for security.'
    );
  }
  return secret;
};

// Eagerly validate on module load
const JWT_SECRET = getJwtSecret();

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: '15m',
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
};
