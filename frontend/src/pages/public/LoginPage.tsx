import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useLogin, useSession } from "@/features/auth/auth";
import { ApiError } from "@/services/api";
import PageMeta from "@/components/common/PageMeta";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
export default function LoginPage() {
  const { t } = useTranslation();
  const session = useSession();
  const login = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (session.data) return <Navigate to={`/${session.data.role}`} replace />;
  const status = login.error instanceof ApiError ? login.error.status : 0;
  const errorKey =
    status === 422
      ? "invalidCredentials"
      : status === 429
        ? "tooManyAttempts"
        : status === 419
          ? "sessionExpired"
          : status === 403
            ? "forbidden"
            : "networkError";
  return (
    <>
      <PageMeta
        title={`${t("dinee.login")} | ${t("dinee.brand")}`}
        description={t("dinee.tagline")}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
        <h1 className="text-title-sm font-semibold">{t("dinee.login")}</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">
          {t("dinee.loginIntro")}
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            login.mutate(
              { email, password },
              {
                onSuccess: (user) =>
                  navigate(`/${user.role}`, { replace: true }),
              },
            );
          }}
        >
          <div>
            <Label htmlFor="email">{t("dinee.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">{t("dinee.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={255}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {login.isError && (
            <p
              role="alert"
              className="text-sm text-error-600 dark:text-error-400"
            >
              {t(`dinee.${errorKey}`)}
            </p>
          )}
          <Button className="w-full" disabled={login.isPending}>
            {t(login.isPending ? "dinee.loading" : "dinee.login")}
          </Button>
        </form>
      </section>
    </>
  );
}
