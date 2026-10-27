<?php

return [
    /*
     * Display Branding
     */
    'clinic_name' => env('ANTRIAN_CLINIC_NAME', 'Praktik Mandiri / Fasilitas Kesehatan'),
    'running_text' => env('ANTRIAN_RUNNING_TEXT', 'Selamat Datang. Harap memperhatikan nomor antrean dan menuju ke loket atau ruangan yang ditentukan.'),

    /*
     * Audio Asset Directory (Null defaults to package vendor path)
     */
    'asset_path' => env('ANTRIAN_ASSET_PATH', null),

    /*
     * Default Routes
     */
    'routes' => [
        'enabled' => true,
        'prefix' => 'antrian',
        'middleware' => ['web'],
    ],
];
