import { Router, Request, Response } from 'express';
import { systemConfigService } from '../services/SystemConfigService.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

/**
 * GET /api/systems
 * Get all available RPG systems
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const systems = await systemConfigService.getAllSystems();
    return res.json(systems);
  } catch (error) {
    console.error('Error fetching systems:', error);
    return res.status(500).json({ error: 'Failed to fetch systems' });
  }
});

/**
 * GET /api/systems/:id
 * Get full system configuration by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const system = await systemConfigService.getSystemById(id);

    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    // Return full system config data
    const configData = system.getConfigData();
    return res.json({
      id: system.id,
      name: system.name,
      version: system.version,
      description: system.description,
      isDefault: system.is_default,
      config: configData,
    });
  } catch (error) {
    console.error('Error fetching system:', error);
    return res.status(500).json({ error: 'Failed to fetch system' });
  }
});

/**
 * GET /api/systems/:id/classes
 * Get classes for a system
 */
router.get('/:id/classes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const classes = await systemConfigService.getClasses(id);

    if (classes.length === 0) {
      const system = await systemConfigService.getSystemById(id);
      if (!system) {
        return res.status(404).json({ error: 'System not found' });
      }
    }

    return res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

/**
 * GET /api/systems/:id/races
 * Get races for a system
 */
router.get('/:id/races', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const races = await systemConfigService.getRaces(id);

    if (races.length === 0) {
      const system = await systemConfigService.getSystemById(id);
      if (!system) {
        return res.status(404).json({ error: 'System not found' });
      }
    }

    return res.json(races);
  } catch (error) {
    console.error('Error fetching races:', error);
    return res.status(500).json({ error: 'Failed to fetch races' });
  }
});

/**
 * GET /api/systems/:id/alignments
 * Get alignments for a system
 */
router.get('/:id/alignments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const alignments = await systemConfigService.getAlignments(id);

    if (alignments.length === 0) {
      const system = await systemConfigService.getSystemById(id);
      if (!system) {
        return res.status(404).json({ error: 'System not found' });
      }
    }

    return res.json(alignments);
  } catch (error) {
    console.error('Error fetching alignments:', error);
    return res.status(500).json({ error: 'Failed to fetch alignments' });
  }
});

/**
 * GET /api/systems/:id/attributes
 * Get attributes for a system
 */
router.get('/:id/attributes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attributes = await systemConfigService.getAttributes(id);

    if (attributes.length === 0) {
      const system = await systemConfigService.getSystemById(id);
      if (!system) {
        return res.status(404).json({ error: 'System not found' });
      }
    }

    return res.json(attributes);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return res.status(500).json({ error: 'Failed to fetch attributes' });
  }
});

/**
 * GET /api/systems/:id/skills
 * Get skills for a system
 */
router.get('/:id/skills', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const skills = await systemConfigService.getSkills(id);

    if (skills.length === 0) {
      const system = await systemConfigService.getSystemById(id);
      if (!system) {
        return res.status(404).json({ error: 'System not found' });
      }
    }

    return res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

/**
 * POST /api/systems
 * Create a new system configuration (admin only)
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, name, version, description, config } = req.body;

    if (!id || !name || !config) {
      return res.status(400).json({ error: 'Missing required fields: id, name, config' });
    }

    const system = await systemConfigService.createSystem(
      id,
      name,
      version || '1.0.0',
      config,
      description
    );

    return res.status(201).json({
      id: system.id,
      name: system.name,
      version: system.version,
      description: system.description,
      isDefault: system.is_default,
      config: system.getConfigData(),
    });
  } catch (error) {
    console.error('Error creating system:', error);
    return res.status(500).json({ error: 'Failed to create system' });
  }
});

/**
 * PUT /api/systems/:id
 * Update an existing system configuration (admin only)
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, version, description, config, is_active } = req.body;

    const existingSystem = await systemConfigService.getSystemById(id);
    if (!existingSystem) {
      return res.status(404).json({ error: 'System not found' });
    }

    // Prevent modification of default systems
    if (existingSystem.is_default) {
      return res.status(403).json({ error: 'Cannot modify default system configurations' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (version !== undefined) updateData.version = version;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.isActive = is_active;
    if (config !== undefined) updateData.configData = config;

    const updatedSystem = await systemConfigService.updateSystem(id, updateData);

    if (!updatedSystem) {
      return res.status(404).json({ error: 'System not found' });
    }

    return res.json({
      id: updatedSystem.id,
      name: updatedSystem.name,
      version: updatedSystem.version,
      description: updatedSystem.description,
      isDefault: updatedSystem.is_default,
      config: updatedSystem.getConfigData(),
    });
  } catch (error) {
    console.error('Error updating system:', error);
    return res.status(500).json({ error: 'Failed to update system' });
  }
});

/**
 * DELETE /api/systems/:id
 * Delete a system configuration (admin only)
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingSystem = await systemConfigService.getSystemById(id);
    if (!existingSystem) {
      return res.status(404).json({ error: 'System not found' });
    }

    // Prevent deletion of default systems
    if (existingSystem.is_default) {
      return res.status(403).json({ error: 'Cannot delete default system configurations' });
    }

    const success = await systemConfigService.deleteSystem(id);

    if (!success) {
      return res.status(404).json({ error: 'System not found' });
    }

    return res.json({ message: 'System deleted successfully' });
  } catch (error) {
    console.error('Error deleting system:', error);
    return res.status(500).json({ error: 'Failed to delete system' });
  }
});

/**
 * POST /api/systems/:id/export
 * Export a system configuration as JSON
 */
router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const system = await systemConfigService.getSystemById(id);

    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    const configData = system.getConfigData();
    const exportData = {
      id: system.id,
      name: system.name,
      version: system.version,
      description: system.description,
      author: configData.metadata.author,
      config: configData,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${system.id}-v${system.version}.json"`);
    return res.json(exportData);
  } catch (error) {
    console.error('Error exporting system:', error);
    return res.status(500).json({ error: 'Failed to export system' });
  }
});

/**
 * POST /api/systems/import
 * Import a system configuration from JSON (admin only)
 */
router.post('/import', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, name, version, description, config } = req.body;

    if (!id || !name || !config) {
      return res.status(400).json({ error: 'Invalid system configuration: missing required fields' });
    }

    // Check if system already exists
    const existingSystem = await systemConfigService.getSystemById(id);
    if (existingSystem) {
      return res.status(409).json({ error: 'System with this ID already exists' });
    }

    const system = await systemConfigService.createSystem(
      id,
      name,
      version || '1.0.0',
      config,
      description
    );

    return res.status(201).json({
      id: system.id,
      name: system.name,
      version: system.version,
      description: system.description,
      config: system.getConfigData(),
      message: 'System imported successfully',
    });
  } catch (error) {
    console.error('Error importing system:', error);
    return res.status(500).json({ error: 'Failed to import system' });
  }
});

export default router;
