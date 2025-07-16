import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import './App.css';

function AuthPage() {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData({ name: '', email: '', password: '' });
    setMessage('');
  }, [view]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('Registrando...');
    try {
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: formData.name, 
            email: formData.email, 
            password: formData.password
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.errorMessage || 'Error al registrar');
      
      setMessage('¡Usuario registrado con éxito! Por favor, inicia sesión.');
      setView('login');
    } catch (error) {
      setMessage(error.message);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Iniciando sesión...');
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
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
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>
            <button type="submit">Iniciar Sesión</button>
          </form>
          <p>¿No tienes cuenta? <button className="link-button" onClick={() => setView('register')}>Regístrate</button></p>
        </>
      ) : (
        <>
          <h1>Registrarse</h1>
          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label htmlFor="name">Nombre:</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña:</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" />
            </div>
            <button type="submit">Registrarse</button>
          </form>
          <p>¿Ya tienes cuenta? <button className="link-button" onClick={() => setView('login')}>Inicia Sesión</button></p>
        </>
      )}
      {message && <p className="response-message">{message}</p>}
    </header>
  );
}

export default AuthPage;
