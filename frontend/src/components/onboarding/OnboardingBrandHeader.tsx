import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useTranslation } from "react-i18next";

export default function OnboardingBrandHeader() {
  const { t } = useTranslation();

  return (
    <header className="mx-auto flex h-20 w-full max-w-3xl items-center justify-between px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center overflow-hidden rounded-2xl bg-success-950 shadow-theme-sm ring-1 ring-gray-950/10 ring-inset dark:ring-white/15">
          <img
            src="/images/image-gen-2.png"
            alt=""
            width="44"
            height="44"
            className="size-10 object-contain"
          />
        </span>
        <span className="text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
          {t("dinee.brand")}
        </span>
      </div>
      <ThemeToggleButton />
    </header>
  );
}
