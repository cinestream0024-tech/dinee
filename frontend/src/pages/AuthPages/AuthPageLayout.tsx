import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { useTranslation } from "react-i18next";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative z-1 min-h-screen bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex min-h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        {children}

        <div className="hidden min-h-screen w-full items-center bg-brand-950 lg:grid lg:w-1/2 dark:bg-white/5">
          <div className="relative z-1 flex items-center justify-center px-8">
            <GridShape />
            <div className="flex max-w-md flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-brand-700 shadow-theme-lg">
                D
              </span>
              <p className="mt-6 text-title-sm font-semibold tracking-[0.18em] text-white uppercase">
                {t("dinee.brand")}
              </p>
              <p className="mt-3 text-base leading-7 text-brand-200">
                {t("dinee.tagline")}
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
