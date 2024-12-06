'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    name: string;
    role: string;
    accessLevel: string[];
    useTimetable: string;
    exp?: number;
}

interface UserContextType {
    user: User | null;
    isUserLoading: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isUserLoading, setIsUserLoading] = useState(true);

    const initializeUser = () => {
        console.log('[UserProvider] Initializing user...');
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: User = jwtDecode<User>(token);
                console.log('[UserProvider] Decoded token:', decoded);

                const currentTime = Math.floor(Date.now() / 1000);
                if (decoded.exp && decoded.exp < currentTime) {
                    console.warn('[UserProvider] Token has expired.');
                    setUser(null);
                } else {
                    setUser(decoded);
                }
            } catch (error) {
                console.error('[UserProvider] Error decoding token:', error);
                setUser(null);
            }
        } else {
            console.warn('[UserProvider] No token found.');
            setUser(null);
        }
        setIsUserLoading(false);
    };

    useEffect(() => {
        initializeUser();
    }, []);

    // ユーザー情報がロードされるまで何もレンダリングしない
    if (isUserLoading) {
        return <div>Loading...</div>;
    }

    return (
        <UserContext.Provider value={{ user, isUserLoading, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};
