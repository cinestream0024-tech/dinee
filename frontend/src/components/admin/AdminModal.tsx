import { Modal } from "@/components/ui/modal";
import { DineeCloseIcon } from "@/icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export default function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = "max-w-3xl",
  busy = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: string;
  busy?: boolean;
}) {
  const { t } = useTranslation();
  const titleId = `dialog-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      showCloseButton={false}
      className={`${width} max-h-[calc(100vh-2rem)] overflow-hidden`}
    >
      <section role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6 sm:py-5 dark:border-gray-800">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-800 dark:text-white/90"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t("dinee.close")}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <DineeCloseIcon className="size-5" />
          </button>
        </header>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
          {children}
        </div>
      </section>
    </Modal>
  );
}
