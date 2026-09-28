<?php

namespace App\Services;

use App\Models\Invitation;

final class InvitationWhatsAppMessage
{
    /**
     * @return array{public_url: string, whatsapp_message: string, whatsapp_url: string}
     */
    public function compose(Invitation $invitation, string $plainTextToken): array
    {
        $invitation->loadMissing('selection.profile', 'selection.event');

        $profile = $invitation->selection->profile;
        $event = $invitation->selection->event;
        $startsAt = $event->starts_at->setTimezone($event->timezone ?: config('dinee.timezone'));
        $publicUrl = rtrim((string) config('dinee.frontend_url'), '/')
            .'/invitation/'.rawurlencode($plainTextToken);

        $message = implode("\n", [
            "Bonjour {$profile->first_name},",
            '',
            "Vous êtes invité(e) à {$event->title}, le {$startsAt->format('d/m/Y')} à {$startsAt->format('H:i')}, à {$event->location}.",
            '',
            "Répondez à votre invitation ici : {$publicUrl}",
            '',
            'Au plaisir de vous retrouver,',
            "L'équipe Le DINEE",
        ]);

        $phone = $profile->phone ? ltrim($profile->phone, '+') : '';

        return [
            'public_url' => $publicUrl,
            'whatsapp_message' => $message,
            'whatsapp_url' => 'https://wa.me/'.$phone.'?text='.rawurlencode($message),
        ];
    }
}
