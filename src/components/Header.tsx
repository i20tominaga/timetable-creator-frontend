import Link from "next/link";

export function Header() {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-background border-b">
            <Link href='/' className="text-2xl font-bold hover:underline">Clauto</Link>
            <nav className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-sm font-medium hover:underline">
                    Dashboard
                </Link>
                <Link href="/setting" className="text-sm font-medium hover:underline">
                    Setting
                </Link>
                <Link href="/profile" className="text-sm font-medium hover:underline">
                    Profile
                </Link>
            </nav>
        </header>
    );
}

export default Header;
