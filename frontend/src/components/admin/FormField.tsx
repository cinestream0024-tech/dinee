import type { ReactNode } from "react";
import Label from "@/components/form/Label";

interface FormFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export default function FormField({
  id,
  label,
  children,
  error,
  hint,
  required = false,
  className,
}: FormFieldProps) {
  const description = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-error-500">
            *
          </span>
        )}
      </Label>
      <div aria-describedby={description}>{children}</div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-theme-xs text-error-600 dark:text-error-400"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
