import type { InvitationStatus } from "@/types/dinee";
import { useTranslation } from "react-i18next";

export interface InvitationFilterValues {
  status: InvitationStatus | "";
  sent: "" | "sent" | "unsent";
  followUpDue: boolean;
}

export default function InvitationFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: InvitationFilterValues;
  onChange: (
    key: keyof InvitationFilterValues,
    value: string | boolean,
  ) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const hasFilters = Boolean(
    filters.status || filters.sent || filters.followUpDue,
  );

  return (
    <div className="border-b border-gray-100 p-4 sm:p-5 dark:border-gray-800">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("dinee.status")}
          </span>
          <select
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">{t("dinee.allStatuses")}</option>
            {(["pending", "accepted", "declined", "cancelled"] as const).map(
              (status) => (
                <option key={status} value={status}>
                  {t(`dinee.invitationStatus_${status}`)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("dinee.sending")}
          </span>
          <select
            value={filters.sent}
            onChange={(event) => onChange("sent", event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="">{t("dinee.allSendingStates")}</option>
            <option value="sent">{t("dinee.sent")}</option>
            <option value="unsent">{t("dinee.notSent")}</option>
          </select>
        </label>
        <button
          type="button"
          aria-pressed={filters.followUpDue}
          onClick={() => onChange("followUpDue", !filters.followUpDue)}
          className={`min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
            filters.followUpDue
              ? "border-warning-300 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/15 dark:text-warning-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/3"
          }`}
        >
          {t("dinee.toFollowUp")}
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-11 rounded-lg px-4 text-sm font-medium text-brand-600 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-brand-400 dark:hover:bg-brand-500/10"
          >
            {t("dinee.reset")}
          </button>
        )}
      </div>
    </div>
  );
}
