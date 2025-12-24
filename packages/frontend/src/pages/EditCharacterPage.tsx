import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useCharacter } from '../hooks/useCharacter';

const CHARACTER_CLASSES = {
  'd&d5e': ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'],
  'pathfinder': ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Summoner', 'Wizard'],
  'pathfinder2e': ['Alchemist', 'Barbarian', 'Bard', 'Champion', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard'],
};

const CHARACTER_RACES = [
  'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 'Halfling', 'Human', 'Tiefling'
];

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

interface FormData {
  name: string;
  class: string;
  race: string;
  level: number;
  alignment: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  max_hit_points: number;
  current_hit_points: number;
  temporary_hit_points: number;
  background: string;
  backstory: string;
  gold: number;
  is_public: boolean;
}

export const EditCharacterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCharacter, loading, error, fetchCharacterById, updateCharacter } = useCharacter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    class: '',
    race: '',
    level: 1,
    alignment: '',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    max_hit_points: 10,
    current_hit_points: 10,
    temporary_hit_points: 0,
    background: '',
    backstory: '',
    gold: 0,
    is_public: false,
  });

  useEffect(() => {
    if (id) {
      fetchCharacterById(id);
    }
  }, [id]);

  useEffect(() => {
    if (selectedCharacter) {
      setFormData({
        name: selectedCharacter.name,
        class: selectedCharacter.class,
        race: selectedCharacter.race,
        level: selectedCharacter.level,
        alignment: selectedCharacter.alignment || '',
        strength: selectedCharacter.abilityScores.strength,
        dexterity: selectedCharacter.abilityScores.dexterity,
        constitution: selectedCharacter.abilityScores.constitution,
        intelligence: selectedCharacter.abilityScores.intelligence,
        wisdom: selectedCharacter.abilityScores.wisdom,
        charisma: selectedCharacter.abilityScores.charisma,
        max_hit_points: selectedCharacter.health.maxHitPoints,
        current_hit_points: selectedCharacter.health.currentHitPoints,
        temporary_hit_points: selectedCharacter.health.temporaryHitPoints,
        background: selectedCharacter.background || '',
        backstory: selectedCharacter.backstory || '',
        gold: selectedCharacter.gold,
        is_public: selectedCharacter.isPublic,
      });
    }
  }, [selectedCharacter]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    setSaveSuccess(false);
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Construct nested character_data structure for update
      const updatePayload = {
        name: formData.name,
        is_public: formData.is_public,
        character_data: {
          basics: {
            race: formData.race,
            class: formData.class,
            level: formData.level,
            alignment: formData.alignment,
            background: formData.background,
          },
          attributes: {
            strength: formData.strength,
            dexterity: formData.dexterity,
            constitution: formData.constitution,
            intelligence: formData.intelligence,
            wisdom: formData.wisdom,
            charisma: formData.charisma,
          },
          hitPoints: {
            current: formData.current_hit_points,
            maximum: formData.max_hit_points,
            temporary: formData.temporary_hit_points,
          },
          backstory: {
            description: formData.backstory,
          },
          currency: {
            gold: formData.gold,
            platinum: 0,
            electrum: 0,
            silver: 0,
            copper: 0,
          },
        },
      };

      await updateCharacter(id, updatePayload).unwrap();
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const systemClasses = selectedCharacter
    ? CHARACTER_CLASSES[selectedCharacter.system as keyof typeof CHARACTER_CLASSES] || []
    : [];

  if (loading && !selectedCharacter) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/characters')}>
          Back to Characters
        </Button>
      </Container>
    );
  }

  if (!selectedCharacter) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Character not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/characters')} sx={{ mt: 2 }}>
          Back to Characters
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3
      }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/characters/${id}`)} sx={{ minHeight: 44 }}>
          Back to Character
        </Button>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, textAlign: { xs: 'center', sm: 'right' } }}>
          Editing: {selectedCharacter.name}
        </Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(false)}>
          Character saved successfully!
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Character Name"
                name="name"
                value={formData.name}
                onChange={handleTextChange}
                fullWidth
                required
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="System"
                value={selectedCharacter.system}
                fullWidth
                disabled
                helperText="System cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Class</InputLabel>
                <Select
                  name="class"
                  value={formData.class}
                  onChange={handleSelectChange}
                  label="Class"
                >
                  {systemClasses.map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      {cls}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Race</InputLabel>
                <Select
                  name="race"
                  value={formData.race}
                  onChange={handleSelectChange}
                  label="Race"
                >
                  {CHARACTER_RACES.map((race) => (
                    <MenuItem key={race} value={race}>
                      {race}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Level"
                name="level"
                type="number"
                value={formData.level}
                onChange={handleNumberChange}
                fullWidth
                disabled={saving}
                inputProps={{ min: 1, max: 20 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Alignment</InputLabel>
                <Select
                  name="alignment"
                  value={formData.alignment}
                  onChange={handleSelectChange}
                  label="Alignment"
                >
                  {ALIGNMENTS.map((align) => (
                    <MenuItem key={align} value={align}>
                      {align}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Background"
                name="background"
                value={formData.background}
                onChange={handleTextChange}
                fullWidth
                disabled={saving}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Ability Scores */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ability Scores
          </Typography>
          <Grid container spacing={2}>
            {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((ability) => (
              <Grid item xs={6} sm={4} md={2} key={ability}>
                <TextField
                  label={ability.charAt(0).toUpperCase() + ability.slice(1)}
                  name={ability}
                  type="number"
                  value={formData[ability as keyof FormData]}
                  onChange={handleNumberChange}
                  fullWidth
                  disabled={saving}
                  inputProps={{ min: 1, max: 30 }}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Health & Resources */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Health & Resources
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Max HP"
                name="max_hit_points"
                type="number"
                value={formData.max_hit_points}
                onChange={handleNumberChange}
                fullWidth
                disabled={saving}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Current HP"
                name="current_hit_points"
                type="number"
                value={formData.current_hit_points}
                onChange={handleNumberChange}
                fullWidth
                disabled={saving}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Temp HP"
                name="temporary_hit_points"
                type="number"
                value={formData.temporary_hit_points}
                onChange={handleNumberChange}
                fullWidth
                disabled={saving}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                label="Gold"
                name="gold"
                type="number"
                value={formData.gold}
                onChange={handleNumberChange}
                fullWidth
                disabled={saving}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Backstory */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Backstory
          </Typography>
          <TextField
            name="backstory"
            value={formData.backstory}
            onChange={handleTextChange}
            fullWidth
            multiline
            rows={6}
            disabled={saving}
            placeholder="Write your character's backstory here..."
          />
        </Paper>

        {/* Settings */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                name="is_public"
                checked={formData.is_public}
                onChange={handleSwitchChange}
                disabled={saving}
              />
            }
            label="Make this character public (visible to other users)"
          />
        </Paper>

        {/* Save Button */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'flex-end',
          gap: 2
        }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/characters/${id}`)}
            disabled={saving}
            sx={{ minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
            sx={{ minHeight: 44 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
