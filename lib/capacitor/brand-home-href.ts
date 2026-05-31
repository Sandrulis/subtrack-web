/** Viesa sākuma ceļš: pārlūkā `/`, native app – `/login`. */
export function guestEntryPath(isNative: boolean): string {
  return isNative ? "/login" : "/";
}

/** Logo un „mājas” saite: pārlūkā viesiem `/`, native app – `/login`. */
export function brandHomeHref(opts: {
  authed: boolean;
  isNative: boolean;
}): string {
  if (opts.authed) return "/dashboard";
  return guestEntryPath(opts.isNative);
}
