import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { apiErrorMessageKey, hasFieldError } from "@/components/admin/apiErrors";
import { sessionKey } from "@/features/auth/auth";
import { activateInvitationAccount } from "@/features/invitations/api";

interface InvitationAccountActivationProps {
  token: string;
}

export default function InvitationAccountActivation({
  token,
}: InvitationAccountActivationProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      activateInvitationAccount(token, {
        email,
        password,
        password_confirmation: confirmation,
      }),
    onSuccess: ({ data }) => {
      client.setQueryData(sessionKey, data);
      navigate("/member/profile/edit", { replace: true });
    },
  });

  return (
    <form
      className="rounded-2xl border border-brand-100 bg-brand-25 p-5 dark:border-brand-500/20 dark:bg-brand-500/10"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <h2 className="font-semibold text-gray-900 dark:text-white">
        {t("dinee.activateMemberSpace")}
      </h2>
      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
        {t("dinee.activationIntro")}
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="activation-email">{t("dinee.email")}</Label>
          <Input
            id="activation-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={hasFieldError(mutation.error, "email")}
          />
        </div>
        <div>
          <Label htmlFor="activation-password">{t("dinee.choosePassword")}</Label>
          <Input
            id="activation-password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={hasFieldError(mutation.error, "password")}
            hint={t("dinee.passwordRequirements")}
          />
        </div>
        <div>
          <Label htmlFor="activation-password-confirmation">
            {t("dinee.confirmPassword")}
          </Label>
          <Input
            id="activation-password-confirmation"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-error-600 dark:text-error-400">
            {t(apiErrorMessageKey(mutation.error))}
          </p>
        )}

        <Button className="w-full" size="sm" disabled={mutation.isPending}>
          {t(mutation.isPending ? "dinee.activatingAccount" : "dinee.activateAndContinue")}
        </Button>
      </div>
    </form>
  );
}
