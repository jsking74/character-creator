import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/data-source.js';
import { Character } from '../models/Character.js';
import { CharacterService } from '../services/CharacterService.js';
import { ShareService } from '../services/ShareService.js';
import { PdfService } from '../services/PdfService.js';
import { CharacterValidationService } from '../services/CharacterValidationService.js';
import { systemConfigService } from '../services/SystemConfigService.js';
import { authenticateToken } from '../middlewares/auth.js';
import {
  createCharacterSchema,
  updateCharacterSchema,
  listCharactersQuerySchema,
  importCharacterSchema,
} from '../schemas/character.js';

const router = Router();

// Get services - lazy loaded to ensure DB is initialized
const getCharacterService = () => {
  const characterRepository = AppDataSource.getRepository(Character);
  return new CharacterService(characterRepository);
};

const getShareService = () => new ShareService();

const getValidationService = () => new CharacterValidationService(systemConfigService);

// Create a new character (protected)
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = createCharacterSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    // Validate character data against system configuration
    if (value.character_data) {
      const validationService = getValidationService();
      const validationResult = await validationService.validateCharacter(
        value.system_id,
        value.character_data
      );

      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Character validation failed',
          validationErrors: validationResult.errors,
        });
        return;
      }
    }

    const characterService = getCharacterService();
    const character = await characterService.createCharacter(req.user.userId, {
      name: value.name,
      system_id: value.system_id,
      character_data: value.character_data,
      image_url: value.image_url,
      is_public: value.is_public,
    });

    res.status(201).json(characterService.exportAsJSON(character));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Import a character from JSON (protected)
router.post('/import', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = importCharacterSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const characterService = getCharacterService();
    const character = await characterService.importFromJSON(req.user.userId, value);

    res.status(201).json({
      message: 'Character imported successfully',
      character: characterService.exportAsJSON(character),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get all characters for current user (protected) with optional filters
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = listCharactersQuerySchema.validate(req.query);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const characterService = getCharacterService();
    const { characters, total } = await characterService.getCharactersByUserId(
      req.user.userId,
      {
        system_id: value.system_id,
        class: value.class,
        race: value.race,
        minLevel: value.minLevel,
        maxLevel: value.maxLevel,
        search: value.search,
        sortBy: value.sortBy,
        sortOrder: value.sortOrder,
        limit: value.limit,
        offset: value.offset,
      }
    );

    res.json({
      characters: characters.map((char) => characterService.exportAsJSON(char)),
      total,
      limit: value.limit,
      offset: value.offset || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get public characters (paginated)
// NOTE: Must be defined before /:id routes to avoid "browse" being matched as an ID
router.get('/browse/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Limit must be between 1 and 100' });
      return;
    }

    const characterService = getCharacterService();
    const characters = await characterService.getPublicCharacters(limit, offset);

    res.json(
      characters.map((char) => characterService.exportAsJSON(char))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get character by share token (public - no auth required)
router.get('/shared/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const shareService = getShareService();
    const characterService = getCharacterService();
    const result = await shareService.getCharacterByShareToken(req.params.token);

    if (!result) {
      res.status(404).json({ error: 'Character not found or share link is invalid' });
      return;
    }

    if (result.isExpired) {
      res.status(410).json({ error: 'Share link has expired' });
      return;
    }

    res.json({
      ...characterService.exportAsJSON(result.character),
      viewCount: result.character.view_count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate share token for a character (protected - must be owner)
router.post('/:id/share', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const expiresInDays = req.body.expiresInDays ?? null;

    if (expiresInDays !== null && (typeof expiresInDays !== 'number' || expiresInDays < 1)) {
      res.status(400).json({ error: 'expiresInDays must be a positive number or null' });
      return;
    }

    const shareService = getShareService();
    const tokenInfo = await shareService.generateShareToken(
      req.params.id,
      req.user.userId,
      expiresInDays
    );

    res.status(201).json({
      token: tokenInfo.token,
      shareUrl: `/characters/shared/${tokenInfo.token}`,
      expiresAt: tokenInfo.expiresAt,
      characterId: tokenInfo.characterId,
      characterName: tokenInfo.characterName,
    });
  } catch (err: any) {
    if (err.message === 'Character not found or access denied') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get share token info for a character (protected - must be owner)
router.get('/:id/share', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const shareService = getShareService();
    const tokenInfo = await shareService.getShareTokenInfo(req.params.id, req.user.userId);

    if (!tokenInfo) {
      res.status(404).json({ error: 'No share token exists for this character' });
      return;
    }

    res.json({
      token: tokenInfo.token,
      shareUrl: `/characters/shared/${tokenInfo.token}`,
      expiresAt: tokenInfo.expiresAt,
      characterId: tokenInfo.characterId,
      characterName: tokenInfo.characterName,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke share token for a character (protected - must be owner)
router.delete('/:id/share', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const shareService = getShareService();
    await shareService.revokeShareToken(req.params.id, req.user.userId);

    res.json({ message: 'Share token revoked successfully' });
  } catch (err: any) {
    if (err.message === 'Character not found or access denied') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Export character as PDF (protected - must be owner or public)
// NOTE: Must be defined before /:id route to avoid being matched as an ID
router.get('/:id/pdf', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const characterService = getCharacterService();
    const character = await characterService.getCharacterById(
      req.params.id,
      req.user?.userId
    );

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Allow access if user is owner or character is public
    if (character.user_id !== req.user?.userId && !character.is_public) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const pdfService = new PdfService();
    const doc = pdfService.generateCharacterSheet(character);

    // Set response headers for PDF download
    const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_character_sheet.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Export character as JSON (protected - must be owner or public)
// NOTE: Must be defined before /:id route to avoid being matched as an ID
router.get('/:id/json', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const characterService = getCharacterService();
    const character = await characterService.getCharacterById(
      req.params.id,
      req.user?.userId
    );

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Allow access if user is owner or character is public
    if (character.user_id !== req.user?.userId && !character.is_public) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const jsonData = characterService.exportAsJSON(character);
    const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_character.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(jsonData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific character (protected - must be owner or public)
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const characterService = getCharacterService();
    const character = await characterService.getCharacterById(
      req.params.id,
      req.user?.userId
    );

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Allow access if user is owner or character is public
    if (character.user_id !== req.user?.userId && !character.is_public) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(characterService.exportAsJSON(character));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update character (protected - must be owner)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = updateCharacterSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const characterService = getCharacterService();

    // Get existing character to determine system_id for validation
    const existingCharacter = await characterService.getCharacterById(
      req.params.id,
      req.user.userId
    );

    if (!existingCharacter) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    // Validate character data against system configuration
    if (value.character_data) {
      const validationService = getValidationService();
      const validationResult = await validationService.validateCharacter(
        existingCharacter.system_id,
        value.character_data
      );

      if (!validationResult.valid) {
        res.status(400).json({
          error: 'Character validation failed',
          validationErrors: validationResult.errors,
        });
        return;
      }
    }

    const character = await characterService.updateCharacter(
      req.params.id,
      req.user.userId,
      value
    );

    res.json(characterService.exportAsJSON(character));
  } catch (err: any) {
    if (err.message === 'Character not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Delete character (protected - must be owner)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const characterService = getCharacterService();
    await characterService.deleteCharacter(req.params.id, req.user.userId);

    res.json({ message: 'Character deleted successfully' });
  } catch (err: any) {
    if (err.message === 'Character not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

export default router;
