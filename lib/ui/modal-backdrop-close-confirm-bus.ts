export const MODAL_BACKDROP_CLOSE_CONFIRM_REQUEST =
  "subtrack:backdrop-close-confirm-request";
export const MODAL_BACKDROP_CLOSE_CONFIRM_RESULT =
  "subtrack:backdrop-close-confirm-result";

export type ModalBackdropCloseConfirmRequestDetail = {
  requestId: string;
  message: string;
};

export type ModalBackdropCloseConfirmResultDetail = {
  requestId: string;
  confirmed: boolean;
};

function newRequestId(): string {
  return `bc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Parāda globālo apstiprinājuma modāli; atgriež, vai lietotājs apstiprināja aizvēršanu. */
export function requestModalBackdropCloseConfirm(message: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(true);
  const text = message.trim();
  if (!text) return Promise.resolve(true);

  const requestId = newRequestId();

  return new Promise((resolve) => {
    const onResult = (e: Event) => {
      const detail = (e as CustomEvent<ModalBackdropCloseConfirmResultDetail>).detail;
      if (!detail || detail.requestId !== requestId) return;
      window.removeEventListener(MODAL_BACKDROP_CLOSE_CONFIRM_RESULT, onResult);
      resolve(!!detail.confirmed);
    };
    window.addEventListener(MODAL_BACKDROP_CLOSE_CONFIRM_RESULT, onResult);
    window.dispatchEvent(
      new CustomEvent<ModalBackdropCloseConfirmRequestDetail>(
        MODAL_BACKDROP_CLOSE_CONFIRM_REQUEST,
        { detail: { requestId, message: text } },
      ),
    );
  });
}

export function emitModalBackdropCloseConfirmResult(
  requestId: string,
  confirmed: boolean,
): void {
  window.dispatchEvent(
    new CustomEvent<ModalBackdropCloseConfirmResultDetail>(
      MODAL_BACKDROP_CLOSE_CONFIRM_RESULT,
      { detail: { requestId, confirmed } },
    ),
  );
}
