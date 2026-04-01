// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext();

// Tu lista blanca de correos
const correosAutorizados = [
  "david.ricardo@urquilla.com", 
  "davidurquilla@gmail.com", 
  "camilasofia@urquilla.com", 
  "shields@urquilla.com"
];

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && correosAutorizados.includes(currentUser.email)) {
                setUser(currentUser); // Es administrador válido
            } else {
                setUser(null);
                if (currentUser) signOut(auth); // Lo expulsa si entra con un correo no autorizado
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = () => signInWithPopup(auth, googleProvider);
    const logout = () => signOut(auth);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);