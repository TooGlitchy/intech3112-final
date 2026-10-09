import { useEffect, useMemo, useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Edit3,
    Plus,
    Search,
    Tags,
    Trash2,
    X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

const emptyForm = {
    name: '',
    type: 'expense',
};

function getCategoryIcon(type) {
    return type === 'income' ? ArrowUpRight : ArrowDownLeft;
}

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [pageError, setPageError] = useState('');
    const [formError, setFormError] = useState('');

    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState('expense');

    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState(emptyForm);

    async function loadData() {
        try {
            setLoading(true);
            setPageError('');

            const [categoryResponse, transactionResponse] =
                await Promise.all([
                    apiRequest('/categories'),
                    apiRequest('/transactions'),
                ]);

            setCategories(categoryResponse.data || []);
            setTransactions(transactionResponse.data || []);
        } catch (error) {
            setPageError(
                error.message || 'Unable to load categories.',
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const categoryUsage = useMemo(() => {
        return transactions.reduce((usage, transaction) => {
            const categoryId = String(transaction.category_id);

            usage[categoryId] = (usage[categoryId] || 0) + 1;

            return usage;
        }, {});
    }, [transactions]);

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();

        return categories.filter((category) => {
            if (category.type !== activeType) {
                return false;
            }

            if (!query) {
                return true;
            }

            return category.name.toLowerCase().includes(query);
        });
    }, [categories, activeType, search]);

    const counts = useMemo(() => {
        return {
            income: categories.filter(
                (category) => category.type === 'income',
            ).length,
            expense: categories.filter(
                (category) => category.type === 'expense',
            ).length,
        };
    }, [categories]);

    function openCreateForm() {
        setEditingCategory(null);
        setFormError('');

        setForm({
            name: '',
            type: activeType,
        });

        setShowForm(true);
    }

    function openEditForm(category) {
        setEditingCategory(category);
        setFormError('');

        setForm({
            name: category.name,
            type: category.type,
        });

        setShowForm(true);
    }

    function closeForm() {
        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingCategory(null);
        setFormError('');
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setFormError('');

        try {
            const payload = {
                name: form.name.trim(),
                type: form.type,
            };

            if (editingCategory) {
                await apiRequest(
                    `/categories/${editingCategory.id}`,
                    {
                        method: 'PUT',
                        body: JSON.stringify(payload),
                    },
                );
            } else {
                await apiRequest('/categories', {
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
                    error.message ||
                        'Unable to save the category.',
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
                `/categories/${deleteTarget.id}`,
                {
                    method: 'DELETE',
                },
            );

            setDeleteTarget(null);
            await loadData();
        } catch (error) {
            setPageError(
                error.message ||
                    'Unable to delete this category.',
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
                        Loading categories...
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
                        Classification
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                        Categories
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Organize your income and expenses into meaningful groups.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    <Plus size={18} />
                    Add Category
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
                <button
                    type="button"
                    onClick={() => setActiveType('expense')}
                    className={[
                        'rounded-2xl border p-5 text-left transition',
                        activeType === 'expense'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
                    ].join(' ')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className={[
                                    'text-sm font-medium',
                                    activeType === 'expense'
                                        ? 'text-slate-300'
                                        : 'text-slate-400',
                                ].join(' ')}
                            >
                                Expense Categories
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {counts.expense}
                            </p>
                        </div>

                        <ArrowDownLeft size={25} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveType('income')}
                    className={[
                        'rounded-2xl border p-5 text-left transition',
                        activeType === 'income'
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
                    ].join(' ')}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className={[
                                    'text-sm font-medium',
                                    activeType === 'income'
                                        ? 'text-emerald-100'
                                        : 'text-slate-400',
                                ].join(' ')}
                            >
                                Income Categories
                            </p>

                            <p className="mt-2 text-3xl font-bold">
                                {counts.income}
                            </p>
                        </div>

                        <ArrowUpRight size={25} />
                    </div>
                </button>
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
                        placeholder={`Search ${
                            activeType === 'income'
                                ? 'income'
                                : 'expense'
                        } categories...`}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
                    />
                </div>

                {filteredCategories.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Tags size={24} />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                            No categories found
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                            Add a category to organize your{' '}
                            {activeType === 'income'
                                ? 'income'
                                : 'expenses'}.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredCategories.map((category) => {
                            const Icon = getCategoryIcon(
                                category.type,
                            );

                            const usage =
                                categoryUsage[String(category.id)] || 0;

                            return (
                                <article
                                    key={category.id}
                                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={[
                                                    'flex h-11 w-11 items-center justify-center rounded-xl',
                                                    category.type === 'income'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-slate-100 text-slate-700',
                                                ].join(' ')}
                                            >
                                                <Icon size={20} />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {category.name}
                                                </h3>

                                                <p className="mt-1 text-xs capitalize text-slate-400">
                                                    {category.type}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditForm(category)
                                                }
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                                                aria-label="Edit category"
                                            >
                                                <Edit3 size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setDeleteTarget(category)
                                                }
                                                className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600"
                                                aria-label="Delete category"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-6 border-t border-slate-100 pt-4">
                                        <p className="text-xs text-slate-400">
                                            Transactions
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-slate-900">
                                            {usage}
                                        </p>
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
                                    {editingCategory
                                        ? 'Edit category'
                                        : 'New category'}
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    {editingCategory
                                        ? 'Update category'
                                        : 'Add a category'}
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
                                    htmlFor="category-name"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Category name
                                </label>

                                <input
                                    id="category-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    placeholder="Example: Groceries"
                                    maxLength={100}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="category-type"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Category type
                                </label>

                                <select
                                    id="category-type"
                                    value={form.type}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            type: event.target.value,
                                        }))
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
                                        : editingCategory
                                          ? 'Save Changes'
                                          : 'Create Category'}
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
                            Delete category?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            You are about to delete{' '}
                            <span className="font-semibold text-slate-700">
                                {deleteTarget.name}
                            </span>
                            . Categories used by existing transactions cannot be deleted.
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
                                {deleting ? 'Deleting...' : 'Delete Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}