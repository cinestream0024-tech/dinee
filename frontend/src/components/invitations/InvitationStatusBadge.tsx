import Badge from "@/components/ui/badge/Badge";
import type { InvitationStatus } from "@/types/dinee";
import { useTranslation } from "react-i18next";

const colors: Record<
  InvitationStatus,
  "warning" | "success" | "error" | "light"
> = {
  pending: "warning",
  accepted: "success",
  declined: "error",
  cancelled: "light",
};

export default function InvitationStatusBadge({
  status,
}: {
  status: InvitationStatus;
}) {
  const { t } = useTranslation();

  return (
    <Badge color={colors[status]} size="sm">
      {t(`dinee.invitationStatus_${status}`)}
    </Badge>
  );
}
