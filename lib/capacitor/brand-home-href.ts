/** Logo un „mājas” saite: pārlūkā viesiem `/`, native app – `/login`. */
export function brandHomeHref(opts: {
  authed: boolean;
  isNative: boolean;
}): string {
  if (opts.authed) return "/dashboard";
  return opts.isNative ? "/login" : "/";
}
