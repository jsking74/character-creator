import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../utils/jwt.js';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  constructor(private userRepository: Repository<User>) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = this.userRepository.create({
      id: uuidv4(),
      email: input.email,
      password_hash: passwordHash,
      display_name: input.displayName,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    return {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(input.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    return {
      accessToken: generateAccessToken(tokenPayload),
      refreshToken: generateRefreshToken(tokenPayload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = require('../utils/jwt.js').verifyToken(refreshToken);

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
      };

      return {
        accessToken: generateAccessToken(tokenPayload),
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async getUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }
}
