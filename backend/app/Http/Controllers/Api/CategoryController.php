<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display all categories belonging to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $categories = $request->user()
            ->categories()
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Display one category belonging to the authenticated user.
     */
    public function show(
        Request $request,
        Category $category
    ): JsonResponse {
        $category = $request->user()
            ->categories()
            ->findOrFail($category->id);

        return response()->json([
            'data' => $category,
        ]);
    }

    /**
     * Create a new category for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:income,expense',
        ]);

        $category = $request->user()
            ->categories()
            ->create([
                'name' => $validated['name'],
                'type' => $validated['type'],
            ]);

        return response()->json([
            'message' => 'Category created successfully.',
            'data' => $category,
        ], 201);
    }

    /**
     * Update an existing category.
     */
    public function update(
        Request $request,
        Category $category
    ): JsonResponse {
        $category = $request->user()
            ->categories()
            ->findOrFail($category->id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|in:income,expense',
        ]);

        $category->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
        ]);

        return response()->json([
            'message' => 'Category updated successfully.',
            'data' => $category->fresh(),
        ]);
    }

    /**
     * Delete a category belonging to the authenticated user.
     *
     * Categories with existing transactions cannot be deleted.
     */
    public function destroy(
        Request $request,
        Category $category
    ): JsonResponse {
        $category = $request->user()
            ->categories()
            ->findOrFail($category->id);

        if ($category->transactions()->exists()) {
            return response()->json([
                'message' => 'This category cannot be deleted because it has transactions.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}