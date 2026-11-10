import React, { useState } from 'react';
import AuthService from '../../api/authService';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await AuthService.login({ username, password });
      if (response.data.success) {
        onLogin(response.data);
      } else {
        setError('Identifiants incorrects.');
      }
    } catch (err) {
      setError(err.response?.status === 401
        ? 'Identifiants incorrects.'
        : 'Connexion impossible. Vérifiez le serveur puis réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">📦</div>
          <h1>Stock Manager</h1>
          <p>Gérez votre stock simplement et efficacement</p>
        </div>
        <div className="login-features">
          <div className="login-feature">
            <span>📊</span>
            <span>Tableau de bord en temps réel</span>
          </div>
          <div className="login-feature">
            <span>🛒</span>
            <span>Gestion des ventes rapide</span>
          </div>
          <div className="login-feature">
            <span>🖨️</span>
            <span>Impression de reçus automatique</span>
          </div>
          <div className="login-feature">
            <span>📈</span>
            <span>Rapports et statistiques</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Connexion</h2>
            <p>Entrez vos identifiants pour accéder à l'application</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="login-form">
            <div className="login-form-group">
              <label>Nom d'utilisateur</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">👤</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Entrez votre nom d'utilisateur"
                />
              </div>
            </div>

            <div className="login-form-group">
              <label>Mot de passe</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Entrez votre mot de passe"
                />
                <button
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
