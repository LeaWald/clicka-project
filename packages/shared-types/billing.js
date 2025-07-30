"use strict";
// billing-types.d.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingItemType = exports.PaymentMethodType = exports.InvoiceStatus = void 0;
// Invoice status enum
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["ISSUED"] = "ISSUED";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["CANCELED"] = "CANCELED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
// Payment method enum
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethodType["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethodType["CHECK"] = "CHECK";
    PaymentMethodType["CASH"] = "CASH";
    PaymentMethodType["OTHER"] = "OTHER";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
// Billing item type enum
var BillingItemType;
(function (BillingItemType) {
    BillingItemType["WORKSPACE"] = "WORKSPACE";
    BillingItemType["MEETING_ROOM"] = "MEETING_ROOM";
    BillingItemType["LOUNGE"] = "LOUNGE";
    BillingItemType["SERVICE"] = "SERVICE";
    BillingItemType["DISCOUNT"] = "DISCOUNT";
    BillingItemType["OTHER"] = "OTHER";
})(BillingItemType || (exports.BillingItemType = BillingItemType = {}));