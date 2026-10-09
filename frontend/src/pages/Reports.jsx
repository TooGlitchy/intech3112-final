import { useEffect, useMemo, useState } from 'react';
import {
    BarChart3,
    CalendarDays,
    Loader2,
    Printer,
    TrendingDown,
    TrendingUp,
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

function formatMonth(value) {
    if (!value) return '-';

    const [year, month] = value.split('-');

    return new Date(
        Number(year),
        Number(month) - 1,
        1,
    ).toLocaleDateString('en-PH', {
        month: 'short',
        year: 'numeric',
    });
}

function formatAccountType(type) {
    const labels = {
        cash: 'Cash',
        bank: 'Bank',
        e_wallet: 'E-Wallet',
        savings: 'Savings',
        investment: 'Investment',
    };

    return labels[type] || type;
}

function getDateRange(period) {
    const today = new Date();

    if (period === 'all') {
        return {
            start_date: '',
            end_date: '',
        };
    }

    if (period === 'this_month') {
        const start = new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
        );

        return {
            start_date: start.toISOString().split('T')[0],
            end_date: today.toISOString().split('T')[0],
        };
    }

    if (period === 'last_month') {
        const start = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            1,
        );

        const end = new Date(
            today.getFullYear(),
            today.getMonth(),
            0,
        );

        return {
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0],
        };
    }

    return null;
}

export default function Reports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [period, setPeriod] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    async function loadReport() {
        setLoading(true);
        setError('');

        try {
            let range = getDateRange(period);

            if (period === 'custom') {
                if (!customStart || !customEnd) {
                    setLoading(false);
                    return;
                }

                range = {
                    start_date: customStart,
                    end_date: customEnd,
                };
            }

            const params = new URLSearchParams();

            if (range?.start_date) {
                params.set('start_date', range.start_date);
            }

            if (range?.end_date) {
                params.set('end_date', range.end_date);
            }

            const query = params.toString();

            const response = await apiRequest(
                `/reports${query ? `?${query}` : ''}`,
            );

            setReport(response.data);
        } catch (err) {
            setError(err.message || 'Failed to load reports.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadReport();
    }, [period, customStart, customEnd]);

    const maxCategoryValue = useMemo(() => {
        if (!report?.expense_by_category?.length) {
            return 0;
        }

        return Math.max(
            ...report.expense_by_category.map((item) =>
                Number(item.total),
            ),
        );
    }, [report]);

    const maxMonthlyValue = useMemo(() => {
        if (!report?.monthly_activity?.length) {
            return 0;
        }

        return Math.max(
            ...report.monthly_activity.map((item) =>
                Math.max(
                    Number(item.income),
                    Number(item.expenses),
                ),
            ),
        );
    }, [report]);

    function printReport() {
        window.print();
    }

    if (loading && !report) {
        return (
            <div className="flex min-h-96 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <Loader2 size={20} className="animate-spin" />
                    Loading reports...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <BarChart3 size={17} />
                        Financial Analysis
                    </div>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Reports
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Review your financial performance and spending patterns.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={printReport}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <Printer size={17} />
                    Print Report
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 print:hidden">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-900">
                            Report Period
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            Filter income, expenses, categories, and activity.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={period}
                            onChange={(event) =>
                                setPeriod(event.target.value)
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                        >
                            <option value="all">All Time</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {period === 'custom' && (
                            <>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(event) =>
                                        setCustomStart(event.target.value)
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                                />

                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(event) =>
                                        setCustomEnd(event.target.value)
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                                />
                            </>
                        )}
                    </div>
                </div>
            </section>

            {!report ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                    Select a valid report period.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <ReportCard
                            icon={<Wallet size={20} />}
                            label="Current Balance"
                            value={formatCurrency(
                                report.summary.current_balance,
                            )}
                            helper="Across all accounts"
                        />

                        <ReportCard
                            icon={<TrendingUp size={20} />}
                            label="Income"
                            value={formatCurrency(
                                report.summary.total_income,
                            )}
                            helper="Selected period"
                            positive
                        />

                        <ReportCard
                            icon={<TrendingDown size={20} />}
                            label="Expenses"
                            value={formatCurrency(
                                report.summary.total_expenses,
                            )}
                            helper="Selected period"
                        />

                        <ReportCard
                            icon={<BarChart3 size={20} />}
                            label="Net Savings"
                            value={formatCurrency(
                                report.summary.net_savings,
                            )}
                            helper={`${Number(
                                report.summary.savings_rate || 0,
                            ).toFixed(1)}% savings rate`}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Spending by Category
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Where your expenses are going.
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                                    <TrendingDown size={18} />
                                </div>
                            </div>

                            {report.expense_by_category.length === 0 ? (
                                <EmptyState text="No expenses found for this period." />
                            ) : (
                                <div className="mt-6 space-y-5">
                                    {report.expense_by_category.map(
                                        (item) => {
                                            const percentage =
                                                maxCategoryValue > 0
                                                    ? (Number(item.total) /
                                                          maxCategoryValue) *
                                                      100
                                                    : 0;

                                            return (
                                                <div key={item.category_id}>
                                                    <div className="mb-2 flex items-center justify-between gap-4">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {item.category_name}
                                                        </span>

                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {formatCurrency(
                                                                item.total,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-slate-800"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Monthly Activity
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Income and expenses over time.
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                                    <CalendarDays size={18} />
                                </div>
                            </div>

                            {report.monthly_activity.length === 0 ? (
                                <EmptyState text="No monthly activity found." />
                            ) : (
                                <div className="mt-6 space-y-5">
                                    {report.monthly_activity.map((item) => {
                                        const incomeWidth =
                                            maxMonthlyValue > 0
                                                ? (Number(item.income) /
                                                      maxMonthlyValue) *
                                                  100
                                                : 0;

                                        const expenseWidth =
                                            maxMonthlyValue > 0
                                                ? (Number(item.expenses) /
                                                      maxMonthlyValue) *
                                                  100
                                                : 0;

                                        return (
                                            <div key={item.month}>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {formatMonth(
                                                            item.month,
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`text-sm font-semibold ${
                                                            Number(item.net) >=
                                                            0
                                                                ? 'text-emerald-600'
                                                                : 'text-red-600'
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            item.net,
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-16 text-xs text-slate-400">
                                                            Income
                                                        </span>

                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-emerald-500"
                                                                style={{
                                                                    width: `${incomeWidth}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <span className="w-24 text-right text-xs font-medium text-slate-600">
                                                            {formatCurrency(
                                                                item.income,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="w-16 text-xs text-slate-400">
                                                            Expense
                                                        </span>

                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                className="h-full rounded-full bg-slate-700"
                                                                style={{
                                                                    width: `${expenseWidth}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <span className="w-24 text-right text-xs font-medium text-slate-600">
                                                            {formatCurrency(
                                                                item.expenses,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Account Balances
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Current balance of each account.
                                </p>
                            </div>

                            <Wallet size={20} className="text-slate-500" />
                        </div>

                        {report.account_balances.length === 0 ? (
                            <EmptyState text="No accounts found." />
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {report.account_balances.map((account) => (
                                    <div
                                        key={account.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {account.name}
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatAccountType(
                                                        account.type,
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-white p-2 text-slate-500">
                                                <Wallet size={17} />
                                            </div>
                                        </div>

                                        <p className="mt-4 text-xl font-bold text-slate-900">
                                            {formatCurrency(account.balance)}
                                        </p>

                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <p className="text-slate-400">
                                                    Income
                                                </p>

                                                <p className="mt-1 font-semibold text-emerald-600">
                                                    {formatCurrency(
                                                        account.income,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-slate-400">
                                                    Expenses
                                                </p>

                                                <p className="mt-1 font-semibold text-slate-700">
                                                    {formatCurrency(
                                                        account.expenses,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Budget Progress
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Track spending against your budgets.
                            </p>
                        </div>

                        {report.budget_progress.length === 0 ? (
                            <EmptyState text="No budgets found." />
                        ) : (
                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                {report.budget_progress.map((budget) => (
                                    <div
                                        key={budget.id}
                                        className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {budget.category ||
                                                        'Uncategorized'}
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {budget.start_date} —{' '}
                                                    {budget.end_date}
                                                </p>
                                            </div>

                                            <span className="text-sm font-semibold text-slate-900">
                                                {Number(
                                                    budget.progress || 0,
                                                ).toFixed(0)}
                                                %
                                            </span>
                                        </div>

                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                                            <div
                                                className={`h-full rounded-full ${
                                                    Number(
                                                        budget.progress,
                                                    ) >= 100
                                                        ? 'bg-red-500'
                                                        : Number(
                                                                budget.progress,
                                                            ) >= 80
                                                          ? 'bg-amber-500'
                                                          : 'bg-emerald-500'
                                                }`}
                                                style={{
                                                    width: `${Math.min(
                                                        Number(
                                                            budget.progress ||
                                                                0,
                                                        ),
                                                        100,
                                                    )}%`,
                                                }}
                                            />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between text-xs">
                                            <span className="text-slate-500">
                                                Spent{' '}
                                                <strong className="text-slate-700">
                                                    {formatCurrency(
                                                        budget.spent_amount,
                                                    )}
                                                </strong>
                                            </span>

                                            <span className="text-slate-500">
                                                Remaining{' '}
                                                <strong className="text-emerald-600">
                                                    {formatCurrency(
                                                        budget.remaining_amount,
                                                    )}
                                                </strong>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Transactions
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {report.summary.transaction_count}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Savings Rate
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {Number(
                                        report.summary.savings_rate || 0,
                                    ).toFixed(1)}
                                    %
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Report Period
                                </p>

                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {report.period.start_date &&
                                    report.period.end_date
                                        ? `${report.period.start_date} → ${report.period.end_date}`
                                        : 'All Time'}
                                </p>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

function ReportCard({
    icon,
    label,
    value,
    helper,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        {helper}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="py-12 text-center text-sm text-slate-400">
            {text}
        </div>
    );
}