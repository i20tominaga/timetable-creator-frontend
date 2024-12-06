'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Head from 'next/head';
import axios from 'axios';
import Header from '@/components/Header';
import {
    Timetable,
    CustomJwtPayload,
    CurrentPeriodData,
    Instructor,
    InstructorList,
    Course
} from '@/components/types';

// 現在の曜日と時限を取得するAPI呼び出し関数
const fetchCurrentDayAndPeriod = async (): Promise<CurrentPeriodData | null> => {
    try {
        const response = await axios.get<CurrentPeriodData>('http://localhost:3001/api/timetable/current-period');
        console.log('Current Period Data:', response.data);

        // 時限を取得し、1を引いてインデックス調整
        const adjustedPeriod: number = Number(response.data.period); // `Number`で型を明示的に変換

        return {
            ...response.data,
            period: adjustedPeriod >= 0 ? adjustedPeriod : 0, // period が 0 未満の場合の安全処理
        };
    } catch (error) {
        console.error('現在の時限情報を取得できませんでした:', error);
        return null;
    }
};

//　現在授業中の先生を取得する関数
const getTeachingInstructorsForCurrentPeriod = (
    timetable: Timetable,
    currentDay: number,
    currentPeriod: number
): { teachingDetails: any[]; isBreakTime: boolean } => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayString = days[currentDay];

    console.log('Current Day String:', currentDayString);

    const dayData = timetable.Days.find((day) => day.Day === currentDayString);
    console.log('Current Day Data:', dayData);

    if (!dayData || !Array.isArray(dayData.Classes)) {
        console.warn('該当する曜日のデータまたはクラスが見つかりません。');
        return { teachingDetails: [], isBreakTime: true };
    }

    const todayClasses = dayData.Classes;

    if (!Array.isArray(todayClasses) || todayClasses.length === 0) {
        console.warn('今日のクラスが見つかりません。');
        return { teachingDetails: [], isBreakTime: true };
    }

    // 現在時限に該当する授業を抽出
    const currentClasses = todayClasses.filter((cls) => {
        const classPeriod = cls.periods?.period !== undefined ? Number(cls.periods.period) : null;
        const adjustedPeriod = currentPeriod - 1; // 調整
        return classPeriod === adjustedPeriod;
    });

    const isBreakTime = currentClasses.length === 0;

    // 授業情報を収集
    const teachingDetails = currentClasses.map((cls) => ({
        subjectName: cls.Subject || '未設定',
        instructors: cls.Instructors || [],
        classroom: cls.Rooms || '未設定',
        className: cls.Targets || '未設定',
    }));

    return { teachingDetails, isBreakTime };
};

//　全先生リストを取得する関数
const fetchAllInstructors = async (): Promise<Instructor[]> => {
    try {
        const response = await axios.get('http://localhost:3001/api/instructors/getAll', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });

        // レスポンス全体を確認
        console.log('APIレスポンス全体:', response.data);

        return response.data; // データをそのまま返す
    } catch (error) {
        console.error('全先生リストを取得できませんでした:', error);
        return [];
    }
};

// 現在授業中の先生を除外する関数
const getFreeInstructors = (allInstructors: Instructor[], teachingInstructors: string[]): Instructor[] => {
    if (!allInstructors || allInstructors.length === 0) {
        console.warn('全ての教員データが空です。');
        return [];
    }

    if (!teachingInstructors || teachingInstructors.length === 0) {
        console.warn('現在授業中の教員データが空です。全員を空いていると見なします。');
        return allInstructors;
    }

    const freeInstructors = allInstructors.filter((instructor) => {
        const isTeaching = teachingInstructors.includes(instructor.name);
        return !isTeaching;
    });

    console.log('空いている教員:', freeInstructors);
    return freeInstructors;
};

// 次の時限の授業を取得する関数
const getNextPeriodClasses = (
    timetable: Timetable,
    currentDay: number,
    currentPeriod: number
): any[] => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayString = days[currentDay];

    const dayData = timetable.Days.find((day) => day.Day === currentDayString);

    if (!dayData || !Array.isArray(dayData.Classes)) {
        return [];
    }

    const nextPeriod = currentPeriod + 1;

    // 次の時限に該当する授業を取得
    const nextClasses = dayData.Classes.filter((cls) => {
        const classPeriod = cls.periods?.period !== undefined ? Number(cls.periods.period) : null;
        return classPeriod === nextPeriod;
    });

    return nextClasses.map((cls) => ({
        subjectName: cls.Subject || '未設定',
        instructors: cls.Instructors || [],
        classroom: cls.Rooms || '未設定',
        className: cls.Targets || '未設定',
    }));
};

const HomePage = () => {
    const [timetableId, setTimetableId] = useState<string | null>(null);    // 時間割ID
    const [timetable, setTimetable] = useState<Timetable | null>(null);     // 時間割デー
    const [teachingInstructors, setTeachingInstructors] = useState<string[]>([]);    // 現在授業中の先生
    const [freeInstructors, setFreeInstructors] = useState<Instructor[]>([]);    // 現在授業中でない先生
    const [currentDay, setCurrentDay] = useState<string | null>(null);   // 現在の曜日
    const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);    // 現在の時限
    const [currentTime, setCurrentTime] = useState<string>('');   // 現在時刻
    const [isBreakTime, setIsBreakTime] = useState<boolean>(false);   // 休憩時間かどうか
    const [teachingDetails, setTeachingDetails] = useState<any[]>([]); // 授業の詳細情報を保存する状態
    const [searchQuery, setSearchQuery] = useState(''); // 検索クエリ
    const [fullTimeFilter, setFullTimeFilter] = useState('All'); // フルタイムフィルター
    const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]); // フィルタリングされた先生リスト
    const [nextClasses, setNextClasses] = useState<any[]>([]); // 次の時限の授業情報
    const [isLoading, setIsLoading] = useState(true);   // ローディング中かどうか

    // ルーターの取得
    const router = useRouter();

    // JWTトークンのデコードと時間割IDの取得
    useEffect(() => {
        const fetchTokenData = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('トークンが見つかりません。ログインページにリダイレクトします。');
                router.push('/login');
                return;
            }

            try {
                const decoded = jwtDecode<CustomJwtPayload>(token);
                console.log('Decoded Token:', decoded);

                const currentTime = Math.floor(Date.now() / 1000);
                if (decoded.exp && decoded.exp < currentTime) {
                    console.warn('トークンの有効期限が切れています。');
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }

                if (decoded.useTimetable) {
                    setTimetableId(decoded.useTimetable); // 正しく取得
                } else {
                    console.error('トークンに時間割ID (useTimetable) が含まれていません。');
                    setTimetableId(null); // エラー時のフォールバック
                }
            } catch (error) {
                console.error('トークンのデコードに失敗しました:', error);
                router.push('/login');
            }
        };

        fetchTokenData();
    }, [router]);

    // データ取得用のuseEffect
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!timetableId) {
                    console.error('時間割IDが見つかりません。処理を中断します。');
                    setIsLoading(false);
                    return;
                }

                const currentPeriodData = await fetchCurrentDayAndPeriod();
                if (!currentPeriodData || typeof currentPeriodData.period !== 'number') {
                    console.error('現在の時限データが無効です。');
                    return;
                }

                const { day, period } = currentPeriodData;

                console.log(`現在の曜日: ${day}, 現在の時限 (調整済み): ${period}`);

                const timetableResponse = await axios.get<Timetable>(
                    `http://localhost:3001/api/timetable/get/${timetableId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );

                const timetableData = timetableResponse.data;
                setTimetable(timetableData);

                const { teachingDetails, isBreakTime } = getTeachingInstructorsForCurrentPeriod(
                    timetableData,
                    day,
                    period
                );

                const allInstructors = await fetchAllInstructors();
                console.log('取得した全教員:', allInstructors);

                const freeInstructors = getFreeInstructors(allInstructors, teachingDetails.map((t) => t.instructors).flat());
                console.log('空いている教員:', freeInstructors);

                setTeachingInstructors(teachingDetails.map((t) => t.instructors).flat());
                setFreeInstructors(freeInstructors);
                setIsBreakTime(isBreakTime);
                setTeachingDetails(teachingDetails); // 新たに教員情報を状態にセット
                setFilteredInstructors(freeInstructors); // フィルタリングされた先生リストをセット

                const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
                setCurrentDay(days[day]);
                setCurrentPeriod(period);

                const interval = setInterval(() => {
                    const now = new Date();
                    setCurrentTime(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                }, 1000);

                return () => clearInterval(interval);

            } catch (error) {
                console.error('データの取得に失敗しました:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [timetableId]);

    useEffect(() => {
        const filtered = freeInstructors.filter((instructor) => {
            const matchesSearch = instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFullTimeFilter =
                fullTimeFilter === 'All' ||
                (fullTimeFilter === 'FullTime' && instructor.isFullTime) ||
                (fullTimeFilter === 'PartTime' && !instructor.isFullTime);

            return matchesSearch && matchesFullTimeFilter;
        });

        setFilteredInstructors(filtered);
    }, [searchQuery, fullTimeFilter, freeInstructors]);

    if (isLoading) {
        return (
            <div>
                <Head>
                    <title>ホーム</title>
                </Head>
                <Header />
                <Card>
                    <CardHeader>
                        <CardTitle>ローディング中...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>データを取得しています...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!timetableId || !timetable) {
        return (
            <div>
                <Head>
                    <title>ホーム</title>
                </Head>
                <Header />
                <Card>
                    <CardHeader>
                        <CardTitle>エラー</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>時間割情報が利用できません</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <Head>
                <title>ホーム</title>
            </Head>
            <Header />
            <div className="p-4 space-y-4">
                {/* 現在の時刻 */}
                <div className="flex flex-wrap gap-4">
                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>現在の時刻</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{currentTime}</p>
                        </CardContent>
                    </Card>

                    <Card className="flex-1">
                        <CardHeader>
                            <CardTitle>現在の状況</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isBreakTime ? (
                                <Badge variant="default">現在は休憩時間です</Badge>
                            ) : currentDay && currentPeriod !== null ? (
                                <Badge variant="default">授業中 ({currentDay}, {currentPeriod} 限目)</Badge>
                            ) : (
                                <Badge variant="destructive">現在は授業時間外です</Badge>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 現在行われている授業情報 */}
                <Card>
                    <CardHeader>
                        <CardTitle>{currentDay} の {currentPeriod} 限目の授業情報</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teachingInstructors.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>授業名</TableHead>
                                        <TableHead>担当教員</TableHead>
                                        <TableHead>教室名</TableHead>
                                        <TableHead>クラス名</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachingDetails.map((detail, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{detail.subjectName}</TableCell>
                                            <TableCell>{detail.instructors.join(', ')}</TableCell>
                                            <TableCell>{detail.classroom}</TableCell>
                                            <TableCell>{detail.className}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p>現在授業中の情報がありません。</p>
                        )}
                    </CardContent>
                </Card>


                <div className="p-4 space-y-4">
                    {/* 検索とフィルタリング */}
                    <div className="flex gap-4">
                        <Input
                            placeholder="教員名で検索"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-grow"
                        />

                        <Select value={fullTimeFilter} onValueChange={setFullTimeFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="勤務形態" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">すべて</SelectItem>
                                <SelectItem value="FullTime">常勤</SelectItem>
                                <SelectItem value="PartTime">非常勤</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 空いている先生 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>空いている先生</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {filteredInstructors.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>教員名</TableHead>
                                            <TableHead>勤務形態</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredInstructors.map((instructor, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{instructor.name}</TableCell>
                                                <TableCell>{instructor.isFullTime ? '常勤' : '非常勤'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>該当する先生はいません。</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
