import React, { useState } from 'react';
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
import { AttributeDefinition } from '../store/systemSlice';

interface AttributeEditorProps {
  attributes: AttributeDefinition[];
  onChange: (attributes: AttributeDefinition[]) => void;
}

export const AttributeEditor: React.FC<AttributeEditorProps> = ({
  attributes,
  onChange,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    const newAttribute: AttributeDefinition = {
      id: '',
      name: '',
      abbreviation: '',
      type: 'numeric',
      min: 1,
      max: 20,
      default: 10,
    };
    onChange([...attributes, newAttribute]);
    setEditingIndex(attributes.length);
  };

  const handleUpdate = (index: number, field: keyof AttributeDefinition, value: any) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Attributes</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd}>
          Add Attribute
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Define the core attributes (ability scores) for your game system (e.g., Strength, Dexterity).
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Abbreviation</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Min</TableCell>
              <TableCell>Max</TableCell>
              <TableCell>Default</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attributes.map((attr, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    size="small"
                    value={attr.id}
                    onChange={(e) => handleUpdate(index, 'id', e.target.value)}
                    placeholder="strength"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={attr.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    placeholder="Strength"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={attr.abbreviation}
                    onChange={(e) => handleUpdate(index, 'abbreviation', e.target.value)}
                    placeholder="STR"
                    inputProps={{ maxLength: 3 }}
                  />
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={attr.type}
                      onChange={(e) => handleUpdate(index, 'type', e.target.value)}
                    >
                      <MenuItem value="numeric">Numeric</MenuItem>
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={attr.min || ''}
                    onChange={(e) => handleUpdate(index, 'min', parseInt(e.target.value) || undefined)}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={attr.max || ''}
                    onChange={(e) => handleUpdate(index, 'max', parseInt(e.target.value) || undefined)}
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type={attr.type === 'numeric' ? 'number' : 'text'}
                    value={attr.default}
                    onChange={(e) =>
                      handleUpdate(
                        index,
                        'default',
                        attr.type === 'numeric' ? parseInt(e.target.value) || 10 : e.target.value
                      )
                    }
                    sx={{ width: 70 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={attr.description || ''}
                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                    placeholder="Optional"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleDelete(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {attributes.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No attributes defined. Click "Add Attribute" to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
