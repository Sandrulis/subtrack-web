/**
 * Auto-aizvēršana ar iespēju apturēt, kamēr kursors ir virs toast elementa.
 */
export function attachToastHoverDismiss(toast: HTMLElement, dismissMs: number): void {
  let hovering = false;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (hideTimer !== null) clearTimeout(hideTimer);
    if (fadeTimer !== null) clearTimeout(fadeTimer);
    hideTimer = null;
    fadeTimer = null;
  };

  const startDismiss = () => {
    clearTimers();
    hideTimer = setTimeout(() => {
      if (hovering) return;
      toast.style.opacity = "0";
      toast.style.transition = "opacity .3s";
      fadeTimer = setTimeout(() => toast.remove(), 320);
    }, dismissMs);
  };

  const onEnter = () => {
    hovering = true;
    clearTimers();
    toast.style.opacity = "1";
    toast.style.transition = "";
  };

  const onLeave = () => {
    hovering = false;
    startDismiss();
  };

  toast.classList.add("toast--dismiss-hover");
  toast.addEventListener("pointerenter", onEnter);
  toast.addEventListener("pointerleave", onLeave);
  startDismiss();
}
