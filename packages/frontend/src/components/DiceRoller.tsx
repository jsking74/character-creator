import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Collapse,
  ButtonGroup,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClearIcon from '@mui/icons-material/Clear';
import {
  DiceRoll,
  roll,
  rollDice,
  rollWithAdvantage,
  rollWithDisadvantage,
  COMMON_DICE,
  formatModifier,
  calculateAbilityModifier,
} from '../utils/diceRoller';

interface DiceRollerProps {
  /** Optional ability scores for quick ability checks */
  abilityScores?: {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
  };
  /** Optional callback when a roll is made */
  onRoll?: (roll: DiceRoll) => void;
  /** Compact mode for embedding in sidebars */
  compact?: boolean;
}

const MAX_HISTORY = 10;

export const DiceRoller: React.FC<DiceRollerProps> = ({
  abilityScores,
  onRoll,
  compact = false,
}) => {
  const [customDice, setCustomDice] = useState('1d20');
  const [history, setHistory] = useState<DiceRoll[]>([]);
  const [expanded, setExpanded] = useState(!compact);
  const [error, setError] = useState<string | null>(null);

  const addToHistory = useCallback(
    (diceRoll: DiceRoll) => {
      setHistory((prev) => [diceRoll, ...prev].slice(0, MAX_HISTORY));
      onRoll?.(diceRoll);
    },
    [onRoll]
  );

  const handleRoll = useCallback(
    (notation: string) => {
      setError(null);
      const result = roll(notation);
      if (result) {
        addToHistory(result);
      } else {
        setError('Invalid dice notation');
      }
    },
    [addToHistory]
  );

  const handleCustomRoll = () => {
    handleRoll(customDice);
  };

  const handleAbilityCheck = (abilityName: string, score: number) => {
    const modifier = calculateAbilityModifier(score);
    const result = rollDice({ count: 1, sides: 20, modifier });
    result.dice = `${abilityName} (${formatModifier(modifier)})`;
    addToHistory(result);
  };

  const handleAdvantage = (modifier: number = 0) => {
    const result = rollWithAdvantage(modifier);
    addToHistory(result);
  };

  const handleDisadvantage = (modifier: number = 0) => {
    const result = rollWithDisadvantage(modifier);
    addToHistory(result);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const latestRoll = history[0];

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: expanded ? 2 : 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CasinoIcon color="primary" />
            <Typography variant="h6">Dice Roller</Typography>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {/* Quick Dice Buttons */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
            {COMMON_DICE.map((die) => (
              <Button
                key={die.notation}
                variant="outlined"
                size="small"
                onClick={() => handleRoll(die.notation)}
                sx={{ minWidth: 50 }}
              >
                {die.label}
              </Button>
            ))}
          </Stack>

          {/* Custom Dice Input */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              value={customDice}
              onChange={(e) => setCustomDice(e.target.value)}
              placeholder="e.g., 2d6+3"
              error={!!error}
              helperText={error}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomRoll()}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" onClick={handleCustomRoll} startIcon={<CasinoIcon />}>
              Roll
            </Button>
          </Box>

          {/* Advantage/Disadvantage */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              d20 Special Rolls:
            </Typography>
            <ButtonGroup size="small">
              <Button onClick={() => handleAdvantage(0)}>Advantage</Button>
              <Button onClick={() => handleDisadvantage(0)}>Disadvantage</Button>
            </ButtonGroup>
          </Box>

          {/* Ability Checks (if ability scores provided) */}
          {abilityScores && Object.keys(abilityScores).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ability Checks:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {Object.entries(abilityScores).map(
                  ([ability, score]) =>
                    score !== undefined && (
                      <Tooltip
                        key={ability}
                        title={`${ability}: ${score} (${formatModifier(calculateAbilityModifier(score))})`}
                      >
                        <Chip
                          label={ability.slice(0, 3).toUpperCase()}
                          onClick={() => handleAbilityCheck(ability, score)}
                          variant="outlined"
                          size="small"
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    )
                )}
              </Stack>
            </Box>
          )}
        </Collapse>

        {/* Latest Roll Display */}
        {latestRoll && (
          <Paper
            elevation={2}
            sx={{
              p: 2,
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="h3" component="div">
              {latestRoll.total}
            </Typography>
            <Typography variant="body2">
              {latestRoll.dice}: [{latestRoll.rolls.join(', ')}]
              {latestRoll.modifier !== 0 && ` ${formatModifier(latestRoll.modifier)}`}
            </Typography>
          </Paper>
        )}

        {/* Roll History */}
        <Collapse in={expanded && history.length > 1}>
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                History
              </Typography>
              <IconButton size="small" onClick={clearHistory}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
            <Stack spacing={0.5}>
              {history.slice(1).map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    py: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <span>{item.dice}</span>
                  <span>
                    <strong>{item.total}</strong> [{item.rolls.join(', ')}]
                  </span>
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default DiceRoller;
