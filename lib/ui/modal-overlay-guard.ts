import type { MouseEvent } from "react";
import { requestModalBackdropCloseConfirm } from "@/lib/ui/modal-backdrop-close-confirm-bus";

export { requestModalBackdropCloseConfirm };

/** React: backdrop mousedown - aizver tikai pēc apstiprinājuma modālī. */
export function handleModalBackdropMouseDown(
  e: MouseEvent<HTMLElement>,
  onClose: () => void,
  opts?: { busy?: boolean; confirmMessage: string },
): void {
  if (opts?.busy) return;
  if (e.target !== e.currentTarget) return;
  const message = opts?.confirmMessage?.trim() ?? "";
  if (!message) {
    onClose();
    return;
  }
  void requestModalBackdropCloseConfirm(message).then((ok) => {
    if (ok) onClose();
  });
}
