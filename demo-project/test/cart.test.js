const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateTotal } = require("../src/cart.js");

test("applies each item's discount before summing", () => {
  const total = calculateTotal([
    { price: 100, qty: 1, discountPercent: 10 }, // 90
    { price: 50, qty: 2, discountPercent: 0 }, // 100
  ]);
  assert.equal(total, 190);
});
