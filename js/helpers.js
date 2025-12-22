/**
 * Get the height of any visible trickle button.
 * Useful for other plugins to avoid overlapping the trickle button.
 * @returns {number} Height of trickle button including margins, or 0 if not found
 */
export function getTrickleButtonHeight() {
  // Find all trickle buttons and get the one with actual height (the visible one)
  const trickles = document.querySelectorAll('.trickle-button, .trickle');
  let visibleTrickle = null;
  let maxHeight = 0;

  trickles.forEach(trickle => {
    const rect = trickle.getBoundingClientRect();
    if (rect.height > maxHeight) {
      maxHeight = rect.height;
      visibleTrickle = trickle;
    }
  });

  if (!visibleTrickle || maxHeight === 0) return 0;

  const styles = window.getComputedStyle(visibleTrickle);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  return maxHeight + marginTop + marginBottom;
}
