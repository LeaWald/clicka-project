"use strict";
// workspace-types.d.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceStatus = void 0;
// Space status enum
var SpaceStatus;
(function (SpaceStatus) {
    SpaceStatus["AVAILABLE"] = "AVAILABLE";
    SpaceStatus["OCCUPIED"] = "OCCUPIED";
    SpaceStatus["RESERVED"] = "RESERVED";
    SpaceStatus["MAINTENANCE"] = "MAINTENANCE";
    SpaceStatus["INACTIVE"] = "INACTIVE";
})(SpaceStatus || (exports.SpaceStatus = SpaceStatus = {}));