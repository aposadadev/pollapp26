export const useDevice = () => {
  if (!import.meta.client) {
    return { isMobile: false, isTablet: false, isDesktop: true }
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || ''

  // Detección por User Agent (expresión regular)
  const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

  // Detección complementaria por pantalla táctil y resolución
  const isTouchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches

  const isMobile = isMobileUA || (isTouchDevice && isSmallScreen)

  return {
    isMobile,
    isTablet: /ipad|tablet|playbook|silk/i.test(userAgent) && !isMobile,
    isDesktop: !isMobile
  }
}
