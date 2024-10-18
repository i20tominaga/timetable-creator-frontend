// types.ts

export interface TimetableList {
    id: string;
    name: string;
    file: string;
}
export interface Period {
    period: number;
    length: number;
}

export interface ClassEntry {
    Subject: string;
    Instructors: string[];
    Rooms: string[];
    periods: Period;
    Targets: string[];
}

export interface TimetableDay {
    Day: string;
    Classes: ClassEntry[];
}

export interface Timetable {
    Days: TimetableDay[];
}

export interface DragItem {
    entry: ClassEntry;
    index: number;
    classLabel: string;
    day: string;
}
export interface DraggableClassEntryProps {
    entry: ClassEntry;
    index: number;
    classLabel: string;
    day: string;
    isHighlighted: boolean;
}

export interface DroppableCellProps {
    day: string;
    classLabel: string;
    periodIndex: number;
    moveClass: (item: DragItem, targetDay: string, targetClassLabel: string, targetPeriodIndex: number) => void;
    entry: ClassEntry | null;
    isHighlighted: (entry: ClassEntry) => boolean;  // 関数でbooleanを返す
    children?: React.ReactNode;
}