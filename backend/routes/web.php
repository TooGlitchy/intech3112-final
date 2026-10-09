<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Personal Finance & Expense Management System API',
        'status' => 'ok',
    ]);
});
