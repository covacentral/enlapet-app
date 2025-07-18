import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword,
  sendPasswordResetEmail // <--- 1. IMPORTAMOS LA FUNCIÓN NECESARIA
} from "firebase/auth";
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Iconos para visualizar la contraseña ---
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


// --- DATOS CURIOSOS (Sin cambios aquí) ---
const loadingFacts = [
    "¿Sabías que Laika fue el primer ser vivo en orbitar la Tierra?",
    "Hachiko, un perro Akita, esperó a su dueño por más de 9 años tras su muerte.",
    "Buscando en los archivos de mascotas famosas...",
    "Cher Ami, una paloma mensajera, salvó a casi 200 soldados en la I Guerra Mundial.",
    "Ajustando los collares del tiempo...",
    "Balto, un husky, lideró una expedición para llevar medicinas a un pueblo de Alaska.",
    "Pulimos tu placa con la historia de las mascotas..."
];

function AuthPage() {
  // 2. AÑADIMOS ESTADO PARA LA VISTA Y VISIBILIDAD DE CONTRASEÑA
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

  // --- (Sin cambios en handleRegister) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Registrando...');
    let initialTimeout;
    let factIntervalId;
    initialTimeout = setTimeout(() => {
        setMessage('Un momento, estamos creando tu perfil en la base de datos...');
    }, 7000);
    const startFactsTimeout = setTimeout(() => {
        let factIndex = 0;
        setMessage(loadingFacts[factIndex]);
        factIntervalId = setInterval(() => {
            factIndex = (factIndex + 1) % loadingFacts.length;
            setMessage(loadingFacts[factIndex]);
        }, 8000);
    }, 15000);
    const clearAllTimers = () => {
        clearTimeout(initialTimeout);
        clearTimeout(startFactsTimeout);
        clearInterval(factIntervalId);
    };
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: formData.name, 
            email: formData.email, 
            password: formData.password
        })
      });
      clearAllTimers();
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al registrar.');
      }
      setMessage('¡Usuario registrado con éxito! Por favor, inicia sesión.');
      setView('login');
    } catch (error) {
      clearAllTimers();
      setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };
  
  // --- (Sin cambios en handleLogin) ---
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

  // 3. AÑADIMOS LA FUNCIÓN PARA RESTABLECER CONTRASEÑA
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

  // --- 4. RENDERIZADO CONDICIONAL DE LAS VISTAS ---
  const renderContent = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <h1>Iniciar Sesión</h1>
            <form onSubmit={handleLogin} className="register-form">
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
            <h1>Registrarse</h1>
            <form onSubmit={handleRegister} className="register-form">
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
                {isLoading ? message : 'Registrarse'}
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
      {renderContent()}
      {/* Mostramos el mensaje de carga/error fuera del botón para mayor claridad */}
      {isLoading && view === 'register' ? (
          <p className="response-message">{message}</p>
      ) : (
          message && <p className="response-message">{message}</p>
      )}
    </header>
  );
}

export default AuthPage;
