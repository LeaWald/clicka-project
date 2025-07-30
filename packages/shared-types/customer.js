"use strict";
// customer-types.d.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExitReason = exports.CustomerStatus = exports.WorkspaceType = exports.ContractStatus = exports.TimelineEventType = void 0;
var TimelineEventType;
(function (TimelineEventType) {
    TimelineEventType["LEAD_CREATED"] = "LEAD_CREATED";
    TimelineEventType["INTERACTION"] = "INTERACTION";
    TimelineEventType["CONVERSION"] = "CONVERSION";
    TimelineEventType["CONTRACT_SIGNED"] = "CONTRACT_SIGNED";
    TimelineEventType["WORKSPACE_ASSIGNED"] = "WORKSPACE_ASSIGNED";
    TimelineEventType["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    TimelineEventType["STATUS_CHANGE"] = "STATUS_CHANGE";
    TimelineEventType["NOTE_ADDED"] = "NOTE_ADDED";
})(TimelineEventType || (exports.TimelineEventType = TimelineEventType = {}));
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["DRAFT"] = "DRAFT";
    ContractStatus["PENDING_SIGNATURE"] = "PENDING_SIGNATURE";
    ContractStatus["SIGNED"] = "SIGNED";
    ContractStatus["ACTIVE"] = "ACTIVE";
    ContractStatus["EXPIRED"] = "EXPIRED";
    ContractStatus["TERMINATED"] = "TERMINATED";
    ContractStatus["CANCELED"] = "CANCELED";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
// Workspace type enum
var WorkspaceType;
(function (WorkspaceType) {
    WorkspaceType["PRIVATE_ROOM"] = "PRIVATE_ROOM";
    WorkspaceType["DESK_IN_ROOM"] = "DESK_IN_ROOM";
    WorkspaceType["OPEN_SPACE"] = "OPEN_SPACE";
    WorkspaceType["KLIKAH_CARD"] = "KLIKAH_CARD";
})(WorkspaceType || (exports.WorkspaceType = WorkspaceType = {}));
// Customer status enum
var CustomerStatus;
(function (CustomerStatus) {
    CustomerStatus["ACTIVE"] = "ACTIVE";
    CustomerStatus["NOTICE_GIVEN"] = "NOTICE_GIVEN";
    CustomerStatus["EXITED"] = "EXITED";
    CustomerStatus["PENDING"] = "PENDING";
    CustomerStatus["CREATED"] = "CREATED";
})(CustomerStatus || (exports.CustomerStatus = CustomerStatus = {}));
// Exit reason enum
var ExitReason;
(function (ExitReason) {
    ExitReason["RELOCATION"] = "RELOCATION";
    ExitReason["BUSINESS_CLOSED"] = "BUSINESS_CLOSED";
    ExitReason["PRICE"] = "PRICE";
    ExitReason["WORK_FROM_HOME"] = "WORK_FROM_HOME";
    ExitReason["SPACE_NEEDS"] = "SPACE_NEEDS";
    ExitReason["DISSATISFACTION"] = "DISSATISFACTION";
    ExitReason["OTHER"] = "OTHER";
})(ExitReason || (exports.ExitReason = ExitReason = {}));