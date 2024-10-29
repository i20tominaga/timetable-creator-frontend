"use client"

import { Header } from "@/components/Header"
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
import axios, { AxiosResponse } from 'axios'
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

type Period = {
  day: number;
  period: number;
};

type Course = {
  id?: string;
  name: string;
  instructors: string[];
  targets: string[];
  rooms: string[];
  periods: Period[];
};

type Instructor = {
  id: string;
  name: string;
  isFullTime: boolean;
  periods: Period[];
};

export default function TimetableDashboard() {
  const [newTimetableName, setNewTimetableName] = useState("")
  const [timetables, setTimetables] = useState<TimetableList[]>([])
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null)
  const [isDeleteAll, setIsDeleteAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [courses, setCourses] = useState<Course[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
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
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editingInstructorId, setEditingInstructorId] = useState<string | null>(null)

  const router = useRouter()

  const handleEdit = (id: string) => {
    router.push(`/edit?id=${id}`)
  }

  const fetchTimetables = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:3001/api/timetable/getAll')
      setTimetables(response.data.TimeTables)
      toast.success("時間割が正常に取得されました。")
    } catch (error) {
      console.error('Error fetching timetables:', error)
      setError("時間割の取得に失敗しました。")
      toast.error("時間割の取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:3001/api/courses/getAll')
      setCourses(response.data)
      toast.success("授業が正常に取得されました。")
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError("授業の取得に失敗しました。")
      toast.error("授業の取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/instructors/getAll');
      console.log('Response data:', response.data);
      // "Instructor" 配列を取り出す
      if (response.data && Array.isArray(response.data.Instructor)) {
        const instructors = response.data.Instructor.map((instructor: Instructor) => ({
          ...instructor,
          periods: instructor.periods.map((period: Period) => ({
            day: period.day,
            period: period.period
          }))
        }));
        setInstructors(instructors);
        toast.success("教員が正常に取得されました。");
      } else {
        setError("教員の取得に失敗しました。");
        toast.error("教員データが不正です");
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setError("教員の取得に失敗しました。");
      toast.error("教員の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetables();
    fetchCourses();
    fetchInstructors();
  }, [fetchTimetables, fetchCourses, fetchInstructors]);

  useEffect(() => {
    console.log('Instructors:', instructors);
  }, [instructors]);

  const createTimetable = async () => {
    if (!newTimetableName.trim()) {
      toast.error("時間割名を入力してください。")
      return
    }

    setLoading(true)
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

  const saveCourse = async () => {
    if (currentCourse.name) {
      setLoading(true)
      try {
        let response: AxiosResponse<Course>
        if (editingCourseId) {
          response = await axios.put(`http://localhost:3001/api/courses/update/${editingCourseId}`, currentCourse)
          setCourses(courses.map(course => course.id === editingCourseId ? response.data : course))
          setEditingCourseId(null)
        } else {
          response = await axios.post('http://localhost:3001/api/courses/create', currentCourse)
          setCourses([...courses, response.data])
        }
        setCurrentCourse({
          name: '',
          instructors: [],
          targets: [],
          rooms: [],
          periods: []
        })
        toast.success(editingCourseId ? "授業が更新されました。" : "授業が保存されました。")
      } catch (error) {
        console.error("Error saving course:", error)
        setError(editingCourseId ? "授業の更新に失敗しました。" : "授業の保存に失敗しました。")
        toast.error(editingCourseId ? "授業の更新に失敗しました。" : "授業の保存に失敗しました。")
      } finally {
        setLoading(false)
      }
    }
  }

  const deleteCourse = async (id: string) => {
    setLoading(true)
    try {
      await axios.delete(`http://localhost:3001/api/courses/delete/${encodeURIComponent(id)}`)
      setCourses(courses.filter((course) => course.id !== id))
      toast.success("授業が削除されました。")
    } catch (error) {
      console.error("Error deleting course:", error)
      setError("授業の削除に失敗しました。")
      toast.error("授業の削除に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  const saveInstructor = async () => {
    if (currentInstructor.name) {
      setLoading(true)
      try {
        let response: AxiosResponse<Instructor>
        if (editingInstructorId) {
          response = await axios.put(`http://localhost:3001/api/instructors/update/${editingInstructorId}`, currentInstructor)
          setInstructors(instructors.map(instructor => instructor.id === editingInstructorId ? response.data : instructor))
          setEditingInstructorId(null)
        } else {
          response = await axios.post('http://localhost:3001/api/instructors/create', currentInstructor)
          setInstructors([...instructors, response.data])
        }
        setCurrentInstructor({
          id: '',
          name: '',
          isFullTime: true,
          periods: []
        })
        toast.success(editingInstructorId ? "教員が更新されました。" : "教員が保存されました。")
      } catch (error) {
        console.error("Error saving instructor:", error)
        setError(editingInstructorId ? "教員の更新に失敗しました。" : "教員の保存に失敗しました。")
        toast.error(editingInstructorId ? "教員の更新に失敗しました。" : "教員の保存に失敗しました。")
      } finally {
        setLoading(false)
      }
    }
  }

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

  const togglePeriod = (day: number, period: number, type: 'course' | 'instructor') => {
    const periodObj = { day, period }
    if (type === 'course') {
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
            <Tabs defaultValue="timetables">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="timetables">時間割</TabsTrigger>
                <TabsTrigger value="courses">授業</TabsTrigger>
                <TabsTrigger value="instructors">教員</TabsTrigger>
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
                              <span>{timetable.file}</span>
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
                    <TabsTrigger value="add">新規授業追加</TabsTrigger>
                    <TabsTrigger value="manage">授業一覧・管理</TabsTrigger>
                  </TabsList>
                  <TabsContent value="add">
                    <Card>
                      <CardHeader>
                        <CardTitle>新規授業追加</CardTitle>
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
                        <Button onClick={saveCourse}>授業を保存</Button>
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
                              <TableHead>操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {courses.length > 0 ? (
                              courses.map((course, index) => (
                                <TableRow key={course.id || index}>
                                  <TableCell>{course.name}</TableCell>
                                  <TableCell>{course.instructors ? course.instructors.join(', ') : 'N/A'}</TableCell>
                                  <TableCell>{course.targets ? course.targets.join(', ') : 'N/A'}</TableCell>
                                  <TableCell>{course.rooms ? course.rooms.join(', ') : 'N/A'}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button variant="outline" size="sm" onClick={() => {
                                        setCurrentCourse(course)
                                        setEditingCourseId(course.id ?? null)
                                      }}>
                                        <Edit className="w-4 h-4" />
                                      </Button>
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
                                                if (course.id) {
                                                  deleteCourse(course.id)
                                                }
                                              }}
                                            >
                                              削除
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center">登録された授業がありません。</TableCell>
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
                        <Button onClick={saveInstructor}>教員を保存</Button>
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
                              <TableHead>操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {instructors.length > 0 ? (
                              instructors.map((instructor, index) => (
                                <TableRow key={`${instructor.id}-${index}`}>
                                  <TableCell>{instructor.name}</TableCell>
                                  <TableCell>{instructor.isFullTime ? 'はい' : 'いいえ'}</TableCell>
                                  <TableCell>{instructor.periods.length} コマ</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setCurrentInstructor(instructor);
                                          setEditingInstructorId(instructor.id);
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
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
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center">
                                  登録された教員がありません。
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
  )
}
