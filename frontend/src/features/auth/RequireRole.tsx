import { Navigate, Outlet } from "react-router";
import { useTranslation } from "react-i18next";
import { useSession } from "./auth";
import type { Role } from "@/types/auth";
export default function RequireRole({ role }: { role: Role }) {
  const { t } = useTranslation();
  const session = useSession();
  if (session.isPending)
    return (
      <p role="status" className="p-6">
        {t("dinee.loading")}
      </p>
    );
  if (session.isError)
    return (
      <div role="alert" className="p-6">
        <p>{t("dinee.networkError")}</p>
        <button className="mt-4 underline" onClick={() => session.refetch()}>
          {t("dinee.retry")}
        </button>
      </div>
    );
  if (!session.data) return <Navigate to="/login" replace />;
  if (session.data.role !== role) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
