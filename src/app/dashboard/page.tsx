"use client"

import { Header } from "@/components/Header"
import { useUser, UserProvider } from "@/context/UserContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast, Toaster } from "react-hot-toast"
import { Clock, Edit, Trash } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import axios from 'axios'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { TimetableList } from "@/components/types"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { useTimetable } from "@/context/TimetableContext"

interface Period {
  day: number;
  period: number;
};

interface Course {
  id?: string;
  name: string;
  instructors: string[];
  targets: string[];
  rooms: string[];
  periods: Period[];
};

interface Instructor {
  id: string;
  name: string;
  isFullTime: boolean;
  periods: Period[];
};

interface Room {
  id?: string;
  name: string;
  unavailable: Period[];
}

export default function TimetableDashboard() {
  const [newTimetableName, setNewTimetableName] = useState("")
  const [timetables, setTimetables] = useState<TimetableList[]>([])
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null)
  const [isDeleteAll, setIsDeleteAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentCourse, setCurrentCourse] = useState<Course>({
    name: '',
    instructors: [],
    targets: [],
    rooms: [],
    periods: []
  })
  const [currentInstructor, setCurrentInstructor] = useState<Instructor>({
    id: '',
    name: '',
    isFullTime: true,
    periods: []
  })
  const [currentRoom, setCurrentRoom] = useState<Room>({
    name: '',
    unavailable: []
  })
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const { user, isUserLoading } = useUser()
  const { setEditingTimetableId } = useTimetable()

  const router = useRouter()

  const handleEdit = async (id: string) => {
    setEditingTimetableId(id);
    console.log("Set editingTimetableId:", id);
    // 状態が確実に反映されるのを待つ
    await new Promise((resolve) => setTimeout(resolve, 50));
    router.push('/edit');
  };

  // fetchTimetables, fetchCourses, fetchInstructors, fetchRooms を useCallback でメモ化
  const fetchTimetables = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/timetable/getAll');
      setTimetables(response.data.TimeTables);
    } catch (error) {
      toast.error("時間割の取得に失敗しました。");
      console.error("Error fetching timetables:", error);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/courses/getAll');
      setCourses(response.data);
    } catch (error) {
      toast.error("授業の取得に失敗しました。");
      console.error("Error fetching courses:", error);
    }
  }, []);

  const fetchInstructors = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/instructors/getAll');
      setInstructors(response.data);
    } catch (error) {
      toast.error("教員の取得に失敗しました。");
      console.error("Error fetching instructors:", error);
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/rooms/getAll');

      // データが配列でない場合に配列に変換
      const roomsData = Array.isArray(response.data) ? response.data : response.data.rooms || [];
      setRooms(roomsData);
      console.log("Fetched rooms:", roomsData); // デバッグ用
    } catch (error) {
      toast.error("教室の取得に失敗しました。");
      console.error("Error fetching rooms:", error);
    }
  }, []);

  // ダッシュボードデータの取得
  useEffect(() => {
    const fetchData = async () => {
      // ユーザー情報がロード中の場合は何もせず待機
      if (isUserLoading) return;

      // user が null の場合、ログインページへリダイレクト
      if (!user) {
        console.warn("[Page] User is null. Redirecting to login.")
        router.push('/login');
        return;
      }

      // userがstudentの場合はアクセス権限がないため、unauthorizedページへリダイレクト
      if (user.role === 'student') {
        console.warn("[Page] User is not admin. Redirecting to unauthorized.");
        router.push('/unauthorized');
        return;
      }

      setAuthCheckComplete(true);

      // user が admin の場合にデータをフェッチ
      try {
        setLoading(true);
        await fetchTimetables();
        await fetchCourses();
        await fetchInstructors();
        await fetchRooms();
      } catch (error) {
        toast.error("データの取得に失敗しました。");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isUserLoading, router, fetchTimetables, fetchCourses, fetchInstructors, fetchRooms]);

  const createTimetable = async () => {
    if (!newTimetableName.trim()) {
      toast.error("時間割名を入力してください。")
      return
    }

    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:3001/api/timetable/create/${encodeURIComponent(newTimetableName)}`)
      const newTimetable = response.data
      setTimetables((prevTimetables) => [...(prevTimetables || []), newTimetable])
      setNewTimetableName("")
      toast.success("時間割が作成されました。")
    } catch (error) {
      console.error("Error creating timetable:", error)
      setError("時間割の作成に失敗しました。")
      toast.error("時間割の作成に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const deleteTimetable = async (id: string) => {
    setLoading(true)
    try {
      await axios.delete(`http://localhost:3001/api/timetable/delete/${encodeURIComponent(id)}`)
      setTimetables(timetables.filter((timetable) => timetable.id !== id))
      toast.success("時間割が削除されました。")
    } catch (error) {
      console.error("Error deleting timetable:", error)
      setError("時間割の削除に失敗しました。")
      toast.error("時間割の削除に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const deleteAllTimetable = async () => {
    setLoading(true)
    try {
      await axios.delete(`http://localhost:3001/api/timetable/deleteAll`)
      setTimetables([])
      toast.success("全ての時間割が削除されました。")
    } catch (error) {
      console.error("Error deleting all timetables:", error)
      setError("全ての時間割の削除に失敗しました。")
      toast.error("全ての時間割の削除に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const createCourse = async () => {
    if (!currentCourse.name) {
      toast.error("授業名を入力してください。");
      return;
    }
    setLoading(true);
    try {
      // データを配列で送信
      const response = await axios.post('http://localhost:3001/api/courses/create', [currentCourse]);
      const newCourse = response.data;

      if (newCourse && newCourse.name) { // レスポンスが正しいか確認
        setCourses((prevCourses) => [...prevCourses, newCourse]);
        setCurrentCourse({
          name: '',
          instructors: [],
          targets: [],
          rooms: [],
          periods: [],
        });
        toast.success("授業が保存されました。");
      } else {
        toast.error("作成された授業データが不正です。");
      }
    } catch (error) {
      console.error("Error saving course:", error);
      setError("授業の保存に失敗しました。");
      toast.error("授業の保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (name: string) => {
    setLoading(true);
    try {
      console.log(`Deleting course with name: ${name}`); // デバッグ用ログ
      await axios.delete(`http://localhost:3001/api/courses/delete/${encodeURIComponent(name)}`);
      setCourses((prevCourses) => prevCourses.filter((course) => course.name !== name));
      toast.success("授業が削除されました。");
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("授業の削除に失敗しました。");
      toast.error("授業の削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const createInstructor = async () => {
    if (!currentInstructor.name) {
      toast.error("教員名を入力してください。");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/instructors/create', [currentInstructor]);

      console.log("サーバーからのレスポンス:", response.data);

      // サーバーからのレスポンスデータから追加された教員の最初の要素を取得
      const newInstructor = response.data.addedInstructors[0];

      if (newInstructor && newInstructor.name) {
        setInstructors((prevInstructors) => [...prevInstructors, newInstructor]);
        setCurrentInstructor({
          id: '',
          name: '',
          isFullTime: true,
          periods: [],
        });
        toast.success("教員が保存されました。");
      } else {
        toast.error("作成された教員データが不正です。");
      }
    } catch (error) {
      console.error("Error saving instructor:", error);
      setError("教員の保存に失敗しました。");
      toast.error("教員の保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const deleteInstructor = async (id: string) => {
    setLoading(true)
    try {
      await axios.delete(`http://localhost:3001/api/instructors/delete/${encodeURIComponent(id)}`)
      setInstructors(instructors.filter((instructor) => instructor.id !== id))
      toast.success("教員が削除されました。")
    } catch (error) {
      console.error("Error deleting instructor:", error)
      setError("教員の削除に失敗しました。")
      toast.error("教員の削除に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async () => {
    if (!currentRoom.name) {
      toast.error("教室名を入力してください。");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/rooms/create', [currentRoom]);
      const newRoom = response.data;

      if (newRoom && newRoom.name) {
        setRooms((prevRooms) => (Array.isArray(prevRooms) ? [...prevRooms, newRoom] : [newRoom]));
        setCurrentRoom({
          name: '',
          unavailable: []
        });
        toast.success("教室が保存されました。");
      } else {
        toast.error("作成された教室データが不正です。");
      }
    } catch (error) {
      console.error("Error saving room:", error);
      setError("教室の保存に失敗しました。");
      toast.error("教室の保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const deleteRoom = async (id: string) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/rooms/delete/${encodeURIComponent(id)}`);

      // 教室の削除が成功した後にroomsの状態を更新する
      setRooms((prevRooms) => prevRooms.filter((room) => room.name !== id));

      toast.success("教室が削除されました。");
    } catch (error) {
      console.error("Error deleting room:", error);
      setError("教室の削除に失敗しました。");
      toast.error("教室の削除に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const togglePeriod = (day: number, period: number, type: 'course' | 'instructor' | 'room') => {
    const periodObj = { day, period }
    if (type === 'room') {
      const periodIndex = currentRoom.unavailable.findIndex(p => p.day === day && p.period === period)
      if (periodIndex > -1) {
        setCurrentRoom({
          ...currentRoom,
          unavailable: currentRoom.unavailable.filter((_, index) => index !== periodIndex)
        })
      } else {
        setCurrentRoom({
          ...currentRoom,
          unavailable: [...currentRoom.unavailable, periodObj]
        })
      }
    } else if (type === 'course') {
      const periodIndex = currentCourse.periods.findIndex(p => p.day === day && p.period === period)
      if (periodIndex > -1) {
        setCurrentCourse({
          ...currentCourse,
          periods: currentCourse.periods.filter((_, index) => index !== periodIndex)
        })
      } else {
        setCurrentCourse({
          ...currentCourse,
          periods: [...currentCourse.periods, periodObj]
        })
      }
    } else if (type === 'instructor') {
      const periodIndex = currentInstructor.periods.findIndex(p => p.day === day && p.period === period)
      if (periodIndex > -1) {
        setCurrentInstructor({
          ...currentInstructor,
          periods: currentInstructor.periods.filter((_, index) => index !== periodIndex)
        })
      } else {
        setCurrentInstructor({
          ...currentInstructor,
          periods: [...currentInstructor.periods, periodObj]
        })
      }
    } else {
      const periodIndex = currentInstructor.periods.findIndex(p => p.day === day && p.period === period)
      if (periodIndex > -1) {
        setCurrentInstructor({
          ...currentInstructor,
          periods: currentInstructor.periods.filter((_, index) => index !== periodIndex)
        })
      } else {
        setCurrentInstructor({
          ...currentInstructor,
          periods: [...currentInstructor.periods, periodObj]
        })
      }
    }
  }

  const handleEditCourse = async () => {
    if (!editingCourseId || !editingCourse) {
      toast.error("編集中の授業名が不正です。");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:3001/api/courses/update/${encodeURIComponent(editingCourseId)}`,
        editingCourse
      );

      const updatedCourse = response.data.updatedCourse;

      if (updatedCourse) {
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course.name === editingCourseId ? updatedCourse : course
          )
        );
        toast.success("授業が更新されました。");
        setEditingCourse(null);
        setEditingCourseId(null);
      } else {
        toast.error("更新された授業データが不正です。");
      }
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("授業の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInstructor = async () => {
    if (!editingInstructorId || !editingInstructor) {
      toast.error("編集中の教員IDが不正です。");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:3001/api/instructors/update/${encodeURIComponent(editingInstructorId)}`,
        editingInstructor
      );

      const updatedInstructor = response.data.updatedInstructor;

      // デバッグ用
      console.log("API response:", response.data);
      console.log("Updated Instructor:", updatedInstructor);

      if (updatedInstructor) {
        setInstructors((prevInstructors) =>
          prevInstructors.map((instructor) =>
            instructor.id === editingInstructorId ? updatedInstructor : instructor
          )
        );
        toast.success("教員が更新されました。");

        setEditingInstructor(null);
        setEditingInstructorId(null);
      } else {
        toast.error("更新された教員データが不正です。");
      }
    } catch (error) {
      console.error("Error updating instructor:", error);
      toast.error("教員の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  const handleEditRoom = async () => {
    if (!editingRoomId || !editingInstructor) {
      toast.error("編集中の教室IDが不正です。");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:3001/api/rooms/update/${encodeURIComponent(editingRoomId)}`,
        editingRoom
      )

      const updatedRoom = response.data.updateRoom;

      if (updatedRoom) {
        setRooms((prevRooms) =>
          prevRooms.map((room) =>
            room.id === editingRoomId ? updatedRoom : room
          )
        );
        toast.success("教室が更新されました。");
        setEditingRoom(null);
        setEditingRoomId(null);
      } else {
        toast.error("更新された教室データが不正です。");
      }
    } catch (error) {
      console.error("Error updating room:", error);
      toast.error("教室の更新に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  // 認証が完了していない場合は認証中と表示
  if (!authCheckComplete) {
    return <div>認証中...</div>;
  }

  return (
      <UserProvider>
        <div>
          <Head>
            <title>Timetable Dashboard</title>
            <meta name="description" content="時間割管理ツール" />
          </Head>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 p-6 bg-muted/40">
              <div className="max-w-6xl mx-auto space-y-6">
                <Tabs defaultValue="timetables">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="timetables">時間割</TabsTrigger>
                    <TabsTrigger value="courses">授業</TabsTrigger>
                    <TabsTrigger value="instructors">教員</TabsTrigger>
                    <TabsTrigger value="rooms">教室</TabsTrigger>
                  </TabsList>
                  <TabsContent value="timetables">
                    <div className="space-y-6">
                      <h2 className="text-3xl font-bold tracking-tight">Your Timetables</h2>
                      <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                        <Input
                          className="flex-grow"
                          placeholder="New Timetable Name"
                          value={newTimetableName}
                          onChange={(e) => setNewTimetableName(e.target.value)}
                        />
                        <div className="flex space-x-4">
                          <Button className="w-40" onClick={createTimetable} disabled={loading}>
                            {loading ? "Creating..." : "Create New Timetable"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button className="w-40" variant="destructive" onClick={() => setIsDeleteAll(true)} disabled={loading}>
                                {loading ? "Deleting..." : "Delete All Timetables"}
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
                                      deleteAllTimetable()
                                      setIsDeleteAll(false)
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
                      {error && <div className="text-red-500">{error}</div>}
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
                                            deleteTimetable(selectedTimetableId)
                                            setSelectedTimetableId(null)
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
                          <div className="text-center text-gray-500">作成した時間割がありません。</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="courses">
                    <Tabs defaultValue="add">
                      <TabsList>
                        <TabsTrigger value="add">新規授業作成</TabsTrigger>
                        <TabsTrigger value="manage">授業一覧・管理</TabsTrigger>
                      </TabsList>
                      <TabsContent value="add">
                        <Card>
                          <CardHeader>
                            <CardTitle>新規授業作成</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid w-full items-center gap-4">
                              <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="courseName">授業名</Label>
                                <Input
                                  id="courseName"
                                  value={currentCourse.name}
                                  onChange={(e) => setCurrentCourse({ ...currentCourse, name: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="courseInstructors">担当教員</Label>
                                <Input
                                  id="courseInstructors"
                                  value={currentCourse.instructors.join(', ')}
                                  onChange={(e) => setCurrentCourse({ ...currentCourse, instructors: e.target.value.split(', ') })}
                                />
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="courseTargets">対象クラス</Label>
                                <Input
                                  id="courseTargets"
                                  value={currentCourse.targets.join(', ')}
                                  onChange={(e) => setCurrentCourse({ ...currentCourse, targets: e.target.value.split(', ') })}
                                />
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="courseRooms">教室</Label>
                                <Input
                                  id="courseRooms"
                                  value={currentCourse.rooms.join(', ')}
                                  onChange={(e) => setCurrentCourse({ ...currentCourse, rooms: e.target.value.split(', ') })}
                                />
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <Label>時間割</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 2, 3, 4, 5].map(day => (
                                    <div key={day} className="flex flex-col items-center">
                                      <span>Day {day}</span>
                                      {[1, 2, 3, 4].map(period => (
                                        <Checkbox
                                          key={`${day}-${period}`}
                                          checked={currentCourse.periods.some(p => p.day === day && p.period === period)}
                                          onCheckedChange={() => togglePeriod(day, period, 'course')}
                                        />
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentCourse({
                              name: '',
                              instructors: [],
                              targets: [],
                              rooms: [],
                              periods: []
                            })}>
                              クリア
                            </Button>
                            <Button onClick={createCourse}>作成</Button>
                          </CardFooter>
                        </Card>
                      </TabsContent>
                      <TabsContent value="manage">
                        <Card>
                          <CardHeader>
                            <CardTitle>授業一覧・管理</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>授業名</TableHead>
                                  <TableHead>担当教員</TableHead>
                                  <TableHead>対象クラス</TableHead>
                                  <TableHead>教室</TableHead>
                                  <TableHead>編集</TableHead>
                                  <TableHead>削除</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {courses.length > 0 ? (
                                  courses.map((course, index) => (
                                    <TableRow key={course.id || index}>
                                      <TableCell>{course.name}</TableCell>
                                      <TableCell>
                                        {course.instructors ? course.instructors.join(', ') : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {course.targets && course.targets.length > 0 ? course.targets.join(', ') : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {course.rooms ? course.rooms.join(', ') : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {/* 編集ボタン */}
                                        <Sheet>
                                          <SheetTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setEditingCourse(course)} // Sheet展開時にデータを設定
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                          </SheetTrigger>
                                          <SheetContent>
                                            <SheetHeader>
                                              <SheetTitle>授業の編集</SheetTitle>
                                              <SheetDescription>授業の情報を編集します。</SheetDescription>
                                            </SheetHeader>
                                            {editingCourse && (
                                              <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="courseName" className="text-right">
                                                    授業名
                                                  </Label>
                                                  <Input
                                                    id="courseName"
                                                    value={editingCourse.name}
                                                    onChange={(e) =>
                                                      setEditingCourse({ ...editingCourse, name: e.target.value })
                                                    }
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="courseInstructors" className="text-right">
                                                    担当教員
                                                  </Label>
                                                  <Input
                                                    id="courseInstructors"
                                                    value={editingCourse.instructors.join(', ')}
                                                    onChange={(e) =>
                                                      setEditingCourse({ ...editingCourse, instructors: e.target.value.split(', ') })
                                                    }
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="courseTargets" className="text-right">
                                                    対象クラス
                                                  </Label>
                                                  <Input
                                                    id="courseTargets"
                                                    value={editingCourse.targets.join(', ')}
                                                    onChange={(e) =>
                                                      setEditingCourse({ ...editingCourse, targets: e.target.value.split(', ') })
                                                    }
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="courseRooms" className="text-right">
                                                    教室
                                                  </Label>
                                                  <Input
                                                    id="courseRooms"
                                                    value={editingCourse.rooms.join(', ')}
                                                    onChange={(e) =>
                                                      setEditingCourse({ ...editingCourse, rooms: e.target.value.split(', ') })
                                                    }
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label className="text-right">時間割</Label>
                                                  <div className="col-span-3 grid grid-cols-5 gap-2">
                                                    {[1, 2, 3, 4, 5].map(day => (
                                                      <div key={day} className="flex flex-col items-center">
                                                        <span>Day {day}</span>
                                                        {[1, 2, 3, 4].map(period => (
                                                          <Checkbox
                                                            key={`${day}-${period}`}
                                                            checked={editingCourse.periods.some(p => p.day === day && p.period === period)}
                                                            onCheckedChange={() => {
                                                              const newPeriods = editingCourse.periods.some(p => p.day === day && p.period === period)
                                                                ? editingCourse.periods.filter(p => !(p.day === day && p.period === period))
                                                                : [...editingCourse.periods, { day, period }];
                                                              setEditingCourse({ ...editingCourse, periods: newPeriods });
                                                            }}
                                                          />
                                                        ))}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            <SheetFooter>
                                              <SheetClose asChild>
                                                <Button type="submit" onClick={handleEditCourse}>保存</Button>
                                              </SheetClose>
                                              <Button variant="outline" onClick={() => setEditingCourse(null)}>キャンセル</Button>
                                            </SheetFooter>
                                          </SheetContent>
                                        </Sheet>
                                      </TableCell>
                                      <TableCell>
                                        {/* 削除ボタン */}
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                              <Trash className="w-4 h-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>授業の削除</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                本当にこの授業を削除してもよろしいですか？この操作は元に戻せません。
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => {
                                                  if (course.name) {
                                                    deleteCourse(course.name)
                                                  }
                                                }}
                                              >
                                                削除
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center">登録された授業がありません。</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                  <TabsContent value="instructors">
                    <Tabs defaultValue="add">
                      <TabsList>
                        <TabsTrigger value="add">新規教員追加</TabsTrigger>
                        <TabsTrigger value="manage">教員一覧・管理</TabsTrigger>
                      </TabsList>
                      <TabsContent value="add">
                        <Card>
                          <CardHeader>
                            <CardTitle>新規教員追加</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid w-full items-center gap-4">
                              <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="instructorName">教員名</Label>
                                <Input
                                  id="instructorName"
                                  value={currentInstructor.name}
                                  onChange={(e) => setCurrentInstructor({ ...currentInstructor, name: e.target.value, id: e.target.value })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="isFullTime"
                                  checked={currentInstructor.isFullTime}
                                  onCheckedChange={(checked) => setCurrentInstructor({ ...currentInstructor, isFullTime: checked as boolean })}
                                />
                                <label
                                  htmlFor="isFullTime"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  常勤
                                </label>
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <Label>利用可能な時間</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 2, 3, 4, 5].map(day => (
                                    <div key={day} className="flex flex-col items-center">
                                      <span>Day {day}</span>
                                      {[1, 2, 3, 4].map(period => (
                                        <Checkbox
                                          key={`${day}-${period}`}
                                          checked={currentInstructor.periods.some(p => p.day === day && p.period === period)}
                                          onCheckedChange={() => togglePeriod(day, period, 'instructor')}
                                        />
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentInstructor({
                              id: '',
                              name: '',
                              isFullTime: true,
                              periods: []
                            })}>
                              クリア
                            </Button>
                            <Button onClick={createInstructor}>教員を保存</Button>
                          </CardFooter>
                        </Card>
                      </TabsContent>
                      <TabsContent value="manage">
                        <Card>
                          <CardHeader>
                            <CardTitle>教員一覧・管理</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>教員名</TableHead>
                                  <TableHead>常勤</TableHead>
                                  <TableHead>利用可能な時間</TableHead>
                                  <TableHead>編集</TableHead>
                                  <TableHead>削除</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.isArray(instructors) && instructors.length > 0 ? (
                                  instructors.map((instructor, index) => (
                                    <TableRow key={`${instructor.id}-${index}`}>
                                      <TableCell>{instructor.name}</TableCell>
                                      <TableCell>{instructor.isFullTime ? 'はい' : 'いいえ'}</TableCell>
                                      <TableCell>{instructor.periods.length} コマ</TableCell>
                                      <TableCell>
                                        {/* 編集ボタン */}
                                        <Sheet>
                                          <SheetTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setEditingInstructor(instructor);
                                                setEditingInstructorId(instructor.id);
                                              }}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                          </SheetTrigger>
                                          <SheetContent>
                                            <SheetHeader>
                                              <SheetTitle>教員の編集</SheetTitle>
                                              <SheetDescription>教員の情報を編集します。</SheetDescription>
                                            </SheetHeader>
                                            {editingInstructor && (
                                              <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="instructorName" className="text-right">
                                                    教員名
                                                  </Label>
                                                  <Input
                                                    id="instructorName"
                                                    value={editingInstructor.name}
                                                    onChange={(e) =>
                                                      setEditingInstructor({ ...editingInstructor, name: e.target.value })
                                                    }
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="isFullTime" className="text-right">
                                                    常勤
                                                  </Label>
                                                  <Checkbox
                                                    id="isFullTime"
                                                    checked={editingInstructor.isFullTime}
                                                    onCheckedChange={(checked) =>
                                                      setEditingInstructor({ ...editingInstructor, isFullTime: checked as boolean })
                                                    }
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label className="text-right">利用可能な時間</Label>
                                                  <div className="col-span-3 grid grid-cols-5 gap-2">
                                                    {[1, 2, 3, 4, 5].map(day => (
                                                      <div key={day} className="flex flex-col items-center">
                                                        <span>Day {day}</span>
                                                        {[1, 2, 3, 4].map(period => (
                                                          <Checkbox
                                                            key={`${day}-${period}`}
                                                            checked={editingInstructor.periods.some(p => p.day === day && p.period === period)}
                                                            onCheckedChange={() => {
                                                              const newPeriods = editingInstructor.periods.some(p => p.day === day && p.period === period)
                                                                ? editingInstructor.periods.filter(p => !(p.day === day && p.period === period))
                                                                : [...editingInstructor.periods, { day, period }];
                                                              setEditingInstructor({ ...editingInstructor, periods: newPeriods });
                                                            }}
                                                          />
                                                        ))}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            <SheetFooter>
                                              <SheetClose asChild>
                                                <Button type="submit" onClick={handleEditInstructor}>保存</Button>
                                              </SheetClose>
                                              <Button variant="outline" onClick={() => setEditingInstructor(null)}>キャンセル</Button>
                                            </SheetFooter>
                                          </SheetContent>
                                        </Sheet>
                                      </TableCell>
                                      <TableCell>
                                        {/* 削除ボタン */}
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                              <Trash className="w-4 h-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>教員の削除</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                本当にこの教員を削除してもよろしいですか？この操作は元に戻せません。
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteInstructor(instructor.id)}>
                                                削除
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                      登録された教員がありません。
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      <TabsContent value="rooms">
                        <Tabs defaultValue="add">
                          <TabsList>
                            <TabsTrigger value="add">新規教室追加</TabsTrigger>
                            <TabsTrigger value="manage">教室一覧・管理</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                  <TabsContent value="rooms">
                    <Tabs defaultValue="add">
                      <TabsList>
                        <TabsTrigger value="add">新規教室追加</TabsTrigger>
                        <TabsTrigger value="manage">教室一覧・管理</TabsTrigger>
                      </TabsList>
                      <TabsContent value="add">
                        <Card>
                          <CardHeader>
                            <CardTitle>新規教室作成</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid w-full items-center gap-4">
                              <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="roomName">教室名</Label>
                                <Input
                                  id="roomName"
                                  value={currentRoom.name}
                                  onChange={(e) => setCurrentRoom({ ...currentRoom, name: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-col space-y-1.5">
                                <Label>使用する時間帯</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {[1, 2, 3, 4, 5].map(day => (
                                    <div key={day} className="flex flex-col items-center">
                                      <span>Day {day}</span>
                                      {[1, 2, 3, 4].map(period => (
                                        <Checkbox
                                          key={`${day}-${period}`}
                                          checked={currentRoom.unavailable.some(p => p.day === day && p.period === period)}
                                          onCheckedChange={() => togglePeriod(day, period, 'room')}
                                        />
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setCurrentRoom({
                              name: '',
                              unavailable: []
                            })}>
                              クリア
                            </Button>
                            <Button onClick={createRoom}>作成</Button>
                          </CardFooter>
                        </Card>
                      </TabsContent>
                      <TabsContent value="manage">
                        <Card>
                          <CardHeader>
                            <CardTitle>教室一覧・管理</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>教室名</TableHead>
                                  <TableHead>利用可能な時間</TableHead>
                                  <TableHead>編集</TableHead>
                                  <TableHead>削除</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Array.isArray(rooms) && rooms.length > 0 ? (
                                  rooms.map((room, index) => (
                                    <TableRow key={`${room.name}-${index}`}>
                                      <TableCell>{room.name}</TableCell>
                                      <TableCell>{room.unavailable.length}</TableCell>

                                      {/* 編集ボタン */}
                                      <TableCell>
                                        <Sheet>
                                          <SheetTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setEditingRoom(room);
                                                setEditingRoomId(room.name);
                                              }}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                          </SheetTrigger>
                                          <SheetContent>
                                            <SheetHeader>
                                              <SheetTitle>教室の編集</SheetTitle>
                                              <SheetDescription>教室の情報を編集します</SheetDescription>
                                            </SheetHeader>
                                            {editingRoom && (
                                              <div className="grid gap--4 py-4">
                                                <div className="ggrid grid-cols-4 items-center gap-4">
                                                  <Label htmlFor="roomName" className="text-right">
                                                    教室名
                                                  </Label>
                                                  <Input
                                                    id="roomName"
                                                    value={editingRoom.name}
                                                    onChange={(e) =>
                                                      setEditingRoom({ ...editingRoom, name: e.target.value })}
                                                    className="col-span-3"
                                                  />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                  <Label className="text-right">使用する時間帯</Label>
                                                  <div className="col-span-3 grid grid-cols-5 gap-2">
                                                    {[1, 2, 3, 4, 5].map(day => (
                                                      <div key={day} className="flex flex-col items-center">
                                                        <span>Day {day}</span>
                                                        {[1, 2, 3, 4].map(period => (
                                                          <Checkbox
                                                            key={`${day}-${period}`}
                                                            checked={editingRoom.unavailable.some(p => p.day === day && p.period === period)}
                                                            onCheckedChange={() => {
                                                              const newPeriods = editingRoom.unavailable.some(p => p.day === day && p.period === period)
                                                                ? editingRoom.unavailable.filter(p => !(p.day === day && p.period === period))
                                                                : [...editingRoom.unavailable, { day, period }];
                                                              setEditingRoom({ ...editingRoom, unavailable: newPeriods });
                                                            }}
                                                          />
                                                        ))}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            <SheetFooter>
                                              <SheetClose asChild>
                                                <Button type="submit" onClick={handleEditRoom}>保存</Button>
                                              </SheetClose>
                                              <Button variant="outline" onClick={() => setEditingRoom(null)}>キャンセル</Button>
                                            </SheetFooter>
                                          </SheetContent>
                                        </Sheet>
                                      </TableCell>

                                      {/* 削除ボタン */}
                                      <TableCell>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                              <Trash className="w-4 h-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>教室の削除</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                本当にこの教室を削除してもよろしいですか？この操作は元に戻せません。
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteRoom(room.name)}>
                                                削除
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                      登録された教室がありません。
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
              </div>
            </main>
            <Toaster />
          </div>
        </div>
      </UserProvider>
  )
}
