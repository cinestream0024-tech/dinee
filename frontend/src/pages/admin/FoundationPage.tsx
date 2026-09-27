import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import { api } from "@/services/api";
import {
  DineeCalendarIcon,
  DineeCheckIcon,
  DineeUsersIcon,
  DineeSendIcon,
} from "@/icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const metricItems = [
  { key: "selectedProfiles", value: "—", Icon: DineeUsersIcon },
  { key: "invitationsToSend", value: "—", Icon: DineeSendIcon },
  { key: "confirmations", value: "—", Icon: DineeCheckIcon },
  { key: "nextEdition", value: "—", Icon: DineeCalendarIcon },
] as const;

export default function FoundationPage({
  section = "adminHome",
}: {
  section?: "adminHome" | "events" | "network";
}) {
  const { t } = useTranslation();
  const health = useQuery({
    queryKey: ["admin", "foundation"],
    queryFn: () =>
      api<{ data: { status: string } }>("/api/v1/admin/foundation"),
    retry: false,
  });

  if (section !== "adminHome") {
    return (
      <>
        <PageMeta
          title={`${t(`dinee.${section}`)} | ${t("dinee.brand")}`}
          description={t("dinee.tagline")}
        />
        <PageBreadCrumb pageTitle={t(`dinee.${section}`)} />
        <ComponentCard title={t("dinee.foundationTitle")}>
          <p className="text-gray-600 dark:text-gray-300">
            {t("dinee.foundationDescription")}
          </p>
        </ComponentCard>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${t("dinee.dashboardTitle")} | ${t("dinee.brand")}`}
        description={t("dinee.tagline")}
      />

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
            {t("dinee.dashboardTitle")}
          </h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {t("dinee.dashboardSubtitle")}
          </p>
        </div>
        <Badge
          color={
            health.isError ? "error" : health.isPending ? "warning" : "success"
          }
        >
          {t(
            health.isPending
              ? "dinee.loading"
              : health.isError
                ? "dinee.networkError"
                : "dinee.apiConnected",
          )}
        </Badge>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:col-span-7">
          {metricItems.map(({ key, value, Icon }) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Icon className="size-6 text-gray-800 dark:text-white/90" />
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`dinee.${key}`)}
                  </span>
                  <h2 className="mt-2 text-title-sm font-bold text-gray-800 dark:text-white/90">
                    {value}
                  </h2>
                </div>
                <Badge color="light">{t("dinee.phaseTwoData")}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-12 xl:col-span-5">
          <div className="h-full rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3">
            <div className="rounded-2xl bg-white px-5 pt-5 pb-6 sm:px-6 sm:pt-6 dark:bg-gray-900">
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("dinee.nextEdition")}
              </p>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                {t("dinee.nextEditionDescription")}
              </p>
              <div className="mt-8 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center dark:border-gray-700">
                <DineeCalendarIcon className="size-8 text-brand-500" />
                <p className="mt-3 text-sm font-medium text-gray-800 dark:text-white/90">
                  {t("dinee.noEditionSelected")}
                </p>
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  {t("dinee.noEditionSelectedDescription")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <Link
                to="/admin/events"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {t("dinee.events")}
              </Link>
              <Link
                to="/admin/network"
                className="rounded-lg bg-brand-500 px-4 py-2.5 text-center text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                {t("dinee.network")}
              </Link>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-5 sm:px-6 dark:border-gray-800 dark:bg-white/3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {t("dinee.foundationTitle")}
                </h2>
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                  {t("dinee.foundationDescription")}
                </p>
              </div>
              {health.isError && (
                <button
                  type="button"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  onClick={() => health.refetch()}
                >
                  {t("dinee.retry")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
