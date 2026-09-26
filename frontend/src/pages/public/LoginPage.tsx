import PageMeta from "@/components/common/PageMeta";
import SignInForm from "@/components/auth/SignInForm";
import { useSession } from "@/features/auth/auth";
import AuthLayout from "@/pages/AuthPages/AuthPageLayout";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";

export default function LoginPage() {
  const { t } = useTranslation();
  const session = useSession();

  if (session.data) {
    return <Navigate to={`/${session.data.role}`} replace />;
  }

  return (
    <>
      <PageMeta
        title={`${t("dinee.login")} | ${t("dinee.brand")}`}
        description={t("dinee.tagline")}
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
