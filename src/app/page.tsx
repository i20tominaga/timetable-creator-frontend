'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Timetable, CustomJwtPayload, CurrentPeriodData } from '@/components/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import Header from '@/components/Header';

// 現在の曜日と時限を取得するAPI呼び出し関数
const fetchCurrentDayAndPeriod = async (): Promise<CurrentPeriodData | null> => {
    try {
        const response = await axios.get<CurrentPeriodData>('http://localhost:3001/api/timetable/current-period');
        return response.data;
    } catch (error) {
        console.error('現在の時限情報を取得できませんでした:', error);
        return null; // エラー時は null を返す
    }
};

const HomePage = () => {
    const [timetableId, setTimetableId] = useState<string | null>(null);
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [currentDay, setCurrentDay] = useState<string | null>(null);
    const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

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

                const currentTime = Math.floor(Date.now() / 1000);
                if (decoded.exp && decoded.exp < currentTime) {
                    console.warn('トークンの有効期限が切れています。');
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }

                setTimetableId(decoded.useTimetable || null);
            } catch (error) {
                console.error('トークンのデコードに失敗しました:', error);
                router.push('/login');
            }
        };

        fetchTokenData();
    }, [router]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (timetableId) {
                    const timetableResponse = await axios.get<Timetable>(
                        `http://localhost:3001/api/timetable/get/${timetableId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                            },
                        }
                    );
                    setTimetable(timetableResponse.data);
                }

                const currentData = await fetchCurrentDayAndPeriod();
                if (currentData) {
                    const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
                    setCurrentDay(days[currentData.day]);

                    if (typeof currentData.period === 'number' || currentData.period === null) {
                        setCurrentPeriod(currentData.period);
                    } else {
                        console.warn('時限情報が不正な形式です:', currentData.period);
                        setCurrentPeriod(null);
                    }
                }
            } catch (error) {
                console.error('データ取得中にエラーが発生しました:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();

        // 現在の時間をリアルタイムで更新
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);

        return () => clearInterval(interval);
    }, [timetableId]);

    if (isLoading) {
        return <p>読み込み中...</p>;
    }

    if (!timetableId || !timetable) {
        return <p>時間割情報が利用できません</p>;
    }

    const isClassInProgress = currentPeriod !== null;

    return (
        <div>
            <Head>
                <title>ホームページ</title>
                <meta name="description" content="時間割アプリのホームページです" />
            </Head>
            <Header />
            <div className="content p-4">
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>現在の時間</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{currentTime}</p>
                    </CardContent>
                </Card>

                <h2 className="text-lg font-bold mb-2">現在の状況</h2>
                {currentDay && isClassInProgress ? (
                    <Badge variant="default" className="mb-4">
                        授業中 ({currentPeriod} 限目)
                    </Badge>
                ) : (
                    <Badge variant="destructive" className="mb-4">
                        現在は授業時間外です
                    </Badge>
                )}

                <h2 className="text-lg font-bold mb-2">{currentDay} の授業スケジュール</h2>
                {timetable ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>時限</TableHead>
                                <TableHead>科目</TableHead>
                                <TableHead>担当教員</TableHead>
                                <TableHead>教室</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {timetable.Days.find((day) => day.Day === currentDay)?.Classes.map((cls, index) => (
                                <TableRow key={index}>
                                    <TableCell>{cls.periods.period} 限目</TableCell>
                                    <TableCell>{cls.Subject}</TableCell>
                                    <TableCell>{cls.Instructors.join(', ')}</TableCell>
                                    <TableCell>{cls.Rooms[0]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p>時間割データがありません。</p>
                )}
            </div>
        </div>
    );
};

export default HomePage;
