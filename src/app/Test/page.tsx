"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-hot-toast';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Head from 'next/head';
import Header from '@/components/Header';
import DroppableCell from "@/components/DroppableCell"

import {
    ClassEntry,
    TimetableDay,
    Timetable,
    DragItem
} from '@/components/types';

const EditTimetable = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedTeacher, setSelectedTeacher] = useState<string>("");  // Selected teacher
    const [filterMode, setFilterMode] = useState<boolean>(false);  // Filter mode

    // Fetch timetable data
    useEffect(() => {
        const fetchTimetable = async () => {
            if (!id) return;
            try {
                const response = await axios.get(`http://localhost:3001/api/timetable/get/${id}`);
                setTimetable(response.data);
                setNewName(response.data.name);
                setLoading(false);
            } catch (error) {
                toast.error("時間割の取得に失敗しました。");
                console.error('Error fetching timetable:', error);
                setLoading(false);
            }
        };
        fetchTimetable();
    }, [id]);

    // Update timetable name
    const handleUpdate = async () => {
        try {
            await axios.put(`http://localhost:3001/api/timetable/update/${id}`, { name: newName });
            toast.success("時間割が更新されました。");
            router.push('/');
        } catch (error) {
            console.error('Error updating timetable:', error);
            toast.error("時間割の更新に失敗しました。");
        }
    };

    // Categorize data by classes
    const generateTimetableByClasses = (days: TimetableDay[] | undefined) => {
        const classLabels = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
        const timetableByClasses: { [key: string]: { [key: string]: (ClassEntry | null)[] } } = {};
        classLabels.forEach(classLabel => {
            timetableByClasses[classLabel] = {
                'Monday': Array(4).fill(null),
                'Tuesday': Array(4).fill(null),
                'Wednesday': Array(4).fill(null),
                'Thursday': Array(4).fill(null),
                'Friday': Array(4).fill(null),
            };
        });

        if (days) {
            days.forEach(day => {
                day.Classes.forEach(classEntry => {
                    const { periods, Targets } = classEntry;
                    Targets.forEach(target => {
                        if (timetableByClasses[target]) {
                            console.log('Assigning', classEntry, 'to', target, 'on', day.Day, 'at period', periods.period); // デバッグログ
                            timetableByClasses[target][day.Day][periods.period] = classEntry;
                        }
                    });
                });
            });
        }
        return timetableByClasses;
    };

    const moveClass = (item: DragItem, targetDay: string, targetClassLabel: string, targetPeriodIndex: number) => {
        const { entry, day, index } = item;
        setTimetable((prevTimetable) => {
            if (!prevTimetable || !prevTimetable.Days) return prevTimetable;

            const newTimetable = { ...prevTimetable };
            const oldDayEntry = newTimetable.Days.find(d => d.Day === day);
            const newDayEntry = newTimetable.Days.find(d => d.Day === targetDay);

            if (!oldDayEntry || !newDayEntry) return prevTimetable;

            // 空のクラスを定義
            const emptyClassEntry: ClassEntry = {
                Subject: '',
                Instructors: [],
                Rooms: [],
                periods: { period: 0, length: 2 },
                Targets: []
            };

            // コマの処理: 複数のコマが正しく扱われるようにする
            if (oldDayEntry.Classes[index]) {
                oldDayEntry.Classes[index] = emptyClassEntry;
            }

            newDayEntry.Classes[targetPeriodIndex] = entry;

            return newTimetable;
        });
    };

    const handleTeacherChange = (value: string) => {
        setSelectedTeacher(value);
    };

    const toggleFilterMode = () => {
        setFilterMode(!filterMode);
    };

    const isHighlighted = (classEntry: ClassEntry): boolean => {
        return Boolean(selectedTeacher && classEntry.Instructors.includes(selectedTeacher));
    };

    if (loading) return <div>Loading...</div>;

    const timetableByClasses = timetable?.Days ? generateTimetableByClasses(timetable.Days) : {};
    const allTeachers = timetable?.Days
        .flatMap(day => day.Classes.flatMap(c => c.Instructors))
        .filter((v, i, a) => a.indexOf(v) === i) || [];  // Get unique teachers

    return (
        <div>
            <Head>
                <title>Edit Timetable</title>
            </Head>
            <Header />
            {timetable && (
                <div style={{ padding: '30px' }}>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>時間割名を編集</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>時間割名の編集</DialogTitle>
                            </DialogHeader>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="新しい時間割名を入力"
                                style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <DialogFooter>
                                <Button onClick={handleUpdate}>更新</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Teacher selection and filter toggle */}
                    <div className="flex items-center space-x-4 mb-4">
                        <Select onValueChange={handleTeacherChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="先生を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {allTeachers.map((teacher) => (
                                    <SelectItem key={teacher} value={teacher}>
                                        {teacher}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center space-x-2">
                            <Switch id="filter-mode" checked={filterMode} onCheckedChange={toggleFilterMode} />
                            <span>フィルターモード</span>
                        </div>
                    </div>

                    {/* Scrollable Table */}
                    <ScrollArea style={{ height: '80vh', width: '100%' }}>
                        <Table style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            border: '2px solid #000',
                            marginLeft: '80px',
                            marginRight: '80px',
                            tableLayout: 'fixed'  // 追加: セルの幅を固定
                        }}>
                            <TableHeader>
                                <TableRow style={{ borderBottom: '2px solid #000' }}>
                                    <TableHead style={{
                                        borderRight: '1px solid #000',
                                        borderBottom: '1px solid #000',
                                        padding: '15px'
                                    }}>クラス</TableHead>
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                        <TableHead key={day} style={{
                                            borderLeft: '1px solid #000',
                                            borderBottom: '1px solid #000',
                                            padding: '10px',
                                            textAlign: 'center'
                                        }}>{day}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'].map(classLabel => (
                                    <TableRow key={classLabel} style={{ borderBottom: '1px solid #000' }}>
                                        <TableCell style={{
                                            borderRight: '1px solid #000',
                                            borderBottom: '1px solid #000',
                                            padding: '10px',
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}>{classLabel}</TableCell>
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                            <TableCell
                                            key={day}
                                            style={{
                                                border: '1px solid #000',
                                                wordBreak: 'break-word',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                padding: '10px',
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'flex-start', // カードを均等に並べる
                                                gap: '20px', // カード同士の間隔を拡大
                                                flexWrap: 'nowrap',
                                                overflowX: 'auto',
                                            }}>
                                                {[0, 1, 2, 3].map(periodIndex => (
                                                    <DroppableCell
                                                        key={periodIndex}
                                                        day={day}
                                                        classLabel={classLabel}
                                                        periodIndex={periodIndex}
                                                        moveClass={moveClass}
                                                        entry={timetableByClasses[classLabel][day]?.[periodIndex]}
                                                        isHighlighted={isHighlighted}
                                                    >
                                                        <Card style={{
                                                            padding: '20px',
                                                            margin: '0 10px', // カードの左右に余白を追加
                                                            minWidth: '400px', // 最小幅をさらに拡大
                                                            maxWidth: '450px', // 最大幅を拡大
                                                            height: 'auto', // 高さは内容に応じて自動調整
                                                            display: 'block',
                                                            boxSizing: 'border-box', // boxサイズにパディングなどを含める
                                                            overflow: 'hidden',
                                                            whiteSpace: 'normal', // テキストの折り返しを通常の折り返しに
                                                            wordWrap: 'break-word', // 単語の途中での改行を防ぐ
                                                            borderRadius: '8px', // カードの角を少し丸くしてデザインを調整
                                                            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)', // カードに軽いシャドウを追加して浮き上がらせる
                                                        }}>
                                                            {timetableByClasses[classLabel][day]?.[periodIndex] ? (
                                                                <>
                                                                    <CardHeader>
                                                                        <CardTitle style={{ whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {timetableByClasses[classLabel][day][periodIndex]?.Subject}
                                                                        </CardTitle>
                                                                        <CardDescription style={{ whiteSpace: 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                            {timetableByClasses[classLabel][day][periodIndex]?.Instructors?.join(', ')}
                                                                        </CardDescription>
                                                                    </CardHeader>
                                                                    <CardContent style={{ textAlign: 'center' }}>
                                                                        <div>{timetableByClasses[classLabel][day][periodIndex]?.Rooms?.join(', ')}</div>
                                                                    </CardContent>
                                                                </>
                                                            ) : (
                                                                <div style={{ textAlign: 'center', height: '100px' }}>空きコマ</div>
                                                            )}
                                                        </Card>
                                                    </DroppableCell>
                                                ))}
                                            </div>
                                        </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};

// サスペンスでラップする部分
export default function PageWrapper() {
    return (
        <DndProvider backend={HTML5Backend}>
            <Suspense fallback={<div>Loading...</div>}>
                <EditTimetable />
            </Suspense>
        </DndProvider>
    );
}
