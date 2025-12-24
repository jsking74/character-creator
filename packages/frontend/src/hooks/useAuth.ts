import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { login, register, logout } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error, accessToken } = useSelector(
    (state: RootState) => state.auth
  );

  const handleLogin = async (email: string, password: string) => {
    return dispatch(login({ email, password }));
  };

  const handleRegister = async (email: string, password: string, displayName: string) => {
    return dispatch(register({ email, password, displayName }));
  };

  const handleLogout = async () => {
    return dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    accessToken,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
};
