import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        if (password !== passwordConfirmation) {
            setError('Your passwords do not match.');
            setSubmitting(false);
            return;
        }

        try {
            await register(name, email, password, passwordConfirmation);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            const firstValidationError = Object.values(err.errors || {})[0]?.[0];
            setError(firstValidationError || err.message || 'Unable to create your account.');
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
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">INTECH 3112</p>
                                    <p className="mt-1 text-sm font-medium text-slate-300">Personal Finance</p>
                                </div>
                            </div>

                            <div className="mt-24 max-w-lg">
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">Get started</p>
                                <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight">Build better money habits.</h1>
                                <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
                                    Create your own private workspace to track accounts, income, expenses, budgets, and financial insights.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500">Your financial records are kept in your own account.</p>
                    </section>

                    <section className="bg-white p-7 text-slate-900 sm:p-10 lg:p-12">
                        <div className="mx-auto max-w-md">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 lg:hidden">
                                <Wallet size={22} />
                            </div>
                            <p className="mt-8 text-sm font-semibold text-emerald-600">Create your account</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight">Get started for free</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">Enter your details to create your personal finance workspace.</p>

                            {error && (
                                <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                                <div>
                                    <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                                    <div className="relative">
                                        <UserRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input id="name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" autoComplete="name" required maxLength={255} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                                    <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required maxLength={255} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100" />
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                                    <div className="relative">
                                        <LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
                                    <input id="password_confirmation" type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Re-enter your password" autoComplete="new-password" required minLength={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100" />
                                </div>

                                <button type="submit" disabled={submitting} className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                                    {submitting ? 'Creating account...' : 'Create account'}
                                </button>
                            </form>

                            <p className="mt-7 text-center text-sm text-slate-500">
                                Already registered?{' '}
                                <Link to="/login" className="font-semibold text-emerald-700 transition hover:text-emerald-800">Sign in</Link>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
