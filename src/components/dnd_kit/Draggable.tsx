import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ClassEntry } from '@/components/types'; // クラス情報が定義されている場所

interface DraggableProps {
    classEntry: ClassEntry;   // ドラッグ対象の授業情報
}

export default function Draggable({ classEntry }: DraggableProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: classEntry.Subject,
    });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Translate.toString(transform),
                opacity: isDragging ? 0.5 : 1,  // ドラッグ中の透明度調整
                cursor: 'grab',                 // マウスカーソルを変更
                border: '1px solid gray',
                padding: '10px',
                margin: '5px',
                backgroundColor: 'white',
            }}
            {...listeners}
            {...attributes}
        >
            {classEntry.Subject}
        </div>
    );
}
