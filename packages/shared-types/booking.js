// booking-types.d.ts
// Room type enum
export var RoomType;
(function (RoomType) {
    RoomType["MEETING_ROOM"] = "MEETING_ROOM";
    RoomType["LOUNGE"] = "LOUNGE";
})(RoomType || (RoomType = {}));
// Room status enum
export var RoomStatus;
(function (RoomStatus) {
    RoomStatus["AVAILABLE"] = "AVAILABLE";
    RoomStatus["OCCUPIED"] = "OCCUPIED";
    RoomStatus["MAINTENANCE"] = "MAINTENANCE";
    RoomStatus["INACTIVE"] = "INACTIVE";
})(RoomStatus || (RoomStatus = {}));
// Booking status enum
export var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "PENDING";
    BookingStatus["APPROVED"] = "APPROVED";
    BookingStatus["REJECTED"] = "REJECTED";
    BookingStatus["CANCELED"] = "CANCELED";
    BookingStatus["COMPLETED"] = "COMPLETED";
})(BookingStatus || (BookingStatus = {}));
