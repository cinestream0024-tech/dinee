import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AdminModal from "@/components/admin/AdminModal";
import {
  EmptyState,
  ErrorState,
  LoadingTable,
} from "@/components/admin/AsyncState";
import Badge from "@/components/ui/badge/Badge";
import { getProfileHistory, profileKeys } from "@/features/profiles/api";
import { useLanguage } from "@/context/LanguageContext";
import type { Profile, ProfileHistoryEntry } from "@/types/dinee";

const badgeColor: Record<
  ProfileHistoryEntry["status"],
  "light" | "warning" | "success" | "error" | "info"
> = {
  selected: "info",
  withdrawn: "light",
  pending: "warning",
  accepted: "success",
  declined: "error",
  cancelled: "light",
  present: "success",
  absent: "error",
};

export default function ProfileHistoryModal({
  profile,
  onClose,
}: {
  profile: Profile | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const query = useQuery({
    queryKey: profile
      ? profileKeys.history(profile.id)
      : ["admin", "profiles", "history", "closed"],
    queryFn: () => getProfileHistory(profile!.id),
    enabled: Boolean(profile),
  });

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : t("dinee.unscheduled");

  return (
    <AdminModal
      isOpen={Boolean(profile)}
      onClose={onClose}
      title={t("dinee.historyTitle", {
        name: profile ? `${profile.first_name} ${profile.last_name}` : "",
      })}
      description={t("dinee.historyDescription")}
      width="max-w-2xl"
    >
      {query.isPending ? (
        <LoadingTable rows={3} />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.data.data.length === 0 ? (
        <EmptyState
          title={t("dinee.noHistory")}
          description={t("dinee.noHistoryDescription")}
        />
      ) : (
        <ol className="divide-y divide-gray-100 px-5 sm:px-6 dark:divide-gray-800">
          {query.data.data.map((entry) => (
            <li
              key={entry.event_id}
              className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {entry.event_title}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(entry.starts_at)}
                </p>
              </div>
              <Badge color={badgeColor[entry.status]}>
                {t(`dinee.history_${entry.status}`)}
              </Badge>
            </li>
          ))}
        </ol>
      )}
    </AdminModal>
  );
}
