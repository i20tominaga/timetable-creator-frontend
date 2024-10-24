import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ClassEntry } from '@/components/types'; // クラス情報が定義されている場所

interface DroppableProps {
    id: string;                  // ドロップ可能領域のID
    classEntry?: ClassEntry;     // 授業情報（オプショナル）
    onDrop: (entry: ClassEntry, targetId: string) => void; // ドロップ時のコールバック
    isHighlighted?: boolean;     // ハイライトするかどうか
}

export default function Droppable({ id, classEntry, onDrop, isHighlighted }: DroppableProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (classEntry) {
            onDrop(classEntry, id);
        }
    };

    return (
        <div
            ref={setNodeRef}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            style={{
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '10px',
                width: '150px',
                height: '100px',
                textAlign: 'center',
                backgroundColor: isHighlighted ? 'yellow' : isOver ? '#e0e0e0' : '#f9f9f9',
                overflowWrap: 'break-word',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {classEntry ? (
                <>
                    <div>{classEntry.Subject}</div>
                    <div>{classEntry.Rooms && classEntry.Rooms.join(', ')}</div>
                    <div>{classEntry.Instructors && classEntry.Instructors.join(', ')}</div>
                </>
            ) : (
                <div>空きコマ</div>
            )}
        </div>
    );
};
