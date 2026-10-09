<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Return aggregated finance data for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $transactions = $user->transactions();

        $totalIncome = (clone $transactions)
            ->where('type', 'income')
            ->sum('amount');

        $totalExpenses = (clone $transactions)
            ->where('type', 'expense')
            ->sum('amount');

        $initialBalance = $user->accounts()
            ->sum('initial_balance');

        $totalBalance = $initialBalance + $totalIncome - $totalExpenses;

        $netSavings = $totalIncome - $totalExpenses;

        $recentTransactions = $user->transactions()
            ->with(['account', 'category'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $spendingByCategory = $user->transactions()
            ->with('category')
            ->where('type', 'expense')
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->get();

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

            return [
                'id' => $budget->id,
                'category' => $budget->category?->name,
                'budget_amount' => $budget->amount,
                'spent_amount' => $spent,
                'remaining_amount' => max(
                    (float) $budget->amount - (float) $spent,
                    0
                ),
                'start_date' => $budget->start_date,
                'end_date' => $budget->end_date,
            ];
        });

        return response()->json([
            'data' => [
                'summary' => [
                    'initial_balance' => $initialBalance,
                    'total_income' => $totalIncome,
                    'total_expenses' => $totalExpenses,
                    'total_balance' => $totalBalance,
                    'net_savings' => $netSavings,
                ],
                'recent_transactions' => $recentTransactions,
                'spending_by_category' => $spendingByCategory,
                'budget_progress' => $budgetProgress,
            ],
        ]);
    }
}