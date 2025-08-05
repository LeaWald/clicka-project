import { DateISO, ID, LoungePricing, MeetingRoomPricing, PricingTier, WorkspaceType } from "shared-types";

export class LoungePricingModel implements LoungePricing {
    id?: ID;
    eveningRate: number;
    memberDiscountRate: number;
    active: boolean;
    effectiveDate: DateISO;
    createdAt: DateISO;
    updatedAt: DateISO;
    constructor(data: {
        id?: ID;
        eveningRate: number;
        memberDiscountRate: number;
        active: boolean;
        effectiveDate: DateISO;
        createdAt: DateISO;
        updatedAt: DateISO;
    }) {
        this.id = data.id || undefined;
        this.eveningRate = data.eveningRate;
        this.memberDiscountRate = data.memberDiscountRate;
        this.active = data.active;
        this.effectiveDate = data.effectiveDate;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
    toDatabaseFormat() {
        return {
            evening_rate: this.eveningRate,
            member_discount_rate: this.memberDiscountRate,
            active: this.active,
            effective_date: this.effectiveDate,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}

export class MeetingRoomPricingModel implements MeetingRoomPricing {
    id?: ID;
    hourlyRate: number;
    discountedHourlyRate: number;
    freeHoursKlikahCard: number;
    active: boolean;
    effectiveDate: DateISO;
    createdAt: DateISO;
    updatedAt: DateISO;
    constructor(data: { // שינוי: הקונסטרקטור מקבל אובייקט data
        id?: ID;
        hourlyRate: number;
        discountedHourlyRate: number;
        freeHoursKlikahCard: number;
        active: boolean;
        effectiveDate: DateISO;
        createdAt: DateISO;
        updatedAt: DateISO;
    }) {
        this.id = data.id || undefined;
        this.hourlyRate = data.hourlyRate;
        this.discountedHourlyRate = data.discountedHourlyRate;
        this.freeHoursKlikahCard = data.freeHoursKlikahCard;
        this.active = data.active;
        this.effectiveDate = data.effectiveDate;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
    toDatabaseFormat() {
        return {
            hourly_rate: this.hourlyRate,
            discounted_hourly_rate: this.discountedHourlyRate,
            free_hours_klikah_card: this.freeHoursKlikahCard,
            active: this.active,
            effective_date: this.effectiveDate,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}
export class PricingTierModel implements PricingTier {
    id?: ID;
    workspaceType: WorkspaceType;
    year1Price: number;
    year2Price: number;
    year3Price: number;
    year4Price: number;
    twoDaysFromOfficePrice: number;
    threeDaysFromOfficePrice: number;
    active: boolean;
    effectiveDate: DateISO;
    createdAt: DateISO;
    updatedAt: DateISO;

    constructor(data: {
        id?: ID;
        workspaceType: WorkspaceType;
        year1Price: number;
        year2Price: number;
        year3Price: number;
        year4Price: number;
        twoDaysFromOfficePrice: number;
        threeDaysFromOfficePrice: number;
        active: boolean;
        effectiveDate: DateISO;
        createdAt: DateISO;
        updatedAt: DateISO;
    }) {
        this.id = data.id || undefined;
        this.workspaceType = data.workspaceType;
        this.year1Price = data.year1Price;
        this.year2Price = data.year2Price;
        this.year3Price = data.year3Price;
        this.year4Price = data.year4Price;
        this.twoDaysFromOfficePrice = data.twoDaysFromOfficePrice;
        this.threeDaysFromOfficePrice = data.threeDaysFromOfficePrice;
        this.active = data.active;
        this.effectiveDate = data.effectiveDate;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    toDatabaseFormat() {
        return {
            workspace_type: this.workspaceType,
            year1_price: this.year1Price,
            year2_price: this.year2Price,
            year3_price: this.year3Price,
            year4_price: this.year4Price,
            two_days_from_office_price: this.twoDaysFromOfficePrice,
            three_days_from_office_price: this.threeDaysFromOfficePrice,
            active: this.active,
            effective_date: this.effectiveDate,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
    static fromDatabaseFormat(data: any): PricingTierModel {
        return new PricingTierModel({
            id: data.id,
            workspaceType: data.workspace_type,
            year1Price: data.year1_price,
            year2Price: data.year2_price,
            year3Price: data.year3_price,
            year4Price: data.year4_price,
            twoDaysFromOfficePrice: data.two_days_from_office_price,
            threeDaysFromOfficePrice: data.three_days_from_office_price,
            active: data.active,
            effectiveDate: data.effective_date,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        });
    }
}
