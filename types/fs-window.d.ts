export {};

declare global {
  interface Window {
    subtrackConfirmBackdropClose?: (
      messageKey?: string,
      callback?: (confirmed: boolean) => void,
    ) => boolean | Promise<boolean>;
    subtrackRequestBackdropCloseConfirm?: (message: string) => Promise<boolean>;
    subtrackHandleModalOverlayClick?: (
      e: MouseEvent,
      overlayEl: HTMLElement | null | undefined,
      onClose: () => void,
      opts?: { isBusy?: () => boolean; messageKey?: string },
    ) => void;
    openAddModal?: () => void;
    closeModal?: () => void;
    handleOverlayClick?: (e: MouseEvent) => void;
    saveSubscription?: () => void;
    toggleModalAdvanced?: () => void;
    addDeviceRow?: () => void;
    addLoanPaymentRow?: () => void;
    handleDeleteOverlayClick?: (e: MouseEvent) => void;
    closeDeleteModal?: () => void;
    confirmDelete?: () => void;
    toggleIconPickerExpand?: () => void;
    showToast?: (msg: string, type?: string) => void;
  }
}
