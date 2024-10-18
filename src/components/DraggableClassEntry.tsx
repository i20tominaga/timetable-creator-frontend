import { useDrag } from 'react-dnd';
import { DraggableClassEntryProps } from '@/components/types';
import { useRef, useEffect } from 'react';

const DraggableClassEntry: React.FC<DraggableClassEntryProps> = ({ entry, index, classLabel, day, isHighlighted }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'CLASS_ENTRY',
        item: { entry, index, classLabel, day },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const dragRef = useRef<HTMLDivElement>(null);

    // useEffectでDOMにdragRefを適用
    useEffect(() => {
        if (dragRef.current) {
            drag(dragRef.current);
        }
    }, [drag]);

    return (
        <div
            ref={dragRef}  // refにdragRefを適用
            style={{
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isHighlighted ? 'yellow' : '#f9f9f9',
                cursor: 'move',  // ドラッグ可能なマウスカーソルを追加
            }}
        >
            <div>{entry.Subject}</div>
            <div>{entry.Rooms.join(', ')}</div>
            <div>{entry.Instructors.join(', ')}</div>
        </div>
    );
};

export default DraggableClassEntry;
