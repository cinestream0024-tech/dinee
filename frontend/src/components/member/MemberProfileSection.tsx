import type React from "react";

interface MemberProfileSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function MemberProfileSection({
  title,
  children,
  className = "",
}: MemberProfileSectionProps) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
