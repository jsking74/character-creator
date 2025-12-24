import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  SelectChangeEvent,
  Skeleton,
} from '@mui/material';
import { useCharacter } from '../hooks/useCharacter';
import { useSystemWithAutoLoad } from '../hooks/useSystem';
import { useToast } from '../contexts/ToastContext';

interface CharacterFormProps {
  onSuccess?: () => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({ onSuccess }) => {
  const { createCharacter, loading: characterLoading, error, clearError } = useCharacter();
  const { showSuccess } = useToast();
  const {
    systems,
    selectedSystem,
    loading: systemLoading,
    loadSystem,
    getClasses,
    getRaces,
    getAlignments,
  } = useSystemWithAutoLoad();

  const [formData, setFormData] = useState({
    name: '',
    system: '',
    class: '',
    race: '',
    level: 1,
    alignment: '',
  });

  // Load default system on initial load
  useEffect(() => {
    if (systems.length > 0 && !formData.system) {
      const defaultSystem = systems.find((s) => s.isDefault) || systems[0];
      setFormData((prev) => ({ ...prev, system: defaultSystem.id }));
      loadSystem(defaultSystem.id);
    }
  }, [systems, formData.system, loadSystem]);

  // Update form when system config loads
  useEffect(() => {
    if (selectedSystem) {
      const classes = getClasses();
      const races = getRaces();
      const alignments = getAlignments();

      setFormData((prev) => ({
        ...prev,
        class: classes.length > 0 ? classes[0].name : '',
        race: races.length > 0 ? races[0].name : '',
        alignment: alignments.length > 0 ? alignments[0].name : '',
      }));
    }
  }, [selectedSystem, getClasses, getRaces, getAlignments]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSystemChange = async (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      system: value,
      class: '',
      race: '',
      alignment: '',
    }));
    await loadSystem(value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      // Get attribute defaults from system config
      const attributes = selectedSystem?.config?.attributes || [];
      const defaultAttributes: Record<string, number> = {};
      attributes.forEach((attr) => {
        defaultAttributes[attr.id] = typeof attr.default === 'number' ? attr.default : 10;
      });

      // Construct nested character_data structure
      const characterPayload = {
        name: formData.name,
        system_id: formData.system,
        character_data: {
          basics: {
            race: formData.race,
            class: formData.class,
            level: formData.level,
            experience: 0,
            alignment: formData.alignment,
          },
          attributes: defaultAttributes,
          hitPoints: {
            current: 10,
            maximum: 10,
            temporary: 0,
          },
          skills: {},
          proficiencies: {
            skills: [],
            weapons: [],
            armor: [],
          },
          equipment: {
            weapons: [],
            armor: [],
            backpack: [],
          },
          spells: {
            prepared: [],
          },
          traits: {
            features: [],
          },
          backstory: {},
          currency: {
            platinum: 0,
            gold: 0,
            electrum: 0,
            silver: 0,
            copper: 0,
          },
        },
      };

      await createCharacter(characterPayload).unwrap();
      showSuccess(`Character "${formData.name}" created successfully!`);

      // Reset form
      const classes = getClasses();
      const races = getRaces();
      const alignments = getAlignments();

      setFormData({
        name: '',
        system: formData.system,
        class: classes.length > 0 ? classes[0].name : '',
        race: races.length > 0 ? races[0].name : '',
        level: 1,
        alignment: alignments.length > 0 ? alignments[0].name : '',
      });
      onSuccess?.();
    } catch {
      // Error is handled by Redux state
    }
  };

  const classes = getClasses();
  const races = getRaces();
  const alignments = getAlignments();
  const loading = characterLoading || systemLoading;

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom>
        Create New Character
      </Typography>

      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Character Name"
          name="name"
          value={formData.name}
          onChange={handleTextChange}
          required
          fullWidth
          disabled={loading}
        />

        <FormControl fullWidth disabled={loading}>
          <InputLabel>RPG System</InputLabel>
          {systemLoading && systems.length === 0 ? (
            <Skeleton variant="rectangular" height={56} />
          ) : (
            <Select
              name="system"
              value={formData.system}
              onChange={handleSystemChange}
              label="RPG System"
            >
              {systems.map((sys) => (
                <MenuItem key={sys.id} value={sys.id}>
                  {sys.name}
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>

        <FormControl fullWidth disabled={loading || !selectedSystem}>
          <InputLabel>Class</InputLabel>
          {systemLoading ? (
            <Skeleton variant="rectangular" height={56} />
          ) : (
            <Select
              name="class"
              value={formData.class}
              onChange={handleSelectChange}
              label="Class"
            >
              {classes.map((cls) => (
                <MenuItem key={cls.id} value={cls.name}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>

        <FormControl fullWidth disabled={loading || !selectedSystem}>
          <InputLabel>Race</InputLabel>
          {systemLoading ? (
            <Skeleton variant="rectangular" height={56} />
          ) : (
            <Select
              name="race"
              value={formData.race}
              onChange={handleSelectChange}
              label="Race"
            >
              {races.map((race) => (
                <MenuItem key={race.id} value={race.name}>
                  {race.name}
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Level"
              name="level"
              type="number"
              value={formData.level}
              onChange={handleNumberChange}
              fullWidth
              disabled={loading}
              inputProps={{ min: 1, max: 20 }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth disabled={loading || !selectedSystem}>
              <InputLabel>Alignment</InputLabel>
              {systemLoading ? (
                <Skeleton variant="rectangular" height={56} />
              ) : (
                <Select
                  name="alignment"
                  value={formData.alignment}
                  onChange={handleSelectChange}
                  label="Alignment"
                >
                  {alignments.map((align) => (
                    <MenuItem key={align.id} value={align.name}>
                      {align.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || !formData.name.trim() || !selectedSystem}
        >
          {characterLoading ? <CircularProgress size={24} /> : 'Create Character'}
        </Button>
      </Box>
    </Paper>
  );
};
