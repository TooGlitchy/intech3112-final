<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    /**
     * Display all budgets belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $budgets = $request->user()
            ->budgets()
            ->with('category')
            ->orderByDesc('start_date')
            ->get();

        return response()->json([
            'data' => $budgets,
        ]);
    }

    /**
     * Display one budget belonging to the authenticated user.
     */
    public function show(
        Request $request,
        Budget $budget
    ): JsonResponse {
        $budget = $request->user()
            ->budgets()
            ->with('category')
            ->findOrFail($budget->id);

        return response()->json([
            'data' => $budget,
        ]);
    }

    /**
     * Create a budget for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'category_id' => 'required|integer|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $categoryExists = $user->categories()
            ->whereKey($validated['category_id'])
            ->where('type', 'expense')
            ->exists();

        if (!$categoryExists) {
            return response()->json([
                'message' => 'The selected category must belong to the authenticated user and be an expense category.',
            ], 422);
        }

        $budget = $user->budgets()->create([
            'category_id' => $validated['category_id'],
            'amount' => $validated['amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        $budget->load('category');

        return response()->json([
            'message' => 'Budget created successfully.',
            'data' => $budget,
        ], 201);
    }

    /**
     * Update a budget belonging to the authenticated user.
     */
    public function update(
        Request $request,
        Budget $budget
    ): JsonResponse {
        $user = $request->user();

        $budget = $user->budgets()
            ->findOrFail($budget->id);

        $validated = $request->validate([
            'category_id' => 'required|integer|exists:categories,id',
            'amount' => 'required|numeric|min:0.01',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $categoryExists = $user->categories()
            ->whereKey($validated['category_id'])
            ->where('type', 'expense')
            ->exists();

        if (!$categoryExists) {
            return response()->json([
                'message' => 'The selected category must belong to the authenticated user and be an expense category.',
            ], 422);
        }

        $budget->update([
            'category_id' => $validated['category_id'],
            'amount' => $validated['amount'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        return response()->json([
            'message' => 'Budget updated successfully.',
            'data' => $budget->fresh('category'),
        ]);
    }

    /**
     * Delete a budget belonging to the authenticated user.
     */
    public function destroy(
        Request $request,
        Budget $budget
    ): JsonResponse {
        $budget = $request->user()
            ->budgets()
            ->findOrFail($budget->id);

        $budget->delete();

        return response()->json([
            'message' => 'Budget deleted successfully.',
        ]);
    }
}