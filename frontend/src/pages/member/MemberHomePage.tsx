import { useTranslation } from "react-i18next";
import { useSession } from "@/features/auth/auth";
import PageMeta from "@/components/common/PageMeta";
export default function MemberHomePage({
  section = "memberHome",
}: {
  section?: "memberHome" | "myProfile" | "myInvitations";
}) {
  const { t } = useTranslation();
  const { data: user } = useSession();
  return (
    <>
      <PageMeta
        title={`${t(`dinee.${section}`)} | ${t("dinee.brand")}`}
        description={t("dinee.tagline")}
      />
      <p className="text-sm tracking-widest text-gray-500 uppercase dark:text-gray-400">
        {t("dinee.memberSpace")}
      </p>
      <h1 className="mt-4 text-title-md font-semibold">
        {section === "memberHome"
          ? t("dinee.welcome", { name: user?.name })
          : t(`dinee.${section}`)}
      </h1>
      <p className="mt-6 leading-relaxed text-gray-600 dark:text-gray-300">
        {t("dinee.memberDescription")}
      </p>
    </>
  );
}
