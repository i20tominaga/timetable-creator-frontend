'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('student') // サインアップ時のみ使用
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // ログイン処理
    const login = async () => {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: username, password })
        })

        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.message || 'ログインに失敗しました')
        }

        // JWTトークンを保存してダッシュボードにリダイレクト
        localStorage.setItem('token', data.token)
        console.log('Saved token:', localStorage.getItem('token')); // トークンが保存されているか確認
        router.push('/')
    }

    // サインアップ処理
    const signUp = async () => {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: username,
                name: username,
                password,
                role,
                accessLevel: role === 'teacher' ? ['read', 'write'] : ['read']
            })
        })

        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.message || 'サインアップに失敗しました')
        }

        // サインアップ成功後の処理（必要に応じてリダイレクト）
        router.push('/dashboard') // ホームページにリダイレクト
    }

    // フォーム送信処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        if (!username || !password || (!isLogin && !role)) {
            setError('すべてのフィールドを入力してください')
            setIsLoading(false)
            return
        }

        try {
            if (isLogin) {
                await login()
            } else {
                await signUp()
            }
        } catch (err) {
            setError((err as Error).message || 'エラーが発生しました')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">{isLogin ? 'ログイン' : 'サインアップ'}</CardTitle>
                    <CardDescription>
                        {isLogin ? 'アカウントにアクセスするための認証情報を入力してください' : '新しいアカウントを作成してください'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">ユーザーネーム</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="ユーザーネームを入力"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="パスワードを入力"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="role">役割</Label>
                                <Select onValueChange={(value) => setRole(value)} defaultValue="student">
                                    <SelectTrigger>
                                        <span>{role === 'teacher' ? '教師' : '学生'}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">学生</SelectItem>
                                        <SelectItem value="teacher">教師</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (isLogin ? 'ログイン中...' : 'サインアップ中...') : (isLogin ? 'ログイン' : 'サインアップ')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-600">
                        {isLogin ? "アカウントをお持ちでないですか？" : '既にアカウントをお持ちですか？'}{' '}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 hover:underline"
                        >
                            {isLogin ? 'サインアップ' : 'ログイン'}
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
