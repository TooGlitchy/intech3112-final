import { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    CalendarDays,
    Check,
    ChevronDown,
    Edit3,
    Loader2,
    Plus,
    Search,
    Target,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const emptyForm = {
    category_id: '',
    amount: '',
    start_date: '',
    end_date: '',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return '-';

    return new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getBudgetStatus(startDate, endDate) {
    const today = getToday();

    if (today < startDate) {
        return {
            label: 'Upcoming',
            className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }

    if (today > endDate) {
        return {
            label: 'Ended',
            className: 'bg-slate-100 text-slate-600 border-slate-200',
        };
    }

    return {
        label: 'Active',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
}

function getProgress(spent, budget) {
    if (!budget || budget <= 0) return 0;

    return Math.min((Number(spent) / Number(budget)) * 100, 100);
}

export default function Budgets() {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [showModal, setShowModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    async function loadData() {
        setLoading(true);
        setError('');

        try {
            const [budgetResponse, categoryResponse, transactionResponse] =
                await Promise.all([
                    apiRequest('/budgets'),
                    apiRequest('/categories'),
                    apiRequest('/transactions'),
                ]);

            setBudgets(budgetResponse.data || []);

            setCategories(
                (categoryResponse.data || []).filter(
                    (category) => category.type === 'expense',
                ),
            );

            setTransactions(transactionResponse.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load budgets.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const expenseTransactions = useMemo(
        () =>
            transactions.filter(
                (transaction) => transaction.type === 'expense',
            ),
        [transactions],
    );

    function getSpentAmount(budget) {
        return expenseTransactions
            .filter((transaction) => {
                return (
                    Number(transaction.category_id) ===
                        Number(budget.category_id) &&
                    transaction.transaction_date >= budget.start_date &&
                    transaction.transaction_date <= budget.end_date
                );
            })
            .reduce(
                (total, transaction) =>
                    total + Number(transaction.amount || 0),
                0,
            );
    }

    const budgetRows = useMemo(() => {
        return budgets.map((budget) => {
            const spent = getSpentAmount(budget);
            const amount = Number(budget.amount || 0);
            const remaining = Math.max(amount - spent, 0);
            const progress = getProgress(spent, amount);

            return {
                ...budget,
                spent,
                amount,
                remaining,
                progress,
                status: getBudgetStatus(
                    budget.start_date,
                    budget.end_date,
                ),
            };
        });
    }, [budgets, expenseTransactions]);

    const filteredBudgets = useMemo(() => {
        const query = search.trim().toLowerCase();

        return budgetRows.filter((budget) => {
            const categoryName =
                budget.category?.name?.toLowerCase() || '';

            const matchesSearch =
                !query ||
                categoryName.includes(query) ||
                String(budget.amount).includes(query);

            const matchesStatus =
                statusFilter === 'all' ||
                budget.status.label.toLowerCase() === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [budgetRows, search, statusFilter]);

    const summary = useMemo(() => {
        const totalBudget = budgetRows.reduce(
            (sum, budget) => sum + budget.amount,
            0,
        );

        const totalSpent = budgetRows.reduce(
            (sum, budget) => sum + budget.spent,
            0,
        );

        const totalRemaining = budgetRows.reduce(
            (sum, budget) => sum + budget.remaining,
            0,
        );

        const active = budgetRows.filter(
            (budget) => budget.status.label === 'Active',
        ).length;

        return {
            totalBudget,
            totalSpent,
            totalRemaining,
            active,
        };
    }, [budgetRows]);

    function openAddModal() {
        setEditingBudget(null);

        setForm({
            category_id: categories[0]?.id?.toString() || '',
            amount: '',
            start_date: getToday(),
            end_date: getToday(),
        });

        setFormError('');
        setShowModal(true);
    }

    function openEditModal(budget) {
        setEditingBudget(budget);

        setForm({
            category_id: budget.category_id?.toString() || '',
            amount: budget.amount?.toString() || '',
            start_date: budget.start_date || '',
            end_date: budget.end_date || '',
        });

        setFormError('');
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        setEditingBudget(null);
        setForm(emptyForm);
        setFormError('');
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setFormError('');

        try {
            if (
                !form.category_id ||
                !form.amount ||
                !form.start_date ||
                !form.end_date
            ) {
                throw new Error('Please complete all required fields.');
            }

            if (Number(form.amount) <= 0) {
                throw new Error(
                    'Budget amount must be greater than zero.',
                );
            }

            if (form.end_date < form.start_date) {
                throw new Error(
                    'End date must be on or after the start date.',
                );
            }

            const payload = {
                category_id: Number(form.category_id),
                amount: Number(form.amount),
                start_date: form.start_date,
                end_date: form.end_date,
            };

            if (editingBudget) {
                await apiRequest(`/budgets/${editingBudget.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await apiRequest('/budgets', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            closeModal();
            await loadData();
        } catch (err) {
            const validationMessages = Object.values(
                err.errors || {},
            ).flat();

            setFormError(
                validationMessages.length
                    ? validationMessages.join(' ')
                    : err.message || 'Failed to save budget.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;

        setDeleting(true);
        setError('');

        try {
            await apiRequest(`/budgets/${deleteTarget.id}`, {
                method: 'DELETE',
            });

            setDeleteTarget(null);
            await loadData();
        } catch (err) {
            setError(err.message || 'Failed to delete budget.');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <Target size={17} />
                        Financial Planning
                    </div>

                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Budgets
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Set spending limits and monitor progress against your
                        actual expenses.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                    <Plus size={18} />
                    Add Budget
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />

                    <div className="flex-1">
                        {error}
                    </div>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="rounded-lg p-1 hover:bg-red-100"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    icon={<Wallet size={20} />}
                    label="Total Budget"
                    value={formatCurrency(summary.totalBudget)}
                    helper={`${budgetRows.length} total budget${
                        budgetRows.length === 1 ? '' : 's'
                    }`}
                />

                <SummaryCard
                    icon={<Target size={20} />}
                    label="Total Spent"
                    value={formatCurrency(summary.totalSpent)}
                    helper="Tracked expenses"
                />

                <SummaryCard
                    icon={<Check size={20} />}
                    label="Remaining"
                    value={formatCurrency(summary.totalRemaining)}
                    helper="Available budget"
                />

                <SummaryCard
                    icon={<CalendarDays size={20} />}
                    label="Active Budgets"
                    value={summary.active}
                    helper="Currently running"
                />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Budget Overview
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Compare planned spending with actual expenses.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative min-w-0 sm:w-64">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search budgets..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ended">Ended</option>
                                </select>

                                <ChevronDown
                                    size={16}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex min-h-72 items-center justify-center">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <Loader2
                                size={20}
                                className="animate-spin"
                            />
                            Loading budgets...
                        </div>
                    </div>
                ) : filteredBudgets.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Target size={25} />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            No budgets found
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            Create a budget to start monitoring your spending.
                        </p>

                        <button
                            type="button"
                            onClick={openAddModal}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            <Plus size={17} />
                            Create Budget
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-2">
                        {filteredBudgets.map((budget) => (
                            <BudgetCard
                                key={budget.id}
                                budget={budget}
                                onEdit={() => openEditModal(budget)}
                                onDelete={() => setDeleteTarget(budget)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {editingBudget
                                        ? 'Edit Budget'
                                        : 'Add Budget'}
                                </h2>

                                <p className="mt-0.5 text-sm text-slate-500">
                                    {editingBudget
                                        ? 'Update your budget details.'
                                        : 'Create a new spending budget.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5">
                            {formError && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Expense Category
                                    </label>

                                    <select
                                        name="category_id"
                                        value={form.category_id}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                                    >
                                        <option value="">
                                            Select expense category
                                        </option>

                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Budget Amount
                                    </label>

                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                                            ₱
                                        </span>

                                        <input
                                            type="number"
                                            name="amount"
                                            value={form.amount}
                                            onChange={handleChange}
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm text-slate-900 outline-none focus:border-slate-400"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Start Date
                                        </label>

                                        <input
                                            type="date"
                                            name="start_date"
                                            value={form.start_date}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            End Date
                                        </label>

                                        <input
                                            type="date"
                                            name="end_date"
                                            value={form.end_date}
                                            onChange={handleChange}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2
                                            size={17}
                                            className="animate-spin"
                                        />
                                    )}

                                    {editingBudget
                                        ? 'Save Changes'
                                        : 'Create Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                            <Trash2 size={21} />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-slate-900">
                            Delete Budget?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This will permanently remove the{' '}
                            <strong className="text-slate-700">
                                {deleteTarget.category?.name || 'selected'}
                            </strong>{' '}
                            budget. Your transactions will not be deleted.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting && (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                )}

                                Delete Budget
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon, label, value, helper }) {
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

function BudgetCard({ budget, onEdit, onDelete }) {
    const overBudget = budget.spent > budget.amount;

    return (
        <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 transition hover:border-slate-300 hover:bg-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                            {budget.category?.name || 'Uncategorized'}
                        </h3>

                        <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${budget.status.className}`}
                        >
                            {budget.status.label}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        {formatDate(budget.start_date)} —{' '}
                        {formatDate(budget.end_date)}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        title="Edit"
                    >
                        <Edit3 size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Budget
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatCurrency(budget.amount)}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Spent
                    </p>

                    <p
                        className={`mt-1 text-sm font-semibold ${
                            overBudget
                                ? 'text-red-600'
                                : 'text-slate-900'
                        }`}
                    >
                        {formatCurrency(budget.spent)}
                    </p>
                </div>

                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Remaining
                    </p>

                    <p
                        className={`mt-1 text-sm font-semibold ${
                            overBudget
                                ? 'text-red-600'
                                : 'text-emerald-600'
                        }`}
                    >
                        {formatCurrency(budget.remaining)}
                    </p>
                </div>
            </div>

            <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">
                        Spending Progress
                    </span>

                    <span
                        className={`font-semibold ${
                            overBudget
                                ? 'text-red-600'
                                : 'text-slate-700'
                        }`}
                    >
                        {budget.progress.toFixed(0)}%
                    </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                        className={`h-full rounded-full transition-all ${
                            overBudget
                                ? 'bg-red-500'
                                : budget.progress >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                        }`}
                        style={{ width: `${budget.progress}%` }}
                    />
                </div>
            </div>
        </article>
    );
}
