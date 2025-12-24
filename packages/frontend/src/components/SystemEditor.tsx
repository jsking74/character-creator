import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  SystemConfigData,
  AttributeDefinition,
  ClassDefinition,
  RaceDefinition,
  SkillDefinition,
  AlignmentDefinition,
  CurrencyDefinition,
} from '../store/systemSlice';
import { AttributeEditor } from './AttributeEditor';
import { ClassEditor } from './ClassEditor';
import { RaceEditor } from './RaceEditor';
import { SkillEditor } from './SkillEditor';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SystemEditorProps {
  systemId?: string;
  initialData?: {
    id: string;
    name: string;
    version: string;
    description?: string;
    config: SystemConfigData;
  };
  onSave: (data: {
    id: string;
    name: string;
    version: string;
    description?: string;
    config: SystemConfigData;
  }) => Promise<void>;
  onCancel: () => void;
}

export const SystemEditor: React.FC<SystemEditorProps> = ({
  systemId,
  initialData,
  onSave,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Basic metadata
  const [id, setId] = useState(initialData?.id || '');
  const [name, setName] = useState(initialData?.name || '');
  const [version, setVersion] = useState(initialData?.version || '1.0.0');
  const [description, setDescription] = useState(initialData?.description || '');
  const [author, setAuthor] = useState(initialData?.config.metadata.author || '');

  // Configuration data
  const [attributes, setAttributes] = useState<AttributeDefinition[]>(
    initialData?.config.attributes || []
  );
  const [classes, setClasses] = useState<ClassDefinition[]>(
    initialData?.config.classes || []
  );
  const [races, setRaces] = useState<RaceDefinition[]>(
    initialData?.config.races || []
  );
  const [skills, setSkills] = useState<SkillDefinition[]>(
    initialData?.config.skills || []
  );
  const [alignments, setAlignments] = useState<AlignmentDefinition[]>(
    initialData?.config.alignments || []
  );
  const [currencies, setCurrencies] = useState<CurrencyDefinition[]>(
    initialData?.config.currencies || []
  );

  // Formulas
  const [abilityModifierFormula, setAbilityModifierFormula] = useState(
    initialData?.config.formulas.abilityModifier || 'floor((score - 10) / 2)'
  );
  const [proficiencyBonusFormula, setProficiencyBonusFormula] = useState(
    initialData?.config.formulas.proficiencyBonus || 'ceil(level / 4) + 1'
  );

  const handleSave = async () => {
    // Validation
    if (!id || !name) {
      setError('System ID and name are required');
      return;
    }

    if (attributes.length === 0) {
      setError('At least one attribute is required');
      return;
    }

    if (classes.length === 0) {
      setError('At least one class is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const configData: SystemConfigData = {
        metadata: {
          name,
          version,
          description,
          author,
        },
        attributes,
        classes,
        races,
        skills,
        alignments,
        currencies,
        formulas: {
          abilityModifier: abilityModifierFormula,
          proficiencyBonus: proficiencyBonusFormula,
        },
      };

      await onSave({
        id,
        name,
        version,
        description,
        config: configData,
      });

      navigate('/systems');
    } catch (err: any) {
      setError(err.message || 'Failed to save system');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {systemId ? 'Edit System Configuration' : 'Create New System Configuration'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="System ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
          disabled={!!systemId}
          helperText="Unique identifier (e.g., 'd&d5e', 'pathfinder2e')"
          sx={{ mb: 2 }}
          required
        />
        <TextField
          fullWidth
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          required
        />
        <TextField
          fullWidth
          label="Version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Attributes" />
          <Tab label="Classes" />
          <Tab label="Races" />
          <Tab label="Skills" />
          <Tab label="Alignments" />
          <Tab label="Currencies" />
          <Tab label="Formulas" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <AttributeEditor attributes={attributes} onChange={setAttributes} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ClassEditor classes={classes} onChange={setClasses} attributeIds={attributes.map(a => a.id)} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <RaceEditor races={races} onChange={setRaces} attributeIds={attributes.map(a => a.id)} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <SkillEditor skills={skills} onChange={setSkills} attributeIds={attributes.map(a => a.id)} />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Alignments
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Define the moral and ethical alignments available in your system.
          </Typography>
          {/* Simple list editor for alignments */}
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Alignments (JSON)"
            value={JSON.stringify(alignments, null, 2)}
            onChange={(e) => {
              try {
                setAlignments(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            helperText="Edit as JSON array"
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Currencies
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Define the currency types and their conversion rates.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Currencies (JSON)"
            value={JSON.stringify(currencies, null, 2)}
            onChange={(e) => {
              try {
                setCurrencies(JSON.parse(e.target.value));
              } catch (err) {
                // Invalid JSON, don't update
              }
            }}
            helperText="Edit as JSON array"
          />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Calculation Formulas
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Define mathematical formulas for game mechanics.
          </Typography>
          <TextField
            fullWidth
            label="Ability Modifier Formula"
            value={abilityModifierFormula}
            onChange={(e) => setAbilityModifierFormula(e.target.value)}
            helperText="Variables: score"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Proficiency Bonus Formula"
            value={proficiencyBonusFormula}
            onChange={(e) => setProficiencyBonusFormula(e.target.value)}
            helperText="Variables: level"
          />
        </Box>
      </TabPanel>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save System'}
        </Button>
      </Box>
    </Paper>
  );
};
