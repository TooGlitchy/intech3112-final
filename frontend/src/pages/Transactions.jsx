import { useEffect, useMemo, useState } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarDays,
    ChevronDown,
    Edit3,
    Plus,
    Search,
    Trash2,
    WalletCards,
    X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const emptyForm = {
    account_id: '',
    category_id: '',
    type: 'expense',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().slice(0, 10),
};

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [pageError, setPageError] = useState('');
    const [formError, setFormError] = useState('');

    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('all');

    const [showForm, setShowForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState(emptyForm);

    async function loadData() {
        try {
            setLoading(true);
            setPageError('');

            const [transactionResponse, accountResponse, categoryResponse] =
                await Promise.all([
                    apiRequest('/transactions'),
                    apiRequest('/accounts'),
                    apiRequest('/categories'),
                ]);

            setTransactions(transactionResponse.data || []);
            setAccounts(accountResponse.data || []);
            setCategories(categoryResponse.data || []);
        } catch (error) {
            setPageError(
                error.message || 'Unable to load transaction information.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const filteredTransactions = useMemo(() => {
        const query = search.trim().toLowerCase();

        return transactions.filter((transaction) => {
            const matchesType =
                filterType === 'all' || transaction.type === filterType;

            const searchableText = [
                transaction.description,
                transaction.category?.name,
                transaction.account?.name,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesSearch =
                !query || searchableText.includes(query);

            return matchesType && matchesSearch;
        });
    }, [transactions, search, filterType]);

    const totals = useMemo(() => {
        return transactions.reduce(
            (accumulator, transaction) => {
                const amount = Number(transaction.amount || 0);

                if (transaction.type === 'income') {
                    accumulator.income += amount;
                } else {
                    accumulator.expense += amount;
                }

                return accumulator;
            },
            {
                income: 0,
                expense: 0,
            },
        );
    }, [transactions]);

    const visibleCategories = categories.filter(
        (category) => category.type === form.type,
    );

    function openCreateForm() {
        setEditingTransaction(null);
        setFormError('');

        setForm({
            ...emptyForm,
            transaction_date: getToday(),
        });

        setShowForm(true);
    }

    function openEditForm(transaction) {
        setEditingTransaction(transaction);
        setFormError('');

        setForm({
            account_id: String(transaction.account_id),
            category_id: String(transaction.category_id),
            type: transaction.type,
            amount: String(transaction.amount),
            description: transaction.description || '',
            transaction_date: String(transaction.transaction_date).slice(
                0,
                10,
            ),
        });

        setShowForm(true);
    }

    function closeForm() {
        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingTransaction(null);
        setFormError('');
    }

    function updateForm(field, value) {
        setForm((current) => {
            const updated = {
                ...current,
                [field]: value,
            };

            if (field === 'type') {
                const matchingCategory = categories.find(
                    (category) =>
                        category.type === value &&
                        String(category.id) === String(current.category_id),
                );

                if (!matchingCategory) {
                    updated.category_id = '';
                }
            }

            return updated;
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setFormError('');

        try {
            const payload = {
                account_id: Number(form.account_id),
                category_id: Number(form.category_id),
                type: form.type,
                amount: Number(form.amount),
                description: form.description.trim() || null,
                transaction_date: form.transaction_date,
            };

            if (editingTransaction) {
                await apiRequest(
                    `/transactions/${editingTransaction.id}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                    },
                );
            } else {
                await apiRequest('/transactions', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            closeForm();
            await loadData();
        } catch (error) {
            if (error.errors) {
                const firstError = Object.values(error.errors)
                    .flat()
                    .find(Boolean);

                setFormError(
                    firstError ||
                        error.message ||
                        'Please correct the form and try again.',
                );
            } else {
                setFormError(
                    error.message ||
                        'Unable to save the transaction.',
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);

        try {
            await apiRequest(
                `/transactions/${deleteTarget.id}`,
                {
                    method: 'DELETE',
                },
            );

            setDeleteTarget(null);
            await loadData();
        } catch (error) {
            setPageError(
                error.message || 'Unable to delete the transaction.',
            );
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

                    <p className="mt-4 text-sm text-slate-500">
                        Loading transactions...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="text-sm font-medium text-emerald-600">
                        Financial Activity
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        Transactions
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage and review your income and expenses.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    <Plus size={18} />
                    Add Transaction
                </button>
            </div>

            {pageError && (
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div>
                        <p className="text-sm font-semibold text-red-900">
                            Something went wrong
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                            {pageError}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setPageError('')}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-100"
                    >
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">
                                Total Income
                            </p>

                            <p className="mt-2 text-2xl font-bold text-emerald-600">
                                {formatCurrency(totals.income)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <ArrowUpRight size={20} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400">
                                Total Expenses
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {formatCurrency(totals.expense)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                            <ArrowDownRight size={20} />
                        </div>
                    </div>
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-md">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search description, category, or account..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(event) =>
                                setFilterType(event.target.value)
                            }
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                        >
                            <option value="all">All transactions</option>
                            <option value="income">Income only</option>
                            <option value="expense">Expenses only</option>
                        </select>

                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <WalletCards size={24} />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            No transactions found
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            Try another search or add a new income or expense transaction.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Transaction
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Account
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Category
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Amount
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={[
                                                        'flex h-10 w-10 items-center justify-center rounded-xl',
                                                        transaction.type ===
                                                        'income'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-slate-100 text-slate-600',
                                                    ].join(' ')}
                                                >
                                                    {transaction.type ===
                                                    'income' ? (
                                                        <ArrowUpRight
                                                            size={18}
                                                        />
                                                    ) : (
                                                        <ArrowDownRight
                                                            size={18}
                                                        />
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {transaction.description ||
                                                            'Untitled transaction'}
                                                    </p>

                                                    <p className="mt-1 text-xs capitalize text-slate-400">
                                                        {transaction.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {transaction.account?.name ||
                                                '—'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                {transaction.category?.name ||
                                                    '—'}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <CalendarDays size={15} />
                                                {formatDate(
                                                    transaction.transaction_date,
                                                )}
                                            </div>
                                        </td>

                                        <td
                                            className={[
                                                'px-5 py-4 text-right text-sm font-bold',
                                                transaction.type === 'income'
                                                    ? 'text-emerald-600'
                                                    : 'text-slate-900',
                                            ].join(' ')}
                                        >
                                            {transaction.type === 'income'
                                                ? '+'
                                                : '-'}
                                            {formatCurrency(transaction.amount)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(transaction)
                                                    }
                                                    className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                                    aria-label="Edit transaction"
                                                >
                                                    <Edit3 size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDeleteTarget(
                                                            transaction,
                                                        )
                                                    }
                                                    className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50"
                                                    aria-label="Delete transaction"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                                    {editingTransaction
                                        ? 'Edit transaction'
                                        : 'New transaction'}
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {editingTransaction
                                        ? 'Update transaction'
                                        : 'Record a transaction'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            {formError && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-medium text-red-800">
                                        {formError}
                                    </p>
                                </div>
                            )}

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="transaction-type"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Type
                                    </label>

                                    <select
                                        id="transaction-type"
                                        value={form.type}
                                        onChange={(event) =>
                                            updateForm(
                                                'type',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    >
                                        <option value="expense">
                                            Expense
                                        </option>

                                        <option value="income">
                                            Income
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="transaction-amount"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Amount
                                    </label>

                                    <input
                                        id="transaction-amount"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.amount}
                                        onChange={(event) =>
                                            updateForm(
                                                'amount',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="transaction-account"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Account
                                    </label>

                                    <select
                                        id="transaction-account"
                                        value={form.account_id}
                                        onChange={(event) =>
                                            updateForm(
                                                'account_id',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    >
                                        <option value="">
                                            Select an account
                                        </option>

                                        {accounts.map((account) => (
                                            <option
                                                key={account.id}
                                                value={account.id}
                                            >
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="transaction-category"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Category
                                    </label>

                                    <select
                                        id="transaction-category"
                                        value={form.category_id}
                                        onChange={(event) =>
                                            updateForm(
                                                'category_id',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    >
                                        <option value="">
                                            Select a category
                                        </option>

                                        {visibleCategories.map((category) => (
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
                                    <label
                                        htmlFor="transaction-date"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Date
                                    </label>

                                    <input
                                        id="transaction-date"
                                        type="date"
                                        value={form.transaction_date}
                                        onChange={(event) =>
                                            updateForm(
                                                'transaction_date',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="transaction-description"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Description
                                </label>

                                <input
                                    id="transaction-description"
                                    type="text"
                                    value={form.description}
                                    onChange={(event) =>
                                        updateForm(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Example: Grocery shopping"
                                    maxLength={255}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting
                                        ? 'Saving...'
                                        : editingTransaction
                                          ? 'Save Changes'
                                          : 'Create Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <Trash2 size={21} />
                        </div>

                        <h2 className="mt-5 text-xl font-bold text-slate-900">
                            Delete transaction?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            This will permanently remove{' '}
                            <span className="font-semibold text-slate-700">
                                {deleteTarget.description ||
                                    'this transaction'}
                            </span>{' '}
                            from your records.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting
                                    ? 'Deleting...'
                                    : 'Delete Transaction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}