import { cn } from "@/utils";

export const controlClass = (hasError = false) =>
  cn(
    "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-hidden transition placeholder:text-gray-400 focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30",
    hasError
      ? "border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500"
      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800",
  );

export const textAreaClass = (hasError = false) =>
  cn(controlClass(hasError), "h-auto min-h-24 resize-y");
