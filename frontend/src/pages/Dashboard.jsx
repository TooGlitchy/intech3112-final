import { useEffect, useState } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    PiggyBank,
    Wallet,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return '';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

export default function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadDashboard() {
        try {
            setLoading(true);
            setError('');

            const response = await apiRequest('/dashboard');

            setDashboard(response.data);
        } catch (err) {
            setError(
                err.message || 'Unable to load your financial dashboard.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                    <p className="mt-4 text-sm text-slate-500">
                        Loading your financial overview...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h2 className="text-lg font-semibold text-red-900">
                    Unable to load dashboard
                </h2>

                <p className="mt-2 text-sm text-red-700">
                    {error}
                </p>

                <button
                    type="button"
                    onClick={loadDashboard}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Try again
                </button>
            </div>
        );
    }

    const summary = dashboard?.summary ?? {};
    const transactions = dashboard?.recent_transactions ?? [];
    const budgets = dashboard?.budget_progress ?? [];

    const summaryCards = [
        {
            label: 'Total Balance',
            value: formatCurrency(summary.total_balance),
            note: 'Across all accounts',
            icon: Wallet,
        },
        {
            label: 'Total Income',
            value: formatCurrency(summary.total_income),
            note: 'Recorded income',
            icon: ArrowUpRight,
        },
        {
            label: 'Total Expenses',
            value: formatCurrency(summary.total_expenses),
            note: 'Recorded expenses',
            icon: ArrowDownRight,
        },
        {
            label: 'Net Savings',
            value: formatCurrency(summary.net_savings),
            note: 'Income minus expenses',
            icon: PiggyBank,
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <p className="text-sm font-medium text-emerald-600">
                    Personal Finance Dashboard
                </p>

                <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    Your financial overview
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                    Track your balance, income, expenses, and budgets in one place.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-400">
                                        {card.label}
                                    </p>

                                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                                        {card.value}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                                    <Icon size={19} />
                                </div>
                            </div>

                            <p className="mt-4 text-xs text-slate-400">
                                {card.note}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Recent Transactions
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                Your latest financial activity.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 divide-y divide-slate-100">
                        {transactions.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-sm font-medium text-slate-600">
                                    No transactions yet.
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Add a transaction to see it here.
                                </p>
                            </div>
                        ) : (
                            transactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between py-4"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {transaction.description ||
                                                transaction.category?.name ||
                                                'Transaction'}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            {transaction.category?.name || 'Uncategorized'}
                                            {' • '}
                                            {formatDate(
                                                transaction.transaction_date
                                            )}
                                        </p>
                                    </div>

                                    <p
                                        className={[
                                            'text-sm font-bold',
                                            transaction.type === 'income'
                                                ? 'text-emerald-600'
                                                : 'text-slate-900',
                                        ].join(' ')}
                                    >
                                        {transaction.type === 'income'
                                            ? '+'
                                            : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Budget Overview
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                            Current spending progress.
                        </p>
                    </div>

                    <div className="mt-6 space-y-6">
                        {budgets.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-sm font-medium text-slate-600">
                                    No budgets yet.
                                </p>
                            </div>
                        ) : (
                            budgets.slice(0, 3).map((budget) => {
                                const total = Number(
                                    budget.budget_amount || 0
                                );
                                const spent = Number(
                                    budget.spent_amount || 0
                                );

                                const percentage =
                                    total > 0
                                        ? Math.min(
                                              (spent / total) * 100,
                                              100
                                          )
                                        : 0;

                                return (
                                    <div key={budget.id}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {budget.category || 'Budget'}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {formatCurrency(spent)} of{' '}
                                                    {formatCurrency(total)}
                                                </p>
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700">
                                                {percentage.toFixed(1)}%
                                            </p>
                                        </div>

                                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-slate-900 transition-all"
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>

                                        <p className="mt-2 text-xs text-slate-400">
                                            {formatCurrency(
                                                budget.remaining_amount
                                            )}{' '}
                                            remaining
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                        <p className="text-sm text-slate-400">
                            Starting Balance
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-900">
                            {formatCurrency(summary.initial_balance)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-400">
                            Savings Rate
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-900">
                            {Number(summary.total_income) > 0
                                ? `${(
                                      (Number(summary.net_savings) /
                                          Number(summary.total_income)) *
                                      100
                                  ).toFixed(1)}%`
                                : '0.0%'}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-slate-400">
                            Active Budgets
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-900">
                            {budgets.length}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}