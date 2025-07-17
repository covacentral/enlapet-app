import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword 
} from "firebase/auth";
import './App.css';

// --- CONFIGURACIÓN DE LA URL DE LA API ---
// Vite expone las variables de entorno en el objeto import.meta.env
// VITE_API_URL será 'https://enlapet-api.onrender.com' en producción (Vercel)
// y 'http://localhost:3001' en desarrollo (local).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';


function AuthPage() {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Resetea el formulario y los mensajes al cambiar de vista
    setFormData({ name: '', email: '', password: '' });
    setMessage('');
  }, [view]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Registrando...');
    try {
      // Usamos la variable API_URL que apunta al backend correcto
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: formData.name, 
            email: formData.email, 
            password: formData.password
        })
      });

      const data = await response.json();

      // Mejora en el manejo de errores para mostrar el mensaje del backend
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al registrar. Inténtalo de nuevo.');
      }
      
      setMessage('¡Usuario registrado con éxito! Por favor, inicia sesión para continuar.');
      setView('login'); // Cambia a la vista de login tras el registro exitoso

    } catch (error) {
      // Muestra el mensaje de error de forma más clara
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
      // El componente se desmontará al iniciar sesión, no es necesario limpiar el mensaje aquí.
      setMessage('');
    } catch (error) {
      // Firebase provee mensajes de error claros, los mostramos directamente.
      setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <header className="App-header">
      {view === 'login' ? (
        <>
          <h1>Iniciar Sesión</h1>
          <form onSubmit={handleLogin} className="register-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required disabled={isLoading} />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
          <p>¿No tienes cuenta? <button className="link-button" onClick={() => setView('register')} disabled={isLoading}>Regístrate</button></p>
        </>
      ) : (
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
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" disabled={isLoading} />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Procesando...' : 'Registrarse'}
            </button>
          </form>
          <p>¿Ya tienes cuenta? <button className="link-button" onClick={() => setView('login')} disabled={isLoading}>Inicia Sesión</button></p>
        </>
      )}
      {message && <p className="response-message">{message}</p>}
    </header>
  );
}

export default AuthPage;
