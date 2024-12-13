// context/TimetableContext.tsx
'use client';

import React, { createContext, useState, useContext } from 'react';

// Context の型定義
interface TimetableContextType {
    editingTimetableId: string | null;
    setEditingTimetableId: (id: string | null) => void;
}

// Context を作成
const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

// Provider コンポーネント
export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);

    return (
        <TimetableContext.Provider value={{ editingTimetableId, setEditingTimetableId }}>
            {children}
        </TimetableContext.Provider>
    );
};

// カスタムフックで Context を利用
export const useTimetable = () => {
    const context = useContext(TimetableContext);
    if (!context) {
        throw new Error('useTimetable must be used within a TimetableProvider');
    }
    return context;
};
