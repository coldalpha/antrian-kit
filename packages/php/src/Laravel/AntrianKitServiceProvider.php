<?php

declare(strict_types=1);

namespace AntrianKit\Laravel;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use AntrianKit\AntrianKit;

class AntrianKitServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/antrian-kit.php', 'antrian-kit');
    }

    public function boot(): void
    {
        // Publish config
        $this->publishes([
            __DIR__ . '/../../config/antrian-kit.php' => config_path('antrian-kit.php'),
        ], 'antrian-kit-config');

        // Publish audio assets
        $this->publishes([
            __DIR__ . '/../../../audio/assets/id' => public_path('vendor/antrian-kit/audio/id'),
        ], 'antrian-kit-assets');

        // Configure custom asset path if configured
        if ($customPath = config('antrian-kit.asset_path')) {
            AntrianKit::setAssetPath($customPath);
        }

        // Register default routes if enabled
        if (config('antrian-kit.routes.enabled', true)) {
            $prefix = config('antrian-kit.routes.prefix', 'antrian');
            $middleware = config('antrian-kit.routes.middleware', ['web']);

            Route::group(['prefix' => $prefix, 'middleware' => $middleware], function () {
                Route::get('/display', [AntrianController::class, 'display'])->name('antrian.display');
                Route::get('/stream', [AntrianController::class, 'stream'])->name('antrian.stream');
            });
        }
    }
}
