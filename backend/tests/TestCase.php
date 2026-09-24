<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        if (! $app->environment('testing') || $app['config']->get('database.connections.mysql.database') !== 'dinee_test') {
            throw new RuntimeException('Tests may only use the dedicated dinee_test database.');
        }

        return $app;
    }
}
