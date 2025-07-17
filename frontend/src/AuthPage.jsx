import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword 
} from "firebase/auth";
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- DATOS CURIOSOS PARA LA PANTALLA DE CARGA ---
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
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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

    // --- MEJORA DE EXPERIENCIA DE USUARIO (v3 - Con datos curiosos) ---
    let initialTimeout;
    let factIntervalId;
    
    // Mensaje inicial más sutil después de 7 segundos
    initialTimeout = setTimeout(() => {
        setMessage('Un momento, estamos creando tu perfil en la base de datos...');
    }, 7000);

    // Después de 15 segundos, empezamos a mostrar datos curiosos
    const startFactsTimeout = setTimeout(() => {
        let factIndex = 0;
        setMessage(loadingFacts[factIndex]); // Muestra el primer dato

        // Cambia el dato cada 8 segundos
        factIntervalId = setInterval(() => {
            factIndex = (factIndex + 1) % loadingFacts.length; // Avanza al siguiente dato de forma cíclica
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

      clearAllTimers(); // Cancelamos los temporizadores si la respuesta llega

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al registrar.');
      }
      
      setMessage('¡Usuario registrado con éxito! Por favor, inicia sesión.');
      setView('login');

    } catch (error) {
      clearAllTimers(); // También cancelamos en caso de error
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

  // El resto del JSX se mantiene igual...
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
              {isLoading ? message : 'Registrarse'}
            </button>
          </form>
          <p>¿Ya tienes cuenta? <button className="link-button" onClick={() => setView('login')} disabled={isLoading}>Inicia Sesión</button></p>
        </>
      )}
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
