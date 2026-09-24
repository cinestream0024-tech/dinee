import { Outlet } from "react-router";
import { useTranslation } from "react-i18next";
export default function PublicLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-25 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="px-5 py-8 text-center text-title-sm font-semibold">
        {t("dinee.brand")}
      </header>
      <main className="mx-auto max-w-lg px-5 pb-12">
        <Outlet />
      </main>
    </div>
  );
}
