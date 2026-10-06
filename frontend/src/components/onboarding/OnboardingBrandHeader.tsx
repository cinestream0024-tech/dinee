import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useTranslation } from "react-i18next";

export default function OnboardingBrandHeader() {
  const { t } = useTranslation();

  return (
    <header className="mx-auto flex h-20 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <img
          src="/images/image-gen-3.png"
          alt=""
          width="44"
          height="44"
          className="size-11 rounded-2xl object-cover shadow-theme-sm"
        />
        <span className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
          {t("dinee.brand")}
        </span>
      </div>
      <ThemeToggleButton />
    </header>
  );
}
