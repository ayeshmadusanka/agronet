<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Add CORS middleware globally
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\EnsureJsonResponse::class,
        ]);
        
        // Exclude API routes from CSRF protection
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
        
        // Register role-based middleware aliases
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'farmer' => \App\Http\Middleware\FarmerMiddleware::class,
            'customer' => \App\Http\Middleware\CustomerMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
