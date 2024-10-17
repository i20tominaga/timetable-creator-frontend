"use client";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast, Toaster } from "react-hot-toast"; // Import from react-hot-toast
import { Clock, Edit, Plus, Trash } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
// interface TimetableListに変更
interface TimetableList {
  id: string;
  name: string;
  file: string;
}

export default function TimetableDashboard() {
  const [newTimetableName, setNewTimetableName] = useState("");
  const [timetables, setTimetables] = useState<TimetableList[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [loading, setLoading] = useState(false); // ローディング状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  const router = useRouter();

  const handleEdit = (id: string) => {
    router.push(`/edit?id=${id}`);
  }

  // fetchTimetablesをuseCallbackでメモ化する
  const fetchTimetables = useCallback(async () => {
    setLoading(true); // ローディング開始
    try {
      const response = await axios.get('http://localhost:3001/api/timetable/getAll');
      setTimetables(response.data.TimeTables);
      toast.success("時間割が正常に取得されました。");
    } catch (error) {
      console.error('Error fetching timetables:', error);
      setError("時間割の取得に失敗しました。");
      toast.error("時間割の取得に失敗しました。");
    } finally {
      setLoading(false); // ローディング終了
    }
  }, []);

  // fetchTimetablesが変更されないように依存配列に含める
  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  const createTimetable = async () => {
    if (!newTimetableName.trim()) {
      toast.error("時間割名を入力してください。");
      return;
    }

    setLoading(true); // ローディング開始
    try {
      const response = await axios.post(`http://localhost:3001/api/timetable/create/${encodeURIComponent(newTimetableName)}`);
      const newTimetable = response.data;
      setTimetables((prevTimetables) => [...(prevTimetables || []), newTimetable]);
      setNewTimetableName(""); // 入力フィールドをクリア
      toast.success("時間割が作成されました。");
    } catch (error) {
      console.error("Error creating timetable:", error);
      setError("時間割の作成に失敗しました。");
      toast.error("時間割の作成に失敗しました。");
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  const deleteTimetable = async (id: string) => {
    setLoading(true); // ローディング開始
    try {
      await axios.delete(`http://localhost:3001/api/timetable/delete/${encodeURIComponent(id)}`);
      setTimetables(timetables.filter((timetable) => timetable.id !== id));
      toast.success("時間割が削除されました。");
    } catch (error) {
      console.error("Error deleting timetable:", error);
      setError("時間割の削除に失敗しました。");
      toast.error("時間割の削除に失敗しました。");
    } finally {
      setLoading(false); // ローディング終了
    }
  };

  const deleteAllTimetable = async () => {
    setLoading(true); // ローディング開始
    try {
      await axios.delete(`http://localhost:3001/api/timetable/deleteAll`);
      setTimetables([]);
      toast.success("全ての時間割が削除されました。");
    } catch (error) {
      console.error("Error deleting all timetables:", error);
      setError("全ての時間割の削除に失敗しました。");
      toast.error("全ての時間割の削除に失敗しました。");
    } finally {
      setLoading(false); // ローディング終了
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
            </div>

            {/* テキストエリア（Input）をボタンの上に配置 */}
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <Input
                className="flex-grow"
                placeholder="New Timetable Name"
                value={newTimetableName}
                onChange={(e) => setNewTimetableName(e.target.value)}
              />
              <div className="flex space-x-4">
                {/* CreateボタンとDelete Allボタンの大きさを揃える */}
                <Button className="w-40" onClick={createTimetable} disabled={loading}>
                  {loading ? "Creating..." : <><Plus className="w-4 h-4 mr-2" /> Create New Timetable</>}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-40" variant="destructive" onClick={() => setIsDeleteAll(true)} disabled={loading}>
                      {loading ? "Deleting..." : <><Trash className="w-4 h-4 mr-2" /> Delete All Timetables</>}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>全ての時間割を削除</AlertDialogTitle>
                      <AlertDialogDescription>
                        本当に全ての時間割を削除してもよろしいですか？この操作は元に戻せません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (isDeleteAll) {
                            deleteAllTimetable();
                            setIsDeleteAll(false);
                          }
                        }}
                      >
                        削除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* エラーメッセージの表示 */}
            {error && <div className="text-red-500">{error}</div>}

            {/* APIから取得した時間割データを表示 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(timetables) && timetables.length > 0 ? (
                timetables.map((timetable: TimetableList) => (
                  <Card key={timetable.id}>
                    <CardHeader>
                      <CardTitle>{timetable.id}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(timetable.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setSelectedTimetableId(timetable.id)}>
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>削除の確認</AlertDialogTitle>
                            <AlertDialogDescription>
                              本当にこの時間割を削除してもよろしいですか？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (selectedTimetableId) {
                                  deleteTimetable(selectedTimetableId);
                                  setSelectedTimetableId(null);
                                }
                              }}
                            >
                              削除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center text-gray-500">作成した時間割がありません．</div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Toaster /> {/* Toasterを追加 */}
    </div>
  );
}
