"use client"; // クライアントコンポーネントとしてマーク

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Edit, Plus, Trash } from "lucide-react";
import { useState, useEffect } from "react";
import axios from 'axios';
import Head from 'next/head';

// Timetable型の定義
type Timetable = {
  id: string;
  name: string;
  file: string;
};

export default function TimetableDashboard() {
  const [newTimetableName, setNewTimetableName] = useState("");
  const [timetables, setTimetables] = useState<Timetable[]>([]);  // Timetable型を指定  // Timetable型を指定

  // APIから時間割データを取得する関数
  const fetchTimetables = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/timetable/getAll');
      setTimetables(response.data.TimeTables);  // レスポンスからTimeTables配列を取得
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  };

  // コンポーネントが初めてレンダリングされたときにAPIを呼び出す
  useEffect(() => {
    fetchTimetables();
  }, []);

  const createTimetable = async () => {
    try {
      // POSTリクエストで新しい時間割を作成
      const response = await axios.post(`http://localhost:3001/api/timetable/create/${encodeURIComponent(newTimetableName)}`);
      const newTimetable = response.data;
      alert("新しい時間割が作成されました！");
      setTimetables((prevTimetables) => [...(prevTimetables || []), newTimetable]);
    } catch (error) {
      console.error("Error creating timetable:", error);
      alert("時間割の作成に失敗しました。");
    }
  };

  const deleteTimetable = async (id: string) => {
    // 確認ダイアログを表示し、ユーザーがOKを押した場合のみ削除処理を実行
    const confirmDelete = window.confirm("本当にこの時間割を削除してもよろしいですか？");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:3001/api/timetable/delete/${encodeURIComponent(id)}`);
        setTimetables(timetables.filter((timetable) => timetable.id !== id));
        alert("時間割が削除されました！");
      } catch (error) {
        console.error("Error deleting timetable:", error);
        alert("時間割の削除に失敗しました。");
      }
    } else {
      alert("削除がキャンセルされました。");
    }
  };

  return (
    <div>
      <Head>
        <title>Timetable Dashboard</title>
        <meta name="description" content="時間割管理ツール" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 bg-muted/40">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight">Your Timetables</h2>
              <div className="flex items-center">
                <Input
                  className="mr-2"
                  placeholder="New Timetable Name"
                  value={newTimetableName}
                  onChange={(e) => setNewTimetableName(e.target.value)}
                />
                <Button onClick={createTimetable}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Timetable
                </Button>
              </div>
            </div>

            {/* APIから取得した時間割データを表示 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {timetables.length > 0 ? (
                timetables.map((timetable: Timetable) => (
                  <Card key={timetable.id}>  {/* idをkeyに指定 */}
                    <CardHeader>
                      <CardTitle>{timetable.id}</CardTitle>  {/* idを表示 */}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{timetable.file}</span> {/* ファイルパスも表示 */}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteTimetable(timetable.id)}>
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <p>No timetables available.</p>  // データがない場合のメッセージ
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
