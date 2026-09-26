import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { useLogin } from "@/features/auth/auth";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { ApiError } from "@/services/api";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        <div className="mb-8 lg:hidden">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-500 font-bold text-white">
            D
          </span>
        </div>

        <div className="mb-5 sm:mb-8">
          <p className="mb-2 text-theme-sm font-medium text-brand-600 dark:text-brand-400">
            {t("dinee.privateAccess")}
          </p>
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
            {t("dinee.login")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("dinee.loginIntro")}
          </p>
        </div>

        <form
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
          <div className="space-y-6">
            <div>
              <Label htmlFor="email">
                {t("dinee.email")} <span className="text-error-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                aria-label={t("dinee.email")}
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">
                {t("dinee.password")} <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  aria-label={t("dinee.password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={255}
                  placeholder={t("dinee.passwordPlaceholder")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-e-4 top-1/2 z-30 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-gray-400 dark:hover:bg-white/5"
                  aria-label={t(
                    showPassword ? "dinee.hidePassword" : "dinee.showPassword",
                  )}
                >
                  {showPassword ? (
                    <EyeIcon className="size-5 fill-current" />
                  ) : (
                    <EyeCloseIcon className="size-5 fill-current" />
                  )}
                </button>
              </div>
            </div>

            {login.isError && (
              <p
                role="alert"
                className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
              >
                {t(`dinee.${errorKey}`)}
              </p>
            )}

            <Button className="w-full" size="sm" disabled={login.isPending}>
              {t(login.isPending ? "dinee.loading" : "dinee.login")}
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/3">
          <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-300">
            {t("dinee.demoAccess")}
          </p>
          <p className="mt-1 text-theme-xs leading-5 text-gray-500 dark:text-gray-400">
            yannick@dinee.test · patrick@dinee.test
          </p>
        </div>
      </div>
    </div>
  );
}
