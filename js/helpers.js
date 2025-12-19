/**
 * Get the height of the trickle button within a given parent container.
 * Used by other plugins to account for trickle space when positioning UI.
 * @param {Element} parentElement - The container to search within
 * @returns {number} Height of trickle button including margins, or 0 if not found
 */
export function getTrickleButtonHeight(parentElement) {
  if (!parentElement) return 0;

  const selector = [
    '.trickle-button',
    '.js-trickle-button',
    '[data-trickle]'
  ].join(', ');

  const trickle = parentElement.querySelector(selector);
  if (!trickle || trickle.offsetHeight === 0) return 0;

  const styles = window.getComputedStyle(trickle);
  const marginTop = parseFloat(styles.marginTop);
  const marginBottom = parseFloat(styles.marginBottom);
  return trickle.offsetHeight + marginTop + marginBottom;
}
