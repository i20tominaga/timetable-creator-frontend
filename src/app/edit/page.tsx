"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import _ from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import Header from '@/components/Header';
import { useTimetable } from '@/context/TimetableContext';
import {
    ClassEntry,
    TimetableDay,
    Timetable
} from '@/components/types';

const ClassCard: React.FC<{
    entry?: ClassEntry;
    isSelected: boolean;
    isEmpty: boolean;
    onDoubleClick: () => void;
}> = ({ entry, isSelected, isEmpty, onDoubleClick }) => {
    return (
        <Card
            draggable="true"
            onDoubleClick={onDoubleClick}
            className="cursor-pointer"
            style={{
                border: '1px solid #ddd',
                borderRadius: '5px',
                padding: '10px',
                width: '250px',
                height: 'auto',
                textAlign: 'center',
                backgroundColor: isSelected ? 'lightblue' : (isEmpty ? '#f0f0f0' : '#f9f9f9'),
                overflowWrap: 'break-word',
            }}
            role="button"
            aria-pressed={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDoubleClick();
                }
            }}
        >
            {isEmpty ? (
                <div className="text-gray-400">空きコマ</div>
            ) : (
                <>
                    <div className="text-lg font-bold">{entry?.Subject}</div>
                    <div className="text-sm mt-1">{entry?.Rooms.join(', ')}</div>
                    <div className="text-sm mt-1">{entry?.Instructors.join(', ')}</div>
                </>
            )}
        </Card>
    );
};


const EditTimetable = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    //
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(true);
    // const [selectedTeacher, setSelectedTeacher] = useState<string>("");  // 未使用の変数をコメントアウト
    // const [filterMode, setFilterMode] = useState<boolean>(false);  // 未使用の変数をコメントアウト
    const [selectedClass, setSelectedClass] = useState<{ day: string, classLabel: string, period: number } | null>(null);
    const { user, isUserLoading } = useUser();
    const [authCheckComplete, setAuthCheckComplete] = useState(false); // 認証チェックが完了したかどうかのフラグ
    const { editingTimetableId } = useTimetable();

    // Fetch timetable data
    useEffect(() => {
        const fetchTimetable = async () => {
            const timetableId = editingTimetableId;
            console.log("Editing timetable ID:", timetableId);
            if (!timetableId) {
                toast.error("時間割が選択されていません。");
                console.log(" IDが見つかりません")
                router.push('/dashboard');
                return;
            }

            if (isUserLoading) return;

            if (!user) {
                toast.error("ログインが必要です。");
                router.push('/login');
                return;
            }

            if (user.role !== "admin") {
                toast.error("権限がありません。");
                router.push('/unauthorized');
                return;
            }

            setAuthCheckComplete(true);

            try {
                const response = await axios.get(`http://localhost:3001/api/timetable/get/${timetableId}`);
                setTimetable(response.data);
                setNewName(response.data.name);
            } catch (error) {
                toast.error("時間割の取得に失敗しました。");
                console.error('Error fetching timetable:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTimetable();
    }, [user, isUserLoading, router, editingTimetableId, id]);

    // Handle class selection and swapping
    const handleClassDoubleClick = useCallback(
        (day: string, classLabel: string, period: number | undefined) => {
            if (period === undefined) return; // periodがundefinedの場合は何もしない

            if (selectedClass === null) {
                // 最初の授業を選択
                console.log("Selecting class:", { day, classLabel, period });
                setSelectedClass({ day, classLabel, period });
            } else if (
                selectedClass.day === day &&
                selectedClass.classLabel === classLabel &&
                selectedClass.period === period
            ) {
                // 同じ授業を再度クリックした場合、選択解除
                console.log("Deselecting class:", selectedClass);
                setSelectedClass(null);
            } else {
                // 授業をスワップ
                setTimetable((prevTimetable) => {
                    if (!prevTimetable) return prevTimetable;

                    const newTimetable = _.cloneDeep(prevTimetable);

                    // まず、スワップ対象のインデックスを特定
                    const dayIndex1 = newTimetable.Days.findIndex(
                        (d) => d.Day === selectedClass.day
                    );
                    const dayIndex2 = newTimetable.Days.findIndex((d) => d.Day === day);

                    console.log("Day indices:", { dayIndex1, dayIndex2 });

                    if (dayIndex1 === -1 || dayIndex2 === -1) return prevTimetable;

                    const classIndex1 = newTimetable.Days[dayIndex1].Classes.findIndex(
                        (c) => c.periods.period === selectedClass.period && c.Targets.includes(selectedClass.classLabel)
                    );
                    const classIndex2 = newTimetable.Days[dayIndex2].Classes.findIndex(
                        (c) => c.periods.period === period && c.Targets.includes(classLabel)
                    );

                    console.log("Class indices:", { classIndex1, classIndex2 });

                    if (classIndex1 === -1 || classIndex2 === -1) return prevTimetable;

                    // スワップ対象の授業エントリを取得
                    const classEntry1 = newTimetable.Days[dayIndex1].Classes[classIndex1];
                    const classEntry2 = newTimetable.Days[dayIndex2].Classes[classIndex2];

                    console.log("Swapping classes:", {
                        class1: { ...classEntry1 },
                        class2: { ...classEntry2 },
                    });

                    // periods.periodをスワップ
                    const tempPeriod = classEntry1.periods.period;
                    classEntry1.periods.period = classEntry2.periods.period;
                    classEntry2.periods.period = tempPeriod;

                    // クラスエントリをスワップ
                    newTimetable.Days[dayIndex1].Classes[classIndex1] = classEntry2;
                    newTimetable.Days[dayIndex2].Classes[classIndex2] = classEntry1;

                    console.log("Updated timetable after swap:", newTimetable);

                    return newTimetable;
                });

                setSelectedClass(null);
            }
        },
        [selectedClass]
    );


    // Update timetable name
    const handleUpdate = async () => {
        try {
            await axios.put(`http://localhost:3001/api/timetable/update/${id}`, { name: newName });
            toast.success("時間割が更新されました。");
            router.push('/dashboard');
        } catch (error) {
            console.error('Error updating timetable:', error);
            toast.error("時間割の更新に失敗しました。");
        }
    };

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

    if (!authCheckComplete) return <div>認証中...</div>; // 認証チェックが終わるまでローディング表示
    if (loading) return <div>Loading...</div>; // 認証チェックが終わった後、通常のローディング表示

    const timetableByClasses = timetable?.Days ? generateTimetableByClasses(timetable.Days) : {};

    return (
        <div>
            <Head>
                <title>Edit Timetable</title>
            </Head>
            <Header />
            {timetable && (
                <div style={{ padding: '30px', marginBottom: '20px' }}> {/* 下部に余白を追加 */}
                    {/* Dialog for updating timetable name */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button style={{ marginBottom: '20px' }}>時間割名を編集</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>時間割名の編集</DialogTitle>
                                <DialogDescription>時間割名を変更します。</DialogDescription>
                            </DialogHeader>
                            <Input
                                value={newName || ""}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="新しい時間割名を入力"
                                style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <DialogFooter>
                                <Button onClick={handleUpdate}>更新</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Table style={{
                        borderCollapse: 'collapse',
                        width: '100%',
                        border: '2px solid #000',
                        marginLeft: '80px',
                        marginRight: '80px',
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
                                    }}>
                                        {classLabel}
                                    </TableCell>
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
                                                {timetableByClasses[classLabel][day]?.map((entry, index) => {
                                                    const period = entry?.periods.period ?? index; // entryが存在しない場合はindexを使用
                                                    return (
                                                        <ClassCard
                                                            key={index}
                                                            entry={entry || undefined}
                                                            isSelected={
                                                                selectedClass?.day === day &&
                                                                selectedClass?.classLabel === classLabel &&
                                                                selectedClass?.period === period
                                                            }
                                                            isEmpty={!entry}
                                                            onDoubleClick={() => handleClassDoubleClick(day, classLabel, period)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
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
