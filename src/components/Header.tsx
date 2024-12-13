'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function Header() {
    const router = useRouter()
    const [profileOpen, setProfileOpen] = useState(false)

    const handleDashboard = () => {
        router.push('/dashboard')
    }

    const handleSetting = () => {
        router.push('/setting')
    }

    const handleProfile = () => {
        router.push('/profile')
        setProfileOpen(false)
    }

    const handleLogout = () => {
        // Add any logout logic here (e.g., clearing tokens, etc.)
        router.push('/login')
        setProfileOpen(false)
    }

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-background border-b">
            <button
                onClick={() => router.push('/')}
                className="text-2xl font-bold hover:underline"
                aria-label="Go to home page"
            >
                Clauto
            </button>
            <nav className="flex items-center space-x-4">
                <button
                    onClick={handleDashboard}
                    className="text-sm font-medium hover:underline"
                >
                    Dashboard
                </button>
                <button
                    onClick={handleSetting}
                    className="text-sm font-medium hover:underline"
                >
                    Setting
                </button>
                <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
                    <SheetTrigger asChild>
                        <button className="text-sm font-medium hover:underline">
                            Profile
                        </button>
                    </SheetTrigger>
                    <SheetContent>
                        <div className="flex flex-col space-y-4 mt-6">
                            <h2 className="text-lg font-semibold">Profile Options</h2>
                            <Button
                                onClick={handleProfile}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                View Profile
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                Logout
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </header>
    )
}

export default Header

