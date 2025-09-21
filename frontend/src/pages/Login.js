/*   Projet : InvoAfrica
     @Auteur : NZIKO Felix Andre
     Email : tanzifelix@gmail.com
     version : beta 1.0 - Moderne

     Instagram : felix_tanzi
     GitHub : Felix-TANZI
     Linkedin : Felix TANZI */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  LogIn,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [particles, setParticles] = useState([]);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, loading } = useAuth();

  // Générer des particules animées
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          animationDelay: Math.random() * 10,
          size: Math.random() * 3 + 2
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoginSuccess(false);
      const result = await login(credentials);
      
      if (result) {
        setLoginSuccess(true);
        // Animation de succès pendant 1 seconde avant redirection
        setTimeout(() => {
          // La redirection sera gérée par le hook useAuth
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container modern">
      {/* Orbes flottants pour l'ambiance */}
      <div className="floating-orbs">
        <div className="orb"></div>
        <div className="orb"></div>
        <div className="orb"></div>
      </div>

      {/* Particules animées */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.animationDelay}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
          />
        ))}
      </div>

      <div className="login-card modern">
        <div className="login-header modern">
          <div className="logo-container">
            <div className="logo-icon modern">
              <TrendingUp size={32} />
              <div className="logo-sparkle">
                <Sparkles size={16} />
              </div>
            </div>
          </div>
          
          <h1>InvoAfrica</h1>
          <p>Gestion Financière Club GI</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form modern">
          <div className="form-group modern">
            <label htmlFor="email">Adresse Email</label>
            <div className="input-container modern">
              <Mail size={20} className="input-icon modern" />
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="form-input modern"
                placeholder="votre.email@exemple.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group modern">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-container modern">
              <Lock size={20} className="input-icon modern" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="form-input modern"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle modern"
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`login-button modern ${loginSuccess ? 'success' : ''}`}
          >
            {loading ? (
              <>
                <div className="login-spinner" />
                Connexion en cours...
              </>
            ) : loginSuccess ? (
              <>
                <Shield size={20} />
                Connexion réussie !
              </>
            ) : (
              <>
                <LogIn size={20} />
                Se connecter
                <Zap size={16} />
              </>
            )}
          </button>

          <div className="forgot-password">
            <a href="#forgot" onClick={(e) => e.preventDefault()}>
              Mot de passe oublié ?
            </a>
          </div>
        </form>
      </div>

      <div className="login-footer">
        <div className="version-info">
          InvoAfrica v1.0 • Club GI • 2024
        </div>
      </div>
    </div>
  );
};

export default Login;