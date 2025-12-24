import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/data-source.js';
import { Party } from '../models/Party.js';
import { Character } from '../models/Character.js';
import { PartyService } from '../services/PartyService.js';
import { authenticateToken } from '../middlewares/auth.js';
import {
  createPartySchema,
  updatePartySchema,
  addMemberSchema,
} from '../schemas/party.js';

const router = Router();

// Get services - lazy loaded to ensure DB is initialized
const getPartyService = () => {
  const partyRepository = AppDataSource.getRepository(Party);
  const characterRepository = AppDataSource.getRepository(Character);
  return new PartyService(partyRepository, characterRepository);
};

// Create a new party (protected)
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = createPartySchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const partyService = getPartyService();
    const party = await partyService.createParty(req.user.userId, value);

    res.status(201).json(partyService.exportAsJSON(party));
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get all parties for current user (protected)
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const partyService = getPartyService();
    const parties = await partyService.getPartiesByUserId(req.user.userId);

    res.json(parties.map(party => partyService.exportAsJSON(party)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get public parties (paginated)
router.get('/browse/public', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (limit < 1 || limit > 100) {
      res.status(400).json({ error: 'Limit must be between 1 and 100' });
      return;
    }

    const partyService = getPartyService();
    const parties = await partyService.getPublicParties(limit, offset);

    res.json(parties.map(party => partyService.exportAsJSON(party)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific party (protected - must be owner or public)
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const partyService = getPartyService();
    const party = await partyService.getPartyById(req.params.id, req.user?.userId);

    if (!party) {
      res.status(404).json({ error: 'Party not found' });
      return;
    }

    // Check access
    if (party.owner_id !== req.user?.userId && !party.is_public) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(partyService.exportAsJSON(party));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update party (protected - must be owner)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = updatePartySchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const partyService = getPartyService();
    const party = await partyService.updateParty(req.params.id, req.user.userId, value);

    res.json(partyService.exportAsJSON(party));
  } catch (err: any) {
    if (err.message === 'Party not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Delete party (protected - must be owner)
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const partyService = getPartyService();
    await partyService.deleteParty(req.params.id, req.user.userId);

    res.json({ message: 'Party deleted successfully' });
  } catch (err: any) {
    if (err.message === 'Party not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Add member to party (protected - must be owner)
router.post('/:id/members', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { error, value } = addMemberSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const partyService = getPartyService();
    const party = await partyService.addMember(req.params.id, req.user.userId, value.characterId);

    res.json(partyService.exportAsJSON(party));
  } catch (err: any) {
    if (err.message === 'Party not found' || err.message === 'Character not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// Remove member from party (protected - must be owner)
router.delete('/:id/members/:characterId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const partyService = getPartyService();
    const party = await partyService.removeMember(
      req.params.id,
      req.user.userId,
      req.params.characterId
    );

    res.json(partyService.exportAsJSON(party));
  } catch (err: any) {
    if (err.message === 'Party not found') {
      res.status(404).json({ error: err.message });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

export default router;
