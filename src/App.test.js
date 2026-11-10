import { render, screen } from '@testing-library/react';
import LoginPage from './pages/login/LoginPage';

test('affiche le formulaire de connexion Stock Manager', () => {
  render(<LoginPage onLogin={() => {}} />);
  expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
});
