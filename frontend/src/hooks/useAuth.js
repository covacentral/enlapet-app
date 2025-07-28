import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Un "hook" personalizado para acceder fácilmente al contexto desde
// cualquier componente, sin tener que importar `useContext` y `AuthContext`
// cada vez. Simplifica el código.
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
