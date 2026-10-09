import { Bell, LogOut, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
    const { user, logout } = useAuth();

    async function handleLogout() {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                <div className="relative min-w-0 flex-1 max-w-xl">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                    />
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Notifications"
                    >
                        <Bell size={19} />
                    </button>

                    <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                    <div className="hidden items-center gap-3 sm:flex">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>

                        <div className="max-w-36">
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {user?.name || 'User'}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                                {user?.email || ''}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        title="Logout"
                    >
                        <LogOut size={17} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}