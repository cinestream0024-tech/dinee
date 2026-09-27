interface ProfileAvatarProps {
  firstName: string;
  lastName: string;
  size?: "sm" | "md";
}

export default function ProfileAvatar({
  firstName,
  lastName,
  size = "md",
}: ProfileAvatarProps) {
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase();
  const sizeClass = size === "sm" ? "size-10 text-sm" : "size-12 text-base";

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl bg-brand-50 font-semibold text-brand-600 ring-1 ring-brand-100 ring-inset ${sizeClass} dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20`}
    >
      {initials}
    </span>
  );
}
