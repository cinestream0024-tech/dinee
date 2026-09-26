<?php

namespace App\Services;

use App\Enums\ProfileSource;
use App\Models\Profile;
use App\Models\User;
use App\Support\ProfileInput;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProfileImportService
{
    public function __construct(private readonly ProfileService $profiles) {}

    private const COLUMNS = ['first_name', 'last_name', 'email', 'phone', 'linkedin_url', 'company', 'job_title', 'sector', 'bio', 'interests', 'looking_for', 'contributions', 'availability'];

    public function process(string $csv, ?User $actor = null): array
    {
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, preg_replace('/^\xEF\xBB\xBF/', '', $csv));
        rewind($stream);
        $header = fgetcsv($stream, 0, ',', '"', '');
        if (! $header || count($header) !== count(array_unique($header)) || array_diff($header, self::COLUMNS) || ! in_array('first_name', $header, true) || ! in_array('last_name', $header, true)) {
            fclose($stream);
            throw ValidationException::withMessages(['csv' => ['invalid_csv_header']]);
        }
        $rows = [];
        $seen = [];
        $line = 1;
        try {
            while (($values = fgetcsv($stream, 0, ',', '"', '')) !== false) {
                $line++;
                if ($line > 1001) {
                    throw ValidationException::withMessages(['csv' => ['csv_limit_exceeded']]);
                }
                if ($values === [null]) {
                    continue;
                }
                if (count($values) !== count($header)) {
                    $rows[] = ['line' => $line, 'status' => 'invalid', 'fields' => ['csv'], 'data' => null];

                    continue;
                }
                $data = ProfileInput::normalize(array_combine($header, array_map(fn ($value) => trim($value ?? '') === '' ? null : trim($value), $values)));
                if (($data['availability'] ?? null) === null) {
                    unset($data['availability']);
                }
                $validator = Validator::make($data, ProfileInput::rules());
                $duplicate = false;
                foreach (['email', 'phone', 'linkedin_url'] as $field) {
                    if (! empty($data[$field])) {
                        $key = $field.':'.$data[$field];
                        $duplicate = $duplicate || isset($seen[$key]) || Profile::where($field, $data[$field])->exists();
                    }
                }
                $status = $duplicate ? 'duplicate' : ($validator->fails() ? 'invalid' : 'ready');
                if ($status === 'ready') {
                    foreach (['email', 'phone', 'linkedin_url'] as $field) {
                        if (! empty($data[$field])) {
                            $seen[$field.':'.$data[$field]] = true;
                        }
                    }
                    if ($actor) {
                        try {
                            $this->profiles->save($validator->validated(), $actor, source: ProfileSource::Import);
                            $status = 'created';
                        } catch (ValidationException) {
                            $status = 'duplicate';
                        }
                    }
                }
                $rows[] = ['line' => $line, 'status' => $status, 'fields' => array_keys($validator->errors()->messages()), 'data' => $data];
            }
        } finally {
            fclose($stream);
        }

        return ['rows' => $rows, 'counts' => array_count_values(array_column($rows, 'status'))];
    }
}
