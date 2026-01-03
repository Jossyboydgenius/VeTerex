/**
 * VeTerex UI Styles
 * Shared CSS styles and animations for content script UI components
 */

export const VETEREX_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
  
  @keyframes veterex-slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes veterex-fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes veterex-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .veterex-toast {
    position: fixed;
    bottom: 80px;
    right: 24px;
    padding: 12px 16px;
    border-radius: 10px;
    color: #fff;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    font-size: 14px;
    z-index: 999999;
    animation: veterex-slideIn 0.3s ease-out;
  }
  
  .veterex-toast-success {
    background: linear-gradient(135deg, #4BE15A 0%, #3DBF4D 100%);
    box-shadow: 0 4px 16px rgba(75, 225, 90, 0.3);
  }
  
  .veterex-toast-error {
    background: linear-gradient(135deg, #FF6D75 0%, #E55060 100%);
    box-shadow: 0 4px 16px rgba(255, 109, 117, 0.3);
  }
  
  .veterex-toast-info {
    background: linear-gradient(135deg, #9C86FF 0%, #7B68EE 100%);
    box-shadow: 0 4px 16px rgba(156, 134, 255, 0.3);
  }
`;

let stylesInjected = false;

/**
 * Inject VeTerex global styles into the document
 */
export function injectStyles(): void {
  if (stylesInjected || document.getElementById("veterex-global-styles")) {
    return;
  }

  const styleEl = document.createElement("style");
  styleEl.id = "veterex-global-styles";
  styleEl.textContent = VETEREX_STYLES;
  document.head.appendChild(styleEl);

  // Also inject Outfit font if not already present
  if (
    !document.querySelector(
      'link[href*="fonts.googleapis.com/css2?family=Outfit"]'
    )
  ) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }

  stylesInjected = true;
}
