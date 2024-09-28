"use client"; // クライアントコンポーネントとしてマーク

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
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [isDeleteAll, setIsDeleteAll] = useState(false);

  const fetchTimetables = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/timetable/getAll');
      setTimetables(response.data.TimeTables);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const createTimetable = async () => {
    try {
      const response = await axios.post(`http://localhost:3001/api/timetable/create/${encodeURIComponent(newTimetableName)}`);
      const newTimetable = response.data;
      setTimetables((prevTimetables) => [...(prevTimetables || []), newTimetable]);
    } catch (error) {
      console.error("Error creating timetable:", error);
      alert("時間割の作成に失敗しました。");
    }
  };

  const deleteTimetable = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3001/api/timetable/delete/${encodeURIComponent(id)}`);
      setTimetables(timetables.filter((timetable) => timetable.id !== id));
    } catch (error) {
      console.error("Error deleting timetable:", error);
      alert("時間割の削除に失敗しました。");
    }
  };

  const deleteAllTimetable = async () => {
    try {
      await axios.delete(`http://localhost:3001/api/timetable/deleteAll`);
      setTimetables([]);
    } catch (error) {
      console.error("Error deleting all timetables:", error);
      alert("全ての時間割の削除に失敗しました。");
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
                <Button className="w-40" onClick={createTimetable}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Timetable
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-40" variant="destructive" onClick={() => setIsDeleteAll(true)}>
                      <Trash className="w-4 h-4 mr-2" />
                      Delete All Timetables
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

            {/* APIから取得した時間割データを表示 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(timetables) && timetables.length > 0 ? (
                timetables.map((timetable: Timetable) => (
                  <Card key={timetable.id}>
                    <CardHeader>
                      <CardTitle>{timetable.id}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{timetable.file}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
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
                              本当にこの時間割を削除してもよろしいですか？この操作は元に戻せません。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (selectedTimetableId) {
                                  deleteTimetable(selectedTimetableId);
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
                <p>No timetables available.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
