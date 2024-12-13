'use client';

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function Unauthorized() {
    const router = useRouter()
    const handleTop = () => {
        router.push('/')
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-50 to-red-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-red-600">アクセス権限がありません</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-gray-600">このページにはアクセスできません。</p>
                    <p className='text-center text-gray-600'>必要な権限がない可能性があります。</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button
                        asChild
                        variant="outline"
                        onClick={handleTop}
                    >
                        <span className="flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            ホームに戻る
                        </span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
