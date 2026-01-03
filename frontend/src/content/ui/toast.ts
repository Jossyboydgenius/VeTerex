/**
 * VeTerex Toast Notifications
 * Simple toast notification component for content scripts
 */

import { injectStyles } from "./styles";

export type ToastType = "success" | "error" | "info";

export interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Show a toast notification
 */
export function showToast(message: string, type: ToastType = "success"): void {
  injectStyles();

  // Remove any existing toast
  const existing = document.querySelector(".veterex-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `veterex-toast veterex-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 2 seconds
  setTimeout(() => {
    toast.style.animation = "veterex-fadeOut 0.3s ease-out forwards";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Show a success toast
 */
export function showSuccessToast(message: string): void {
  showToast(message, "success");
}

/**
 * Show an error toast
 */
export function showErrorToast(message: string): void {
  showToast(message, "error");
}
