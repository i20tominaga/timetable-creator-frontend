// types.ts
export interface Course {
    id?: string;
    name: string;
    description: string;
    credits: number;
    periods: Period[];
    targets: string[];
}
export interface TimetableList {
    id: string;
    name: string;
    file: string;
}

export interface Period {
    day: number;
    period: number;
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

export interface CustomJwtPayload {
    id: string;
    name: string;
    role: string;
    accessLevel: string[];
    useTimetable?: string; // 時間割ID（任意）
    exp?: number;          // 有効期限（任意）
}

export interface CurrentPeriodData {
    day: number;
    period: number | 'special'; // 'special' を許可
}

export interface ClassDetails {
    subject: string;
    instructors: string[];
    room: string;
}

export interface Instructor {
    id: string;
    name: string;
    isFullTime: boolean;
    period: Period[];
}

export interface InstructorList {
    Instructor: Instructor[];
}

export interface NextClasses {
    Subject: string;
    Instructors: string[];
    Rooms: string[];
    Targets: string[];
}
