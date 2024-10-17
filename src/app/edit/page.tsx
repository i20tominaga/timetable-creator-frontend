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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'react-hot-toast';
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Head from 'next/head';
import Header from '@/components/Header';
import {
    ClassEntry,
    TimetableDay,
    Timetable,
    DragItem
} from '@/app/types';

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
                            timetableByClasses[target][day.Day][periods.period] = classEntry;
                        }
                    });
                });
            });
        }
        return timetableByClasses;
    };

    const handleTeacherChange = (value: string) => {
        setSelectedTeacher(value);
    };

    const toggleFilterMode = () => {
        setFilterMode(!filterMode);
    };

    const isHighlighted = (classEntry: ClassEntry) => {
        return selectedTeacher && classEntry.Instructors.includes(selectedTeacher);
    };
    /*
    const shouldDisplay = (classEntry: ClassEntry) => {
        return !filterMode || !selectedTeacher || classEntry.Instructors.includes(selectedTeacher);
    };
    */
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
                            marginLeft: '80px',  // 左端のスペース
                            marginRight: '80px'  // 右端のスペース
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
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
                                                    {timetableByClasses[classLabel][day]?.slice(0, 4).map((entry, index) => (
                                                        entry ? (
                                                            <div key={index} style={{
                                                                border: '1px solid #ddd',
                                                                borderRadius: '5px',
                                                                padding: '10px',
                                                                width: '150px',
                                                                height: 'auto',
                                                                textAlign: 'center',
                                                                backgroundColor: isHighlighted(entry) ? 'yellow' : '#f9f9f9',  // ハイライト
                                                                overflowWrap: 'break-word',
                                                            }}>
                                                                <div>{entry.Subject}</div>
                                                                <div>{entry.Rooms.join(', ')}</div>
                                                                <div>{entry.Instructors.join(', ')}</div>
                                                            </div>
                                                        ) : (
                                                            <div key={`empty-${index}`} style={{ width: '150px', height: '100px' }}>---</div>
                                                        )
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
