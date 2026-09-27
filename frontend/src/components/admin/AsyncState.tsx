import { AlertHexaIcon, SearchIcon } from "@/icons";
import { useTranslation } from "react-i18next";

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3 p-5 sm:p-6">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
        <AlertHexaIcon className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-gray-800 dark:text-white/90">
        {t("dinee.loadFailed")}
      </h2>
      <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {t("dinee.networkError")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        {t("dinee.retry")}
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <SearchIcon className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function MutationError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-300"
    >
      {message}
    </div>
  );
}
