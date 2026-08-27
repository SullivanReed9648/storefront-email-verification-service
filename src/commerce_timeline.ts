export type CommerceEvent =
  | { kind: "checkout_started"; cartId: string }
  | { kind: "fulfillment_started"; orderId: string }
  | { kind: "receipt_issued"; orderId: string; receiptId: string }
  | { kind: "order_updated"; orderId: string; summary: string };

export type CustomerAccount = {
  customerId: string;
  email: string;
  emailStatus: "pending_email_verification" | "verified";
  commerce: CommerceEvent[];
};
