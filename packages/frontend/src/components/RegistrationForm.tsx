import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Link,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.displayName) {
      errors.displayName = 'Display name is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await register(formData.email, formData.password, formData.displayName);

    if (!result.payload || result.type.endsWith('rejected')) {
      return;
    }

    onSuccess?.();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <h2 style={{ textAlign: 'center', marginTop: 0 }}>Create Account</h2>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                disabled={isLoading}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />

              <TextField
                label="Display Name"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                fullWidth
                disabled={isLoading}
                error={!!validationErrors.displayName}
                helperText={validationErrors.displayName}
              />

              <TextField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                disabled={isLoading}
                error={!!validationErrors.password}
                helperText={validationErrors.password}
              />

              <TextField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                disabled={isLoading}
                error={!!validationErrors.confirmPassword}
                helperText={validationErrors.confirmPassword}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <span>Already have an account? </span>
            <Link href="/login" underline="hover">
              Sign in
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
