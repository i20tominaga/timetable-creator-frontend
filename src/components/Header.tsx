import { useRouter } from 'next/navigation';

export function Header() {
    const router = useRouter();

    // ダッシュボードへの遷移
    const handleDashboard = () => {
        router.push('/dashboard');
    }

    // 設定画面への遷移
    const handleSetting = () => {
        router.push('/setting');
    }

    // プロフィール画面への遷移
    const handleProfile = () => {
        router.push('/profile');
    }

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-background border-b">
            {/* ホームへのリンク */}
            <button
                onClick={() => router.push('/')}
                className="text-2xl font-bold hover:underline"
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
                <button
                    onClick={handleProfile}
                    className="text-sm font-medium hover:underline"
                >
                    Profile
                </button>
            </nav>
        </header>
    );
}

export default Header;
