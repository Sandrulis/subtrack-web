export {};

declare global {
  interface Window {
    openAddModal?: () => void;
    closeModal?: () => void;
    handleOverlayClick?: (e: MouseEvent) => void;
    saveSubscription?: () => void;
    toggleModalAdvanced?: () => void;
    addDeviceRow?: () => void;
    handleDeleteOverlayClick?: (e: MouseEvent) => void;
    closeDeleteModal?: () => void;
    confirmDelete?: () => void;
    toggleIconPickerExpand?: () => void;
    showToast?: (msg: string, type?: string) => void;
  }
}
