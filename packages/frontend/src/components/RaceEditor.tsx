import React from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { RaceDefinition } from '../store/systemSlice';

interface RaceEditorProps {
  races: RaceDefinition[];
  onChange: (races: RaceDefinition[]) => void;
  attributeIds: string[];
}

export const RaceEditor: React.FC<RaceEditorProps> = ({
  races,
  onChange,
}) => {
  const handleAdd = () => {
    const newRace: RaceDefinition = {
      id: '',
      name: '',
      size: 'Medium',
      speed: 30,
    };
    onChange([...races, newRace]);
  };

  const handleUpdate = (index: number, field: keyof RaceDefinition, value: any) => {
    const updated = [...races];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(races.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Races</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Race
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Define the races or ancestries available in your game system (e.g., Elf, Dwarf).
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Speed</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Ability Bonuses (JSON)</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {races.map((race, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    size="small"
                    value={race.id}
                    onChange={(e) => handleUpdate(index, 'id', e.target.value)}
                    placeholder="elf"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={race.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    placeholder="Elf"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={race.size}
                    onChange={(e) => handleUpdate(index, 'size', e.target.value)}
                    placeholder="Medium"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={race.speed}
                    onChange={(e) => handleUpdate(index, 'speed', parseInt(e.target.value) || 30)}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    multiline
                    value={race.description || ''}
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    placeholder="Optional"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    multiline
                    rows={2}
                    value={JSON.stringify(race.abilityBonuses || [])}
                    onChange={(e) => {
                      try {
                        const bonuses = JSON.parse(e.target.value);
                        handleUpdate(index, 'abilityBonuses', bonuses);
                      } catch (err) {
                        // Invalid JSON, don't update
                      }
                    }}
                    placeholder='[{"attribute":"dexterity","bonus":2}]'
                    sx={{ minWidth: 200 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {races.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No races defined. Click "Add Race" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
