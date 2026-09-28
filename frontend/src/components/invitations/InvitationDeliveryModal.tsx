import AdminModal from "@/components/admin/AdminModal";
import { MutationError } from "@/components/admin/AsyncState";
import { DineeCheckIcon, DineeSendIcon } from "@/icons";
import type { InvitationDelivery } from "@/types/dinee";
import { useTranslation } from "react-i18next";

export default function InvitationDeliveryModal({
  isOpen,
  delivery,
  mode,
  isMarkingSent,
  errorMessage,
  onClose,
  onMarkSent,
}: {
  isOpen: boolean;
  mode: "initial" | "followUp";
  delivery: InvitationDelivery | null;
  isMarkingSent: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onMarkSent: () => void;
}) {
  const { t } = useTranslation();

  if (!delivery) return null;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("dinee.whatsappInvitation")}
      description={t(
        `dinee.${mode === "followUp" ? "followUpWhatsAppNotice" : "whatsappNotice"}`,
      )}
      width="max-w-xl"
      busy={isMarkingSent}
    >
      <div className="space-y-5 p-5 sm:p-6">
        {errorMessage && <MutationError message={errorMessage} />}
        <div className="rounded-xl bg-gray-50 p-4 text-sm whitespace-pre-line text-gray-700 dark:bg-white/3 dark:text-gray-300">
          {delivery.whatsapp_message}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={delivery.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-success-500 px-4 text-sm font-medium text-white shadow-theme-xs hover:bg-success-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-500"
          >
            <DineeSendIcon className="size-5" aria-hidden="true" />
            {t("dinee.openWhatsApp")}
          </a>
          <button
            type="button"
            onClick={onMarkSent}
            disabled={isMarkingSent}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
          >
            <DineeCheckIcon className="size-5" aria-hidden="true" />
            {isMarkingSent ? t("dinee.markingAsSent") : t("dinee.markAsSent")}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
