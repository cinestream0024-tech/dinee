import { useTranslation } from "react-i18next";
import { MoonIcon, SunIcon } from "@/icons";
import { useTheme } from "@/context/ThemeContext";

export const ThemeToggleButton: React.FC = () => {
  const { t } = useTranslation();
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={t("dinee.toggleTheme")}
      title={t("dinee.toggleTheme")}
      onClick={toggleTheme}
      className="relative flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <SunIcon aria-hidden="true" className="hidden size-5 dark:block" />
      <MoonIcon aria-hidden="true" className="size-5 dark:hidden" />
    </button>
  );
};
