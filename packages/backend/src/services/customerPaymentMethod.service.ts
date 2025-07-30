import { customerPaymentMethodModel } from "../models/customerPaymentMethod.model";
import { baseService } from "./baseService";
import { CustomerPeriod } from "shared-types";
import { supabase } from "../db/supabaseClient";

export class customerPaymentMethodService extends baseService<customerPaymentMethodModel> {
    constructor() {
        super("customer_payment_method"); // שם הטבלה ב-DB
    }

    async getByCustomerId(customerId: string): Promise<customerPaymentMethodModel[]> {
        const { data, error } = await supabase
            .from("customer_payment_method")
            .select("*")
            .eq("customer_id", customerId);

        if (error) {
            console.error("Error fetching payment methods by customer ID:", error);
            throw error;
        }

        return customerPaymentMethodModel.fromDatabaseFormatArray(data) || [];
    }

    async deleteByCustomerId(customerId: string): Promise<void> {
        const { error } = await supabase
            .from("customer_payment_method")
            .delete()
            .eq("customer_id", customerId);

        if (error) {
            console.error("Error deleting payment methods by customer ID:", error);
            throw error;
        }
    }
}

export const serviceCustomerPaymentMethod = new customerPaymentMethodService();