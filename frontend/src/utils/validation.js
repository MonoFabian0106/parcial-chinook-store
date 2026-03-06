export function isPurchaseFormValid(form) {
  return Boolean(
    form.customer_id &&
      form.track_id &&
      form.billing_address &&
      form.billing_city &&
      form.billing_country &&
      form.billing_postal_code
  )
}
