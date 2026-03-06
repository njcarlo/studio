import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the context state
interface AuthState {
    region: string;
    subRegion: string;
    barangay: string;
}

// Define the shape of the context methods
interface AuthContextType {
    authState: AuthState;
    setAuthState: (state: Partial<AuthState>) => void;
    // Convenience getters
    isDasmarinas: boolean;
}

// Default initial state
const initialState: AuthState = {
    region: '',
    subRegion: '',
    barangay: '',
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthStateInternal] = useState<AuthState>(initialState);

    // Helper to partially update state
    const setAuthState = (newState: Partial<AuthState>) => {
        setAuthStateInternal((prev) => ({ ...prev, ...newState }));
    };

    const isDasmarinas = authState.subRegion.toLowerCase() === 'dasmarinas' || authState.subRegion.toLowerCase() === 'dasmariñas';

    return (
        <AuthContext.Provider value={{ authState, setAuthState, isDasmarinas }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
