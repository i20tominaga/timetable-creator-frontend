"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'react-hot-toast';

// データの型を定義
interface Period {
    period: number;
    length: number;
}

interface ClassEntry {
    Subject: string;
    Instructors: string[];
    Rooms: string[];
    periods: Period;
    Targets: string[];
}

interface TimetableDay {
    Day: string;
    Classes: ClassEntry[];
}

interface Timetable {
    Days: TimetableDay[];
}

const EditTimetable = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);

    // APIから時間割を取得
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

    // 時間割の更新処理を定義
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

    // クラスに対応するデータを曜日ごとに分類
    const generateTimetableByClasses = (days: TimetableDay[] | undefined) => {
        const classLabels = ['ME1', 'IE1', 'CA1', 'ME2', 'IE2', 'CA2', 'ME3', 'IE3', 'CA3', 'ME4', 'IE4', 'CA4', 'ME5', 'IE5', 'CA5'];
        const timetableByClasses: { [key: string]: { [key: string]: (ClassEntry | null)[] } } = {};

        // 各クラスの初期化（8コマのスペースを用意）
        classLabels.forEach(classLabel => {
            timetableByClasses[classLabel] = {
                'Monday': Array(4).fill(null),  // periodが0〜3なので4コマ分のスペースを用意
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
                            timetableByClasses[target][day.Day][periods.period] = classEntry;  // 0ベースのperiodをそのまま使用
                        }
                    });
                });
            });
        }

        return timetableByClasses;
    };

    if (loading) return <div>Loading...</div>;

    const timetableByClasses = timetable?.Days ? generateTimetableByClasses(timetable.Days) : {};

    return (
        <div>
            <h1>時間割の編集</h1>
            {timetable && (
                <>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="時間割名を編集" />
                    <Button onClick={handleUpdate}>更新</Button>

                    {/* Scrollable Table */}
                    <ScrollArea style={{ height: '80vh', width: '100%' }}>
                        <Table style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            border: '2px solid #000',
                            marginLeft: '20px',  // 左端のスペース
                            marginRight: '20px'  // 右端のスペース
                        }}>
                            <TableHeader>
                                <TableRow style={{ borderBottom: '2px solid #000' }}>
                                    <TableHead style={{
                                        borderRight: '1px solid #000',
                                        borderBottom: '1px solid #000',
                                        padding: '10px'
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
                                                                backgroundColor: '#f9f9f9',
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
                </>
            )}
        </div>
    );
};

// サスペンスでラップする部分
export default function PageWrapper() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EditTimetable />
        </Suspense>
    );
}
