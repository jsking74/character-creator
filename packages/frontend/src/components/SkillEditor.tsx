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
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { SkillDefinition } from '../store/systemSlice';

interface SkillEditorProps {
  skills: SkillDefinition[];
  onChange: (skills: SkillDefinition[]) => void;
  attributeIds: string[];
}

export const SkillEditor: React.FC<SkillEditorProps> = ({
  skills,
  onChange,
  attributeIds,
}) => {
  const handleAdd = () => {
    const newSkill: SkillDefinition = {
      id: '',
      name: '',
      ability: attributeIds[0] || '',
    };
    onChange([...skills, newSkill]);
  };

  const handleUpdate = (index: number, field: keyof SkillDefinition, value: any) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Skills</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Skill
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Define the skills available in your game system (e.g., Athletics, Stealth).
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Linked Ability</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {skills.map((skill, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    size="small"
                    value={skill.id}
                    onChange={(e) => handleUpdate(index, 'id', e.target.value)}
                    placeholder="athletics"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={skill.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    placeholder="Athletics"
                  />
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={skill.ability}
                      onChange={(e) => handleUpdate(index, 'ability', e.target.value)}
                    >
                      {attributeIds.map((attrId) => (
                        <MenuItem key={attrId} value={attrId}>
                          {attrId}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    multiline
                    value={skill.description || ''}
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    placeholder="Optional description"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {skills.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No skills defined. Click "Add Skill" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
