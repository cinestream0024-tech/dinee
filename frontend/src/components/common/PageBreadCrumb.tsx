import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon } from "@/icons";
export default function PageBreadcrumb({ pageTitle }: { pageTitle: string }) {
  const { t } = useTranslation();
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {pageTitle}
      </h1>
      <nav aria-label={t("dinee.adminNavigation")}>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
            >
              {t("dinee.adminHome")}
              <ChevronLeftIcon className="size-4 rotate-180 rtl:rotate-0" />
            </Link>
          </li>
          <li
            aria-current="page"
            className="text-sm text-gray-800 dark:text-white/90"
          >
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
}
