import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { useLogout } from "@/features/auth/auth";
import Button from "@/components/ui/button/Button";
export default function SessionControls() {
  const { t } = useTranslation();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label={t("dinee.language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      >
        {availableLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        disabled={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSuccess: () => navigate("/login", { replace: true }),
          })
        }
      >
        {t("dinee.logout")}
      </Button>
      {logout.isError && (
        <p role="alert" className="text-sm text-error-600 dark:text-error-400">
          {t("dinee.networkError")}
        </p>
      )}
    </div>
  );
}
