// report-types.d.ts
// Time period enum
export var TimePeriod;
(function (TimePeriod) {
    TimePeriod["DAILY"] = "DAILY";
    TimePeriod["WEEKLY"] = "WEEKLY";
    TimePeriod["MONTHLY"] = "MONTHLY";
    TimePeriod["QUARTERLY"] = "QUARTERLY";
    TimePeriod["YEARLY"] = "YEARLY";
})(TimePeriod || (TimePeriod = {}));
export var ReportType;
(function (ReportType) {
    ReportType["CUSTOMER_AGING"] = "CUSTOMER_AGING";
    ReportType["REVENUE"] = "REVENUE";
    ReportType["EXPENSES"] = "EXPENSES";
    ReportType["PROFIT_LOSS"] = "PROFIT_LOSS";
    ReportType["CASH_FLOW"] = "CASH_FLOW";
    ReportType["OCCUPANCY_REVENUE"] = "OCCUPANCY_REVENUE";
})(ReportType || (ReportType = {}));
// Export format
export var ExportFormat;
(function (ExportFormat) {
    ExportFormat["CSV"] = "CSV";
    ExportFormat["PDF"] = "PDF";
    ExportFormat["EXCEL"] = "EXCEL";
})(ExportFormat || (ExportFormat = {}));
