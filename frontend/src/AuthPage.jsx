import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Iconos ---
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);
const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.657-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.012,36.49,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

function AuthPage() {
  const [view, setView] = useState('login'); 
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFormData({ name: '', email: '', password: '' });
    setMessage('');
    setShowPassword(false);
  }, [view]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    // ... (lógica de registro sin cambios)
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    // ... (lógica de inicio de sesión sin cambios)
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    // ... (lógica de restablecer contraseña sin cambios)
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage('Conectando con Google...');
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const idToken = await user.getIdToken(true);

        const response = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken })
        });

        if (!response.ok) {
            throw new Error('No se pudo verificar la sesión con el servidor.');
        }
        setMessage('');

    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <h1>Iniciar Sesión</h1>
            <button className="google-signin-button" onClick={handleGoogleSignIn} disabled={isLoading}>
                <GoogleIcon />
                Continuar con Google
            </button>
            <div className="auth-separator"><span>o</span></div>
            <form onSubmit={handleLogin} className="register-form no-background">
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="form-group password-group">
                <label htmlFor="password">Contraseña:</label>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
                <button type="button" className="password-toggle-button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
              </button>
            </form>
            <div className="auth-links">
                <button className="link-button" onClick={() => setView('forgot-password')} disabled={isLoading}>Olvidé mi contraseña</button>
                <p>¿No tienes cuenta? <button className="link-button" onClick={() => setView('register')} disabled={isLoading}>Regístrate</button></p>
            </div>
          </>
        );
      case 'register':
        return (
          <>
            <h1>Crear Cuenta</h1>
            <button className="google-signin-button" onClick={handleGoogleSignIn} disabled={isLoading}>
                <GoogleIcon />
                Continuar con Google
            </button>
            <div className="auth-separator"><span>o</span></div>
            <form onSubmit={handleRegister} className="register-form no-background">
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div className="form-group password-group">
                <label htmlFor="password">Contraseña:</label>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength="6" disabled={isLoading} />
                <button type="button" className="password-toggle-button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
            <p>¿Ya tienes cuenta? <button className="link-button" onClick={() => setView('login')} disabled={isLoading}>Inicia Sesión</button></p>
          </>
        );
      case 'forgot-password':
        return (
            <>
              <h1>Restablecer Contraseña</h1>
              <form onSubmit={handlePasswordReset} className="register-form">
                <p className="form-description">Ingresa tu correo y te enviaremos un enlace para que puedas restablecer tu contraseña.</p>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
                </div>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </form>
              <button className="link-button" onClick={() => setView('login')} disabled={isLoading}>Volver a Iniciar Sesión</button>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <header className="App-header">
      <div className="auth-card">
        {renderContent()}
        {message && <p className="response-message">{message}</p>}
      </div>
    </header>
  );
}

export default AuthPage;
