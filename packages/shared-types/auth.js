"use strict";
// auth-types.d.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
// User role enum
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["SYSTEM_ADMIN"] = "SYSTEM_ADMIN"; // Technical admin
})(UserRole || (exports.UserRole = UserRole = {}));