<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    /**
     * Display all accounts belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $accounts = $request->user()
            ->accounts()
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $accounts,
        ]);
    }

    /**
     * Display one account belonging to the authenticated user.
     */
    public function show(
        Request $request,
        Account $account
    ): JsonResponse {
        $account = $request->user()
            ->accounts()
            ->findOrFail($account->id);

        return response()->json([
            'data' => $account,
        ]);
    }

    /**
     * Create a new account for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:cash,bank,e_wallet,savings,investment',
            'initial_balance' => 'nullable|numeric|min:0',
        ]);

        $account = $request->user()
            ->accounts()
            ->create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'initial_balance' => $validated['initial_balance'] ?? 0,
            ]);

        return response()->json([
            'message' => 'Account created successfully.',
            'data' => $account,
        ], 201);
    }

    /**
     * Update an existing account belonging to the authenticated user.
     */
    public function update(
        Request $request,
        Account $account
    ): JsonResponse {
        $account = $request->user()
            ->accounts()
            ->findOrFail($account->id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:cash,bank,e_wallet,savings,investment',
            'initial_balance' => 'nullable|numeric|min:0',
        ]);

        $account->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'initial_balance' => $validated['initial_balance'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Account updated successfully.',
            'data' => $account->fresh(),
        ]);
    }

    /**
     * Delete an account belonging to the authenticated user.
     *
     * Accounts with existing transactions cannot be deleted.
     */
    public function destroy(
        Request $request,
        Account $account
    ): JsonResponse {
        $account = $request->user()
            ->accounts()
            ->findOrFail($account->id);

        if ($account->transactions()->exists()) {
            return response()->json([
                'message' => 'This account cannot be deleted because it has transactions.',
            ], 422);
        }

        $account->delete();

        return response()->json([
            'message' => 'Account deleted successfully.',
        ]);
    }
}