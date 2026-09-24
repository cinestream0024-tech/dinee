import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "@/services/api";
import PageMeta from "@/components/common/PageMeta";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
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
        <p role="status" className="mt-4 font-medium">
          {t(
            health.isPending
              ? "dinee.loading"
              : health.isError
                ? "dinee.networkError"
                : "dinee.apiConnected",
          )}
        </p>
        {health.isError && (
          <button className="mt-4 underline" onClick={() => health.refetch()}>
            {t("dinee.retry")}
          </button>
        )}
      </ComponentCard>
    </>
  );
}
