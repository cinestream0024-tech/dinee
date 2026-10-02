interface ProfileAvatarProps {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function ProfileAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "md",
}: ProfileAvatarProps) {
  const name = `${firstName} ${lastName}`.trim();
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase();
  const sizeClass = {
    sm: "size-10 rounded-xl text-sm",
    md: "size-12 rounded-xl text-base",
    lg: "size-24 rounded-full text-title-sm",
  }[size];

  if (photoUrl) {
    return (
      <img
        key={photoUrl}
        src={photoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`shrink-0 object-cover ring-1 ring-gray-200 ring-inset dark:ring-gray-700 ${sizeClass}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-brand-50 font-semibold text-brand-600 ring-1 ring-brand-100 ring-inset ${sizeClass} dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20`}
    >
      {initials}
    </span>
  );
}
