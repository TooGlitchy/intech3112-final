<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Display all transactions belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $transactions = $request->user()
            ->transactions()
            ->with(['account', 'category'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'data' => $transactions,
        ]);
    }

    /**
     * Display one transaction belonging to the authenticated user.
     */
    public function show(
        Request $request,
        Transaction $transaction
    ): JsonResponse {
        $transaction = $request->user()
            ->transactions()
            ->with(['account', 'category'])
            ->findOrFail($transaction->id);

        return response()->json([
            'data' => $transaction,
        ]);
    }

    /**
     * Create a transaction for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'account_id' => 'required|integer|exists:accounts,id',
            'category_id' => 'required|integer|exists:categories,id',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
        ]);

        // Make sure the selected account belongs to this user.
        $accountExists = $user->accounts()
            ->whereKey($validated['account_id'])
            ->exists();

        if (!$accountExists) {
            return response()->json([
                'message' => 'The selected account does not belong to the authenticated user.',
            ], 422);
        }

        // Make sure the selected category belongs to this user.
        $category = $user->categories()
            ->whereKey($validated['category_id'])
            ->first();

        if (!$category) {
            return response()->json([
                'message' => 'The selected category does not belong to the authenticated user.',
            ], 422);
        }

        // Make sure transaction type matches category type.
        if ($category->type !== $validated['type']) {
            return response()->json([
                'message' => 'Transaction type must match the selected category type.',
            ], 422);
        }

        $transaction = $user->transactions()->create([
            'account_id' => $validated['account_id'],
            'category_id' => $validated['category_id'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
            'transaction_date' => $validated['transaction_date'],
        ]);

        $transaction->load(['account', 'category']);

        return response()->json([
            'message' => 'Transaction created successfully.',
            'data' => $transaction,
        ], 201);
    }

    /**
     * Update a transaction belonging to the authenticated user.
     */
    public function update(
        Request $request,
        Transaction $transaction
    ): JsonResponse {
        $user = $request->user();

        $transaction = $user->transactions()
            ->findOrFail($transaction->id);

        $validated = $request->validate([
            'account_id' => 'required|integer|exists:accounts,id',
            'category_id' => 'required|integer|exists:categories,id',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
        ]);

        $accountExists = $user->accounts()
            ->whereKey($validated['account_id'])
            ->exists();

        if (!$accountExists) {
            return response()->json([
                'message' => 'The selected account does not belong to the authenticated user.',
            ], 422);
        }

        $category = $user->categories()
            ->whereKey($validated['category_id'])
            ->first();

        if (!$category) {
            return response()->json([
                'message' => 'The selected category does not belong to the authenticated user.',
            ], 422);
        }

        if ($category->type !== $validated['type']) {
            return response()->json([
                'message' => 'Transaction type must match the selected category type.',
            ], 422);
        }

        $transaction->update([
            'account_id' => $validated['account_id'],
            'category_id' => $validated['category_id'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
            'transaction_date' => $validated['transaction_date'],
        ]);

        $transaction->load(['account', 'category']);

        return response()->json([
            'message' => 'Transaction updated successfully.',
            'data' => $transaction->fresh(['account', 'category']),
        ]);
    }

    /**
     * Delete a transaction belonging to the authenticated user.
     */
    public function destroy(
        Request $request,
        Transaction $transaction
    ): JsonResponse {
        $transaction = $request->user()
            ->transactions()
            ->findOrFail($transaction->id);

        $transaction->delete();

        return response()->json([
            'message' => 'Transaction deleted successfully.',
        ]);
    }
}