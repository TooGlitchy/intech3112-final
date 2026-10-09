import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setError('');

        try {
            await login(email, password);

            const destination = location.state?.from || '/';

            navigate(destination, {
                replace: true,
            });
        } catch (err) {
            setError(
                err.message || 'Unable to sign in. Please check your credentials.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
                <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
                    <section className="hidden bg-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950">
                                    <Wallet size={21} />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                                        INTECH 3112
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-300">
                                        Personal Finance
                                    </p>
                                </div>
                            </div>

                            <div className="mt-24 max-w-lg">
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
                                    Finance Manager
                                </p>

                                <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight">
                                    Take control of your money.
                                </h1>

                                <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                                    Manage your accounts, transactions, categories,
                                    budgets, and financial insights from one place.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs text-slate-500">Accounts</p>
                                <p className="mt-2 text-sm font-semibold">Organized</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs text-slate-500">Budgets</p>
                                <p className="mt-2 text-sm font-semibold">Tracked</p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p className="text-xs text-slate-500">Insights</p>
                                <p className="mt-2 text-sm font-semibold">Live</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-7 text-slate-900 sm:p-10 lg:p-12">
                        <div className="mx-auto max-w-md">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 lg:hidden">
                                <Wallet size={22} />
                            </div>

                            <p className="mt-8 text-sm font-semibold text-emerald-600">
                                Welcome back
                            </p>

                            <h2 className="mt-2 text-3xl font-bold tracking-tight">
                                Sign in to your account
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Enter your credentials to access your financial dashboard.
                            </p>

                            {error && (
                                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-medium text-red-800">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <form
                                onSubmit={handleSubmit}
                                className="mt-8 space-y-5"
                            >
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Email address
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Password
                                    </label>

                                    <div className="relative">
                                        <LockKeyhole
                                            size={17}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                        <input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword((current) => !current)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={17} />
                                            ) : (
                                                <Eye size={17} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting
                                        ? 'Signing in...'
                                        : 'Sign in'}
                                </button>
                            </form>

                            <p className="mt-7 text-center text-sm text-slate-500">
                                New to Personal Finance?{' '}
                                <Link
                                    to="/register"
                                    className="font-semibold text-emerald-700 transition hover:text-emerald-800"
                                >
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}