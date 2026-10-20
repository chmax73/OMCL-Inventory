/**
 * UserContext - angemeldeter Inventur-Benutzer
 * -----------------------------------------
 * Zeigt in der Oberflaeche ausschliesslich den serverseitig geprueften Benutzer.
 * Ein Eintrag im Browser-Speicher kann dadurch keine Rolle mehr vorgaukeln.
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";

// Typ für einen Benutzer (vereinfacht)
export type User = {
    id: string;
    name: string;
    rolle: "admin" | "verantwortlich" | "user";
};

// Context-Typ mit Benutzer und Funktionen
type UserContextType = {
    user: User | null;
    isLoading: boolean;
};

// Context erstellen mit Standardwerten
const UserContext = createContext<UserContextType>({
    user: null,
    isLoading: false,
});

// Der Server liefert die Rolle bei jedem Refresh aus der Datenbank.
export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser: User | null }) {
    return (
        <UserContext.Provider value={{ user: initialUser, isLoading: false }}>
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
