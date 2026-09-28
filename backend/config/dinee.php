<?php

return [
    'timezone' => 'Africa/Kinshasa',
    'frontend_url' => env('FRONTEND_URL', 'http://127.0.0.1:5173'),
    'follow_up_delay_hours' => (int) env('DINEE_FOLLOW_UP_DELAY_HOURS', 48),
    'demo_password' => env('DINEE_DEMO_PASSWORD'),
];
