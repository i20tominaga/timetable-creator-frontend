import React from 'react';
import { ClassEntry } from '@/components/types';
import Draggable from './Draggable';

interface DragItem {
    entry: ClassEntry;
    index: number;
    classLabel: string;
    day: string;
}

interface DraggableCellProps {
    day: string;
    classLabel: string;
    periodIndex: number;
    moveClass: (item: DragItem, targetDay: string, targetClassLabel: string, targetPeriodIndex: number) => void;
    entry: ClassEntry | null;
    isHighlighted: (entry: ClassEntry) => boolean;
}

export default function DraggableCell({ day, classLabel, periodIndex, moveClass, entry, isHighlighted }: DraggableCellProps) {
    return (
        <div
            className={`draggable-cell ${entry && isHighlighted(entry) ? 'highlighted' : ''}`}
            onDrop={(event) => {
                event.preventDefault();
                if (entry) {
                    moveClass({ entry, index: periodIndex, classLabel, day }, day, classLabel, periodIndex);
                }
            }}
            onDragOver={(event) => {
                event.preventDefault();
            }}
        >
            {entry ? (
                <Draggable classEntry={entry} />
            ) : null}
        </div>
    );
}
