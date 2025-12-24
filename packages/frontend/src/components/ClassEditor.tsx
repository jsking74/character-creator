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
import { ClassDefinition } from '../store/systemSlice';

interface ClassEditorProps {
  classes: ClassDefinition[];
  onChange: (classes: ClassDefinition[]) => void;
  attributeIds: string[];
}

export const ClassEditor: React.FC<ClassEditorProps> = ({
  classes,
  onChange,
  attributeIds,
}) => {
  const handleAdd = () => {
    const newClass: ClassDefinition = {
      id: '',
      name: '',
      hitDice: 'd6',
      primaryAbility: attributeIds[0] || '',
    };
    onChange([...classes, newClass]);
  };

  const handleUpdate = (index: number, field: keyof ClassDefinition, value: any) => {
    const updated = [...classes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(classes.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Classes</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Class
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Define the character classes available in your game system (e.g., Fighter, Wizard).
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Hit Dice</TableCell>
              <TableCell>Primary Ability</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((cls, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    size="small"
                    value={cls.id}
                    onChange={(e) => handleUpdate(index, 'id', e.target.value)}
                    placeholder="fighter"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={cls.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    placeholder="Fighter"
                  />
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={cls.hitDice}
                      onChange={(e) => handleUpdate(index, 'hitDice', e.target.value)}
                    >
                      <MenuItem value="d4">d4</MenuItem>
                      <MenuItem value="d6">d6</MenuItem>
                      <MenuItem value="d8">d8</MenuItem>
                      <MenuItem value="d10">d10</MenuItem>
                      <MenuItem value="d12">d12</MenuItem>
                      <MenuItem value="d20">d20</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={cls.primaryAbility}
                      onChange={(e) => handleUpdate(index, 'primaryAbility', e.target.value)}
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
                    value={cls.description || ''}
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
            {classes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No classes defined. Click "Add Class" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
