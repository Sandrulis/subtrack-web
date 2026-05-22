import { isHttpsAvatarUrl } from "@/lib/auth/oauth-avatar-url";

export type UserAvatarProps = {
  initials: string;
  avatarUrl?: string | null;
  className?: string;
  /** Ja nav bildes – span ar inicialēm (noklusējums `user-avatar`). */
  initialsClassName?: string;
};

/**
 * Lietotāja avatārs: OAuth profila bilde vai inicialēs.
 * Google bildēm: `referrerPolicy="no-referrer"`.
 */
export function UserAvatar({
  initials,
  avatarUrl,
  className = "user-avatar",
  initialsClassName,
}: UserAvatarProps) {
  const safeInitials = initials.trim() || "?";

  if (isHttpsAvatarUrl(avatarUrl)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ārējs OAuth CDN, ne next/image
      <img
        src={avatarUrl}
        alt=""
        className={`${className} user-avatar--photo`.trim()}
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={initialsClassName ?? className}
      aria-hidden="true"
    >
      {safeInitials}
    </span>
  );
}
