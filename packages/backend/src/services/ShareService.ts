import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Character } from '../models/Character.js';
import { AppDataSource } from '../database/data-source.js';

export interface ShareTokenInfo {
  token: string;
  expiresAt: Date | null;
  characterId: string;
  characterName: string;
}

export interface SharedCharacterResponse {
  character: Character;
  isExpired: boolean;
}

export class ShareService {
  private characterRepository: Repository<Character>;

  constructor() {
    this.characterRepository = AppDataSource.getRepository(Character);
  }

  /**
   * Generate a unique share token for a character
   * @param characterId The character to generate a token for
   * @param userId The owner of the character
   * @param expiresInDays Optional expiration in days (null = never expires)
   * @returns The generated share token info
   */
  async generateShareToken(
    characterId: string,
    userId: string,
    expiresInDays: number | null = null
  ): Promise<ShareTokenInfo> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId, user_id: userId },
    });

    if (!character) {
      throw new Error('Character not found or access denied');
    }

    // Generate a unique 12-character token
    const token = this.generateToken();

    // Calculate expiration date if specified
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Update the character with the share token
    character.share_token = token;
    character.share_token_expires_at = expiresAt ?? undefined;
    await this.characterRepository.save(character);

    return {
      token,
      expiresAt,
      characterId: character.id,
      characterName: character.name,
    };
  }

  /**
   * Revoke (delete) a share token for a character
   * @param characterId The character to revoke the token for
   * @param userId The owner of the character
   */
  async revokeShareToken(characterId: string, userId: string): Promise<void> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId, user_id: userId },
    });

    if (!character) {
      throw new Error('Character not found or access denied');
    }

    character.share_token = undefined;
    character.share_token_expires_at = undefined;
    await this.characterRepository.save(character);
  }

  /**
   * Get a character by its share token
   * @param token The share token to look up
   * @returns The character if found and token is valid
   */
  async getCharacterByShareToken(token: string): Promise<SharedCharacterResponse | null> {
    const character = await this.characterRepository.findOne({
      where: { share_token: token },
    });

    if (!character) {
      return null;
    }

    // Check if token is expired
    const isExpired = character.share_token_expires_at
      ? new Date(character.share_token_expires_at) < new Date()
      : false;

    // Increment view count (even for expired tokens, so owner can see activity)
    character.view_count = (character.view_count || 0) + 1;
    await this.characterRepository.save(character);

    return {
      character,
      isExpired,
    };
  }

  /**
   * Get share token info for a character
   * @param characterId The character to get token info for
   * @param userId The owner of the character
   * @returns Share token info or null if no token exists
   */
  async getShareTokenInfo(characterId: string, userId: string): Promise<ShareTokenInfo | null> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId, user_id: userId },
    });

    if (!character || !character.share_token) {
      return null;
    }

    return {
      token: character.share_token,
      expiresAt: character.share_token_expires_at ?? null,
      characterId: character.id,
      characterName: character.name,
    };
  }

  /**
   * Update the expiration date of an existing share token
   * @param characterId The character to update
   * @param userId The owner of the character
   * @param expiresInDays New expiration in days (null = never expires)
   */
  async updateShareTokenExpiration(
    characterId: string,
    userId: string,
    expiresInDays: number | null
  ): Promise<ShareTokenInfo> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId, user_id: userId },
    });

    if (!character) {
      throw new Error('Character not found or access denied');
    }

    if (!character.share_token) {
      throw new Error('No share token exists for this character');
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    character.share_token_expires_at = expiresAt ?? undefined;
    await this.characterRepository.save(character);

    return {
      token: character.share_token,
      expiresAt,
      characterId: character.id,
      characterName: character.name,
    };
  }

  /**
   * Generate a unique 12-character URL-safe token
   */
  private generateToken(): string {
    // Generate 9 random bytes (72 bits) and encode as base64url
    // This gives us 12 characters of URL-safe output
    return randomBytes(9)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
