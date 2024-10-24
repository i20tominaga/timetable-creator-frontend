import React from 'react';
import { ClassEntry, DragItem } from '@/components/types';
import Droppable from './Droppable';

interface DroppableCellProps {
    day: string;
    classLabel: string;
    periodIndex: number;
    moveClass: (item: DragItem, targetDay: string, targetClassLabel: string, targetPeriodIndex: number) => void;
    entry: ClassEntry | null;
    isHighlighted: (entry: ClassEntry) => boolean;
}

export default function DroppableCell({ day, classLabel, periodIndex, moveClass, entry, isHighlighted }: DroppableCellProps) {
    return (
        <div
            className={`droppable-cell ${entry && isHighlighted(entry) ? 'highlighted' : ''}`}
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
                <Droppable
                    id={`${day}-${classLabel}-${periodIndex}`}
                    classEntry={entry}
                    onDrop={(entry, targetId) => {
                        const [targetDay, targetClassLabel, targetPeriodIndex] = targetId.split('-');
                        moveClass({ entry, index: periodIndex, classLabel, day }, targetDay, targetClassLabel, parseInt(targetPeriodIndex));
                    }}
                />
            ) : null}
        </div>
    );
}
