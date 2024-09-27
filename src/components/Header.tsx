import Link from "next/link";

export function Header() {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-background border-b">
            <h1 className="text-2xl font-bold">TNT ~ Timetable NITTC Tool ~</h1>
            <nav className="flex items-center space-x-4">
                <Link href="#" className="text-sm font-medium hover:underline">
                    Dashboard
                </Link>
                <Link href="#" className="text-sm font-medium hover:underline">
                    Settings
                </Link>
                <Link href="#" className="text-sm font-medium hover:underline">
                    Profile
                </Link>
            </nav>
        </header>
    );
}

export default Header;
