import { useNavigate } from 'react-router-dom';
import { RegistrationForm } from '../components/RegistrationForm';

export const RegisterPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return <RegistrationForm onSuccess={handleSuccess} />;
};
