/**
 * VeTerex UI Components
 * Exports all UI components for the media tracker
 */

// Export styles
export { VETEREX_STYLES, injectStyles } from "./styles";

// Export toast notifications
export { showSuccessToast, showErrorToast, showToast } from "./toast";

// Export Track Series button
export {
  showTrackSeriesButton,
  removeTrackSeriesButton,
} from "./track-series-button";

// Export Completion Banner
export {
  showCompletionBanner,
  removeCompletionBanner,
} from "./completion-banner";

// Re-export types
export type { ToastConfig } from "./toast";
