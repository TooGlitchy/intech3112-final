import { useEffect, useMemo, useState } from 'react';
import {
    Building2,
    CreditCard,
    Edit3,
    Landmark,
    Plus,
    Search,
    Trash2,
    Wallet,
    X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const accountTypes = [
    { value: 'cash', label: 'Cash', icon: Wallet },
    { value: 'bank', label: 'Bank', icon: Landmark },
    { value: 'e_wallet', label: 'E-Wallet', icon: CreditCard },
    { value: 'savings', label: 'Savings', icon: Building2 },
    { value: 'investment', label: 'Investment', icon: Landmark },
];

const emptyForm = {
    name: '',
    type: 'bank',
    initial_balance: '',
};

function formatCurrency(value) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number(value || 0));
}

export default function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [pageError, setPageError] = useState('');
    const [formError, setFormError] = useState('');

    const [search, setSearch] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState(emptyForm);

    async function loadData() {
        try {
            setLoading(true);
            setPageError('');

            const [accountResponse, transactionResponse] =
                await Promise.all([
                    apiRequest('/accounts'),
                    apiRequest('/transactions'),
                ]);

            setAccounts(accountResponse.data || []);
            setTransactions(transactionResponse.data || []);
        } catch (error) {
            setPageError(
                error.message || 'Unable to load your accounts.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const enrichedAccounts = useMemo(() => {
        return accounts.map((account) => {
            const accountTransactions = transactions.filter(
                (transaction) =>
                    Number(transaction.account_id) === Number(account.id),
            );

            const income = accountTransactions
                .filter((transaction) => transaction.type === 'income')
                .reduce(
                    (sum, transaction) =>
                        sum + Number(transaction.amount || 0),
                    0,
                );

            const expenses = accountTransactions
                .filter((transaction) => transaction.type === 'expense')
                .reduce(
                    (sum, transaction) =>
                        sum + Number(transaction.amount || 0),
                    0,
                );

            const currentBalance =
                Number(account.initial_balance || 0) +
                income -
                expenses;

            return {
                ...account,
                transactionCount: accountTransactions.length,
                currentBalance,
            };
        });
    }, [accounts, transactions]);

    const filteredAccounts = useMemo(() => {
        const query = search.trim().toLowerCase();

        return enrichedAccounts.filter((account) => {
            if (!query) {
                return true;
            }

            return [account.name, account.type]
                .join(' ')
                .toLowerCase()
                .includes(query);
        });
    }, [enrichedAccounts, search]);

    const totalBalance = useMemo(
        () =>
            enrichedAccounts.reduce(
                (sum, account) => sum + account.currentBalance,
                0,
            ),
        [enrichedAccounts],
    );

    function openCreateForm() {
        setEditingAccount(null);
        setFormError('');
        setForm(emptyForm);
        setShowForm(true);
    }

    function openEditForm(account) {
        setEditingAccount(account);
        setFormError('');

        setForm({
            name: account.name,
            type: account.type,
            initial_balance: String(account.initial_balance || ''),
        });

        setShowForm(true);
    }

    function closeForm() {
        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingAccount(null);
        setFormError('');
    }

    function updateForm(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setFormError('');

        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
                initial_balance: Number(form.initial_balance || 0),
            };

            if (editingAccount) {
                await apiRequest(`/accounts/${editingAccount.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await apiRequest('/accounts', {
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
                        'Please correct the form.',
                );
            } else {
                setFormError(
                    error.message || 'Unable to save the account.',
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
            await apiRequest(`/accounts/${deleteTarget.id}`, {
                method: 'DELETE',
            });

            setDeleteTarget(null);
            await loadData();
        } catch (error) {
            setPageError(
                error.message ||
                    'Unable to delete this account.',
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
                        Loading accounts...
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
                        Money Management
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        Accounts
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage where your money is stored and track each balance.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    <Plus size={18} />
                    Add Account
                </button>
            </div>

            {pageError && (
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div>
                        <p className="text-sm font-semibold text-red-900">
                            Unable to complete the request
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
                    <p className="text-sm font-medium text-slate-400">
                        Total Accounts
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {accounts.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-400">
                        Total Current Balance
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {formatCurrency(totalBalance)}
                    </p>
                </div>
            </div>

            <section className="space-y-5">
                <div className="relative max-w-md">
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
                        placeholder="Search accounts..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
                    />
                </div>

                {filteredAccounts.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Wallet size={24} />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            No accounts found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Create an account to start tracking your money.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredAccounts.map((account) => {
                            const type =
                                accountTypes.find(
                                    (item) =>
                                        item.value === account.type,
                                ) || accountTypes[0];

                            const Icon = type.icon;

                            return (
                                <article
                                    key={account.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                                                <Icon size={20} />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {account.name}
                                                </h3>

                                                <p className="mt-1 text-xs capitalize text-slate-400">
                                                    {type.label}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(account)
                                                }
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                                                aria-label="Edit account"
                                            >
                                                <Edit3 size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteTarget(account)
                                                }
                                                className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                aria-label="Delete account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-7">
                                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                                            Current balance
                                        </p>

                                        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                            {formatCurrency(
                                                account.currentBalance,
                                            )}
                                        </p>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Starting balance
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {formatCurrency(
                                                    account.initial_balance,
                                                )}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-400">
                                                Transactions
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {account.transactionCount}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                                    {editingAccount
                                        ? 'Edit account'
                                        : 'New account'}
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {editingAccount
                                        ? 'Update account'
                                        : 'Add an account'}
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

                            <div>
                                <label
                                    htmlFor="account-name"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Account name
                                </label>

                                <input
                                    id="account-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(event) =>
                                        updateForm(
                                            'name',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Example: Main Bank Account"
                                    required
                                    maxLength={100}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="account-type"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Account type
                                </label>

                                <select
                                    id="account-type"
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
                                    {accountTypes.map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="account-balance"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Initial balance
                                </label>

                                <input
                                    id="account-balance"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.initial_balance}
                                    onChange={(event) =>
                                        updateForm(
                                            'initial_balance',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="0.00"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {submitting
                                        ? 'Saving...'
                                        : editingAccount
                                          ? 'Save Changes'
                                          : 'Create Account'}
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
                            Delete account?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            You are about to delete{' '}
                            <span className="font-semibold text-slate-700">
                                {deleteTarget.name}
                            </span>
                            . Accounts containing transactions cannot be deleted.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleting}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}