import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "@/components/common/PageMeta";
export default function PlaceholderPage({
  kind,
}: {
  kind: "invitation" | "forbidden" | "notFound";
}) {
  const { t } = useTranslation();
  return (
    <>
      <PageMeta
        title={`${t(`dinee.${kind}`)} | ${t("dinee.brand")}`}
        description={t("dinee.tagline")}
      />
      <h1 className="text-title-sm font-semibold">{t(`dinee.${kind}`)}</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        {t(`dinee.${kind}Description`)}
      </p>
      <Link
        to="/login"
        className="mt-6 inline-block min-h-12 rounded-xl bg-gray-900 px-5 py-3 text-white dark:bg-gray-100 dark:text-gray-900"
      >
        {t("dinee.back")}
      </Link>
    </>
  );
}
