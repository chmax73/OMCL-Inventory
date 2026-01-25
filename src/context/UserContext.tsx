/**
 * UserContext - Prototyp-Authentifizierung
 * -----------------------------------------
 * Speichert den aktuell ausgewählten Benutzer im Client-State.
 * 
 * HINWEIS: Dies ist nur für den Prototyp! In der finalen Version wird
 * Supabase Auth mit UserID und Passwort verwendet.
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Typ für einen Benutzer (vereinfacht)
export type User = {
    id: string;
    name: string;
    rolle: "admin" | "verantwortlich" | "user";
};

// Context-Typ mit Benutzer und Funktionen
type UserContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
};

// Context erstellen mit Standardwerten
const UserContext = createContext<UserContextType>({
    user: null,
    setUser: () => { },
    isLoading: true,
});

// localStorage-Key für Persistierung
const STORAGE_KEY = "omcl-current-user";

// Provider-Komponente
export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Beim Laden: Benutzer aus localStorage wiederherstellen
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setUserState(JSON.parse(stored));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    // Benutzer setzen und in localStorage speichern
    const setUser = (newUser: User | null) => {
        setUserState(newUser);
        if (newUser) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

// Hook zum Verwenden des Contexts
export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser muss innerhalb eines UserProviders verwendet werden");
    }
    return context;
}
