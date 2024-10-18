import { useDrop } from 'react-dnd';
import { DragItem, DroppableCellProps } from '@/components/types';
import DraggableClassEntry from '@/components/DraggableClassEntry';
import { useRef, useEffect } from 'react';

const DroppableCell: React.FC<DroppableCellProps> = ({ day, classLabel, periodIndex, moveClass, entry, isHighlighted }) => {
    const [{ isOver }, drop] = useDrop({
        accept: 'CLASS_ENTRY',
        drop: (item: DragItem) => {
            console.log("Dropped", item.entry.Subject, "onto", classLabel, "at period", periodIndex); // デバッグログ
            moveClass(item, day, classLabel, periodIndex);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    // refの定義
    const dropRef = useRef<HTMLDivElement>(null);

    // useEffectでDOMにdropRefを適用
    useEffect(() => {
        if (dropRef.current) {
            drop(dropRef.current);
        }
    }, [drop]);

    return (
        <div ref={dropRef} style={{ backgroundColor: isOver ? '#f0f0f0' : entry ? '#f9f9f9' : '#fff' }}>
            {entry ? (
                <DraggableClassEntry
                    entry={entry}
                    index={periodIndex}
                    classLabel={classLabel}
                    day={day}
                    isHighlighted={isHighlighted(entry)}
                />
            ) : (
                <div style={{ height: '100px' }}>空きコマ</div>
            )}
        </div>
    );
};

export default DroppableCell;
