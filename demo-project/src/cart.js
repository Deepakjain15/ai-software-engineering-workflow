/**
 * Calculates the total price of a cart.
 * BUG: ignores each item's discountPercent field.
 */
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

module.exports = { calculateTotal };
