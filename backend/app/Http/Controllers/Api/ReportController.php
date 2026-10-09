<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $user = $request->user();

        $startDate = $validated['start_date'] ?? null;
        $endDate = $validated['end_date'] ?? null;

        $transactions = $user->transactions();

        if ($startDate) {
            $transactions->whereDate('transaction_date', '>=', $startDate);
        }

        if ($endDate) {
            $transactions->whereDate('transaction_date', '<=', $endDate);
        }

        $totalIncome = (clone $transactions)
            ->where('type', 'income')
            ->sum('amount');

        $totalExpenses = (clone $transactions)
            ->where('type', 'expense')
            ->sum('amount');

        $netSavings = $totalIncome - $totalExpenses;

        $transactionCount = (clone $transactions)->count();

        $savingsRate = $totalIncome > 0
            ? ($netSavings / $totalIncome) * 100
            : 0;

        /*
         * Current balance is always the user's current
         * all-time balance, not just the selected report period.
         */
        $initialBalance = $user->accounts()->sum('initial_balance');

        $allTimeIncome = $user->transactions()
            ->where('type', 'income')
            ->sum('amount');

        $allTimeExpenses = $user->transactions()
            ->where('type', 'expense')
            ->sum('amount');

        $currentBalance =
            $initialBalance +
            $allTimeIncome -
            $allTimeExpenses;

        $expenseByCategory = (clone $transactions)
            ->join('categories', 'transactions.category_id', '=', 'categories.id')
            ->where('transactions.type', 'expense')
            ->select(
                'transactions.category_id',
                'categories.name as category_name',
                DB::raw('SUM(transactions.amount) as total')
            )
            ->groupBy(
                'transactions.category_id',
                'categories.name'
            )
            ->orderByDesc('total')
            ->get();

        // Keep month grouping portable across MySQL (local development) and
        // PostgreSQL (hosted deployment) by aggregating the already-filtered
        // transaction rows in PHP instead of using DATE_FORMAT().
        $monthlyTransactions = (clone $transactions)
            ->select('transaction_date', 'type', 'amount')
            ->orderBy('transaction_date')
            ->get();

        $monthlyActivity = [];

        foreach ($monthlyTransactions as $row) {
            $month = \Illuminate\Support\Carbon::parse(
                $row->transaction_date
            )->format('Y-m');

            if (!isset($monthlyActivity[$month])) {
                $monthlyActivity[$month] = [
                    'month' => $month,
                    'income' => 0,
                    'expenses' => 0,
                    'net' => 0,
                ];
            }

            $amount = (float) $row->amount;

            if ($row->type === 'income') {
                $monthlyActivity[$month]['income'] += $amount;
            } else {
                $monthlyActivity[$month]['expenses'] += $amount;
            }

            $monthlyActivity[$month]['net'] =
                $monthlyActivity[$month]['income'] -
                $monthlyActivity[$month]['expenses'];
        }

        $accountBalances = $user->accounts()
            ->orderBy('name')
            ->get()
            ->map(function ($account) use ($user) {
                $income = $user->transactions()
                    ->where('account_id', $account->id)
                    ->where('type', 'income')
                    ->sum('amount');

                $expenses = $user->transactions()
                    ->where('account_id', $account->id)
                    ->where('type', 'expense')
                    ->sum('amount');

                return [
                    'id' => $account->id,
                    'name' => $account->name,
                    'type' => $account->type,
                    'initial_balance' => (float) $account->initial_balance,
                    'income' => (float) $income,
                    'expenses' => (float) $expenses,
                    'balance' =>
                        (float) $account->initial_balance +
                        (float) $income -
                        (float) $expenses,
                ];
            })
            ->values();

        $budgets = $user->budgets()
            ->with('category')
            ->orderByDesc('start_date')
            ->get();

        $budgetProgress = $budgets->map(function ($budget) use ($user) {
            $spent = $user->transactions()
                ->where('category_id', $budget->category_id)
                ->where('type', 'expense')
                ->whereBetween('transaction_date', [
                    $budget->start_date,
                    $budget->end_date,
                ])
                ->sum('amount');

            $amount = (float) $budget->amount;
            $spentAmount = (float) $spent;

            return [
                'id' => $budget->id,
                'category' => $budget->category?->name,
                'budget_amount' => $amount,
                'spent_amount' => $spentAmount,
                'remaining_amount' =>
                    max($amount - $spentAmount, 0),
                'progress' =>
                    $amount > 0
                        ? min(($spentAmount / $amount) * 100, 100)
                        : 0,
                'start_date' => $budget->start_date,
                'end_date' => $budget->end_date,
            ];
        })->values();

        return response()->json([
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],

                'summary' => [
                    'current_balance' => $currentBalance,
                    'total_income' => $totalIncome,
                    'total_expenses' => $totalExpenses,
                    'net_savings' => $netSavings,
                    'savings_rate' => $savingsRate,
                    'transaction_count' => $transactionCount,
                ],

                'expense_by_category' => $expenseByCategory,

                'monthly_activity' => array_values($monthlyActivity),

                'account_balances' => $accountBalances,

                'budget_progress' => $budgetProgress,
            ],
        ]);
    }
}