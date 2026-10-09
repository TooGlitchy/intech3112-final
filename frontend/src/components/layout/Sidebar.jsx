import { NavLink } from 'react-router-dom';
import {
    BarChart3,
    CreditCard,
    LayoutDashboard,
    List,
    PieChart,
    Tags,
    Wallet,
} from 'lucide-react';

const navigation = [
    {
        label: 'Overview',
        path: '/',
        icon: LayoutDashboard,
    },
    {
        label: 'Transactions',
        path: '/transactions',
        icon: List,
    },
    {
        label: 'Accounts',
        path: '/accounts',
        icon: Wallet,
    },
    {
        label: 'Categories',
        path: '/categories',
        icon: Tags,
    },
    {
        label: 'Budgets',
        path: '/budgets',
        icon: CreditCard,
    },
    {
        label: 'Reports',
        path: '/reports',
        icon: PieChart,
    },
];

export default function Sidebar() {
    return (
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <div className="flex h-20 items-center border-b border-slate-200 px-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                        INTECH 3112
                    </p>

                    <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                        Finance Manager
                    </h1>
                </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                                ].join(' ')
                            }
                        >
                            <Icon size={18} strokeWidth={1.8} />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 p-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-400">
                        Personal Finance
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                        Stay on top of your money.
                    </p>
                </div>
            </div>
        </aside>
    );
}