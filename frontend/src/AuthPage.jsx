// frontend/src/AuthPage.jsx
// Versión: 2.5 - Corrección Final de Estilos y Posicionamiento
// TAREA: Se ajusta la estructura HTML para alinear el botón de ver contraseña.

import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import styles from './AuthPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const GoogleIcon = () => (
  <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.16c1.63 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setMessage('Conectando con Google...');
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const idToken = await result.user.getIdToken();
        const response = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error en la autenticación con el servidor de EnlaPet.');
        }
        setMessage('');
    } catch (error) {
        let errorMessage = 'Ocurrió un error con el inicio de sesión de Google.';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Ventana de Google cerrada antes de finalizar.';
        }
        console.error("Error en Google Sign-In:", error);
        setMessage(`Error: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Registrando...');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al registrar.');
      }
      setMessage('¡Usuario registrado con éxito! Por favor, inicia sesión.');
      setView('login');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Iniciando sesión...');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setMessage('');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!formData.email) {
        setMessage('Por favor, ingresa tu correo electrónico.');
        return;
    }
    setIsLoading(true);
    setMessage('Enviando enlace de restablecimiento...');
    try {
        await sendPasswordResetEmail(auth, formData.email);
        setMessage('¡Enlace enviado! Revisa tu correo electrónico (incluida la carpeta de spam).');
    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <h2>Iniciar Sesión con Email</h2>
            <form onSubmit={handleLogin}>
              <div className={sharedStyles.formGroup}><label htmlFor="email">Email:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} /></div>
              {/* --- ESTRUCTURA CORREGIDA --- */}
              <div className={sharedStyles.formGroup}>
                <label htmlFor="password">Contraseña:</label>
                <div className={styles.passwordInputWrapper}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
                  <button type="button" className={styles.passwordToggleButton} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
              </div>
              <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Verificando...' : 'Iniciar Sesión'}</button>
            </form>
            <button className={sharedStyles.linkButton} onClick={() => setView('forgot-password')} disabled={isLoading}>Olvidé mi contraseña</button>
          </>
        );
      case 'register':
        return (
          <>
            <h2>Registrarse con Email</h2>
            <form onSubmit={handleRegister}>
              <div className={sharedStyles.formGroup}><label htmlFor="name">Nombre:</label><input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} /></div>
              <div className={sharedStyles.formGroup}><label htmlFor="email">Email:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} /></div>
              {/* --- ESTRUCTURA CORREGIDA --- */}
              <div className={sharedStyles.formGroup}>
                <label htmlFor="password">Contraseña:</label>
                <div className={styles.passwordInputWrapper}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength="6" disabled={isLoading} />
                  <button type="button" className={styles.passwordToggleButton} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
              </div>
              <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Creando cuenta...' : 'Registrarse'}</button>
            </form>
          </>
        );
      case 'forgot-password':
        return (
            <>
              <h2>Restablecer Contraseña</h2>
              <form onSubmit={handlePasswordReset}>
                <p className={styles.formDescription}>Ingresa tu correo y te enviaremos un enlace para que puedas restablecer tu contraseña.</p>
                <div className={sharedStyles.formGroup}><label htmlFor="email">Email:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} /></div>
                <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Enviando...' : 'Enviar Enlace'}</button>
              </form>
            </>
        );
      default: return null;
    }
  };

  return (
    <div className={styles.pageContainer}>
        <div className={styles.authContainer}>
            <h1 className={styles.brandTitle}>Bienvenido a EnlaPet</h1>
            <p className={styles.brandSubtitle}>La red social para tu mejor amigo.</p>
            <button className={styles.googleBtn} onClick={handleGoogleSignIn} disabled={isLoading}><GoogleIcon />Continuar con Google</button>
            <div className={styles.divider}>o</div>
            {renderForm()}
            <div className={styles.toggleViewText}>
              {view === 'login' && (<p>¿No tienes cuenta? <button className={sharedStyles.linkButton} onClick={() => setView('register')} disabled={isLoading}>Regístrate</button></p>)}
              {(view === 'register' || view === 'forgot-password') && (<p>¿Ya tienes cuenta? <button className={sharedStyles.linkButton} onClick={() => setView('login')} disabled={isLoading}>Inicia Sesión</button></p>)}
            </div>
            {message && <p className={sharedStyles.responseMessage}>{message}</p>}
        </div>
    </div>
  );
}

export default AuthPage;