"use strict";
// lead-types.d.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionType = exports.LeadSource = exports.LeadStatus = void 0;
// Lead status enum
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "NEW";
    LeadStatus["CONTACTED"] = "CONTACTED";
    LeadStatus["INTERESTED"] = "INTERESTED";
    LeadStatus["SCHEDULED_TOUR"] = "SCHEDULED_TOUR";
    LeadStatus["PROPOSAL_SENT"] = "PROPOSAL_SENT";
    LeadStatus["CONVERTED"] = "CONVERTED";
    LeadStatus["NOT_INTERESTED"] = "NOT_INTERESTED";
    LeadStatus["LOST"] = "LOST";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
// Lead source enum
var LeadSource;
(function (LeadSource) {
    LeadSource["WEBSITE"] = "WEBSITE";
    LeadSource["REFERRAL"] = "REFERRAL";
    LeadSource["SOCIAL_MEDIA"] = "SOCIAL_MEDIA";
    LeadSource["EVENT"] = "EVENT";
    LeadSource["PHONE"] = "PHONE";
    LeadSource["WALK_IN"] = "WALK_IN";
    LeadSource["EMAIL"] = "EMAIL";
    LeadSource["OTHER"] = "OTHER";
})(LeadSource || (exports.LeadSource = LeadSource = {}));
// Lead interaction type enum
var InteractionType;
(function (InteractionType) {
    InteractionType["EMAIL"] = "EMAIL";
    InteractionType["PHONE"] = "PHONE";
    InteractionType["MEETING"] = "MEETING";
    InteractionType["TOUR"] = "TOUR";
    InteractionType["NOTE"] = "NOTE";
    InteractionType["DOCUMENT"] = "DOCUMENT";
})(InteractionType || (exports.InteractionType = InteractionType = {}));