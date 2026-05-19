export function isItemDiscountable(item) {
  return item.product.discountable !== 0 && item.product.discountable !== false;
}

export function getItemDiscountPercentage(item, appliedDiscounts) {
  if (!isItemDiscountable(item)) {
    return 0;
  }
  return item.discount_percentage ?? appliedDiscounts?.percentage?.value ?? 0;
}
