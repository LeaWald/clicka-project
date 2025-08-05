// הפונקציה הזו:
// מקבלת את כל הנתונים הנדרשים (כולל שכבות תמחור, תקופות, ותק, כמות, וכו').
// מחשבת מחיר ליחידה לפי ותק.
// מבצעת פרורציה אם צריך.
// מחשבת סה"כ, מע"מ, וסה"כ לתשלום.
// מחזירה פירוט לכל חלל ולחשבונית.
import { PricingTier, ID, DateISO, BillingItemType, InvoiceStatus, WorkspaceType, SpaceStatus } from '../../../shared-types'; // ייבוא טיפוסים רלוונטיים
import { differenceInCalendarDays, startOfMonth, endOfMonth } from 'date-fns'; // פונקציות עזר לתאריכים
import { VAT_RATE } from '../constants'; // קבוע מע"מ
import { InvoiceItemModel, InvoiceModel } from '../models/invoice.model'; // מודלים של חשבונית ופריט חשבונית
import { customerService } from './customer.service'; // שירות לשליפת לקוחות
import { BookingService } from '../services/booking.service';
import { serviceCreateInvoice, serviceCreateInvoiceItem, serviceUpdateInvoice } from './invoice.service';
import { WorkspaceService } from './workspace.service';
// --- הרחבת מבני קלט ---
// מבנה להזמנת חדר ישיבות
interface MeetingRoomBooking {
    bookingId: ID;
    roomId: ID;
    totalHours: number; // סה"כ שעות שהוזמנו
    chargeableHours: number; // שעות חיוב
    totalCharge: number; // סה"כ תשלום
    isKlikahCardHolder?: boolean;
}

// מבנה קלט ראשי לפונקציית החישוב
interface BillingCalculationInput {
    customerId: ID;
    customerName: string; // שם הלקוח
    billingPeriod: { startDate: DateISO; endDate: DateISO }; // תקופת החיוב
    dueDate: DateISO;
    workspaces: {
        workspaceId: ID; // שם שדה תואם ל-id של חלל עבודה
        workspaceType: WorkspaceType; // סוג חלל
        contractStart: DateISO; // תאריך התחלת החוזה
        workspaceStart: DateISO; // תאריך התחלת חלל העבודה
        workspaceEnd?: DateISO; // תאריך סוף חלל העבודה (אופציונלי)
        quantity: number; // כמות
        pricingTiers: PricingTier[]; // מדרגות מחירים
        name: string; // הוסף שם
        status: SpaceStatus;
        positionX: number;
        positionY: number;
        width: number;
        height: number;
        createdAt: DateISO;
        updatedAt: DateISO;
        description?: string;
        room?: string;
        currentCustomerId?: ID;
        currentCustomerName?: string;
    }[];
    meetingRoomBookings?: MeetingRoomBooking[];
    taxRate?: number; // אחוז מע"מ, ברירת מחדל 18%
}

// תוצאה של חישוב חיוב - מחזירה גם חשבונית וגם פירוט חיובים
export interface BillingCalculationResult {
    invoice: InvoiceModel;
    workspaceCharges: any[];
    meetingRoomCharges: any[];
    subtotal: number;
    taxAmount: number;
    total: number;
}

//generateId רנדומלי ליצירת מס חשבונית 
export function generateId(): ID {
    return (Math.random() * 1000000).toFixed(0) as ID;
}
//עוברת על כל הלקוחות במערכת.
//מחשבת עבור כל אחד מהם את החשבונית לתקופה נתונה.
export const calculateBillingForAllCustomers = async (
    billingPeriod: { startDate: DateISO; endDate: DateISO },
    dueDate: DateISO,
    taxRate: number = VAT_RATE // ברירת מחדל היא VAT_RATE
) => {
    const serviceCustomer = new customerService();
    // שליפת כל הלקוחות
    const allCustomers = await serviceCustomer.getAll();
    const billingResults = [];

    for (const customer of allCustomers) {
        try {
            const result = await calculateBillingForCustomer(
                customer.idNumber,
                billingPeriod,
                dueDate,
                taxRate
            );
            billingResults.push(result);
        } catch (err: unknown) {
            const errorMessage = (err instanceof Error) ? err.message : 'Unknown error';
            console.error(`Error calculating billing for customer ${customer.id}:`, errorMessage);
            billingResults.push({ customerId: customer.id, error: errorMessage });
        }
    }

    return billingResults;
};
//מקבלת ID של לקוח ותקופת חיוב.
//מאמתת תאריכים.
//שולפת מידע על הלקוח, העמדות שלו, ההזמנות שלו.
//יוצרת חשבונית ראשונית (InvoiceModel).
//קוראת לפונקציה המרכזית billingCalculation שתבצע את החישובים בפועל.
//שומרת את החשבונית המלאה במערכת.
export const calculateBillingForCustomer = async (
    customerId: ID,
    billingPeriod: { startDate: DateISO; endDate: DateISO },
    dueDate: DateISO,
    taxRate: number = VAT_RATE
) => {
    console.log("Starting billing calculation for customer ID:", customerId);
    console.log("Billing period:", billingPeriod);
    console.log("Due date:", dueDate);

    const serviceCustomer = new customerService();
    const bookingService = new BookingService();
    const workspaceService = new WorkspaceService();

    // בדיקות תאריכים
    const startDate = new Date(billingPeriod.startDate);
    const endDate = new Date(billingPeriod.endDate);
    const dueDateObj = new Date(dueDate);

    console.log("Start date:", startDate);
    console.log("End date:", endDate);
    console.log("Due date object:", dueDateObj);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(dueDateObj.getTime())) {
        throw new Error('תאריך לא תקף');
    }
    if (startDate > endDate) {
        throw new Error('תאריך ההתחלה לא יכול להיות מאוחר מתאריך הסיום');
    }
    if (dueDateObj < endDate) {
        throw new Error('תאריך היעד לתשלום לא יכול להיות לפני תאריך הסיום של תקופת החיוב');
    }

    try {
        const customer = await serviceCustomer.getById(customerId);
        console.log('Customer fetched:', customer);

        if (!customer) {
            console.error('Error: Customer not found');
            throw new Error('Customer not found');
        }

        const rawWorkspaces = await workspaceService.getWorkspacesByCustomerId(customerId) ?? [];
        console.log('Raw workspaces fetched:', rawWorkspaces);

        if (rawWorkspaces.length === 0) {
            throw new Error('No workspaces found for the customer');
        } else if (rawWorkspaces.length > 1) {
            throw new Error('Multiple workspaces found when a single workspace was expected');
        }

        const workspaces = await Promise.all(rawWorkspaces.map(async ws => {
            const pricingTiers = await workspaceService.getPricingTiersByWorkspaceType(ws.type) || []; // קריאה לפונקציה לקבלת מדרגות תמחור

            return {
                workspaceId: ws.id ?? '',
                workspaceType: ws.type,
                contractStart: billingPeriod.startDate,
                workspaceStart: billingPeriod.startDate,
                workspaceEnd: undefined,
                quantity: 1,
                pricingTiers: pricingTiers, // קבלת מדרגות תמחור על פי ID של חלל העבודה
                name: ws.name ?? '',
                status: ws.status,
                positionX: ws.positionX ?? 0,
                positionY: ws.positionY ?? 0,
                width: ws.width ?? 0,
                height: ws.height ?? 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                description: ws.description ?? '',
                room: ws.location ?? '',
                currentCustomerId: ws.currentCustomerId ?? '', // מזהה לקוח נוכחי
                currentCustomerName: ws.currentCustomerName ?? '', //  שם לקוח נוכחי
            };
        }));

        console.log('Mapped workspaces:', workspaces);

        const allBookings = await bookingService.getAllBooking();

        if (!allBookings) {
            console.error('Error: No bookings found');
            throw new Error('No bookings found');
        }

        // חישוב טווח 24 בחודש הקודם עד 23 בחודש הזה
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth() === 0 ? 11 : now.getMonth() - 1, 24);
        if (now.getMonth() === 0) periodStart.setFullYear(now.getFullYear() - 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth(), 23);

        console.log('Booking period start:', periodStart);
        console.log('Booking period end:', periodEnd);

        const customerBookings = allBookings.filter(
            b =>
                b.customerId === customerId &&
                new Date(b.startTime) >= periodStart &&
                new Date(b.startTime) <= periodEnd
        );

        console.log('Filtered Customer Bookings:', customerBookings);

        const initialInvoice = new InvoiceModel(
            '',
            generateId(),
            customer.id!,
            customer.name,
            InvoiceStatus.DRAFT,
            new Date().toISOString(),
            dueDate,
            [],
            0,
            0,
            false,
            undefined,
            new Date().toISOString(),
            new Date().toISOString()
        );
        console.log('Initial Invoice created:', initialInvoice);
        const savedInvoice = await serviceCreateInvoice(initialInvoice);
        console.log('Saved Invoice:', savedInvoice);

        if (!savedInvoice.id) {
            throw new Error('Invoice ID is undefined');
        }

        const meetingRoomBookings = customerBookings.map(b => ({
            bookingId: b.id!,
            roomId: b.roomId,
            totalHours: b.totalHours, // סה"כ שעות שהוזמנו
            chargeableHours: b.chargeableHours, // שעות חיוב
            totalCharge: b.totalCharge, // סה"כ תשלום
            isKlikahCardHolder: false
        }));
        console.log('Meeting Room Bookings:', meetingRoomBookings);

        const result = await billingCalculation({
            customerId: customer.id!,
            customerName: customer.name,
            billingPeriod,
            dueDate,
            workspaces: workspaces,
            meetingRoomBookings,
            taxRate
        }, savedInvoice.id, savedInvoice.invoice_number);

        console.log('Billing calculation result:', result);

        const updatedInvoice = {
            ...savedInvoice,
            items: result.invoice.items,
            subtotal: result.subtotal,
            tax_total: result.taxAmount,
            total: result.total,
        };
        await serviceUpdateInvoice(savedInvoice.id, updatedInvoice);
        console.log('Updated Invoice:', updatedInvoice);
        return result;

    } catch (error) {
        console.error('Error during billing calculation:', error);
        if (error instanceof Error) {
            throw new Error(`Error calculating billing for customer ${customerId}: ${error.message}`);
        } else {
            throw new Error(`Error calculating billing for customer ${customerId}: Unknown error occurred.`);
        }
    }
};

// פונקציה זו מבצעת את החישובים בפועל ומחזירה את תוצאת החיוב.
export const billingCalculation = async (input: BillingCalculationInput, invoiceId: ID, invoice_number: ID): Promise<BillingCalculationResult> => {
    console.log('Starting billing calculation...');
    console.log('Input for billing calculation:', input);
    const taxRate = input.taxRate ?? VAT_RATE;
    let subtotal = 0;
    const workspaceCharges: any[] = [];
    const meetingRoomCharges: any[] = [];
    const items: InvoiceItemModel[] = [];

    const DEFAULT_UNIT_PRICE = 100; // מחיר ברירת מחדל
    // חישוב עבור חללי עבודה
    for (const ws of input.workspaces) {
        console.log('Processing workspace:', ws);

        const pricing = ws.pricingTiers
            .filter(
                p =>
                    p.workspaceType === ws.workspaceType &&
                    p.active &&
                    new Date(p.effectiveDate) <= new Date(input.billingPeriod.startDate)
            )
            .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];

        let unitPrice;
        let tenureYears = 1; // הגדר ברירת מחדל של שנות ותק

        if (pricing) {
            tenureYears = Math.max(
                1,
                Math.floor(
                    (new Date(input.billingPeriod.startDate).getTime() - new Date(ws.contractStart).getTime()) /
                    (365 * 24 * 60 * 60 * 1000)
                ) + 1
            );

            unitPrice = tenureYears === 2 ? pricing.year2Price :
                tenureYears === 3 ? pricing.year3Price :
                    tenureYears >= 4 ? pricing.year4Price : pricing.year1Price;
        } else {
            console.warn('No active pricing tier found for this workspace. Using default unit price.');
            unitPrice = DEFAULT_UNIT_PRICE; // השתמש במחיר ברירת המחדל
        }

        console.log(`Unit price for workspace ${ws.workspaceId} for tenure:`, unitPrice);

        const periodStart = ws.workspaceStart > input.billingPeriod.startDate ? ws.workspaceStart : input.billingPeriod.startDate;
        const periodEnd = ws.workspaceEnd && ws.workspaceEnd < input.billingPeriod.endDate ? ws.workspaceEnd : input.billingPeriod.endDate;

        console.log(`Billing period for workspace ${ws.workspaceId}:`, { periodStart, periodEnd });

        const monthStart = startOfMonth(new Date(periodStart));
        const monthEnd = endOfMonth(new Date(periodStart));
        const totalDays = differenceInCalendarDays(monthEnd, monthStart) + 1;
        console.log(`Total days in billing month for workspace ${ws.workspaceId}:`, totalDays);

        const billedStart = new Date(periodStart) < monthStart ? monthStart : new Date(periodStart);
        const billedEnd = new Date(periodEnd) > monthEnd ? monthEnd : new Date(periodEnd);
        const billedDays = differenceInCalendarDays(billedEnd, billedStart) + 1;
        console.log(`Billed days for workspace ${ws.workspaceId}:`, billedDays);

        if (billedDays < 0) {
            console.error('Error: Billed days cannot be negative');
            throw new Error('Billed days cannot be negative');
        }

        const prorationFactor = billedDays / totalDays;
        const totalPrice = Math.round(ws.quantity * unitPrice * prorationFactor * 100) / 100;

        console.log(`Total price for workspace ${ws.workspaceId}: ${totalPrice}`);

        workspaceCharges.push({
            workspaceId: ws.workspaceId,
            workspaceType: ws.workspaceType,
            quantity: ws.quantity,
            unitPrice,
            totalPrice,
            pricingTier: tenureYears,
            period: { startDate: periodStart, endDate: periodEnd },
        });

        // הוסף פריטי חשבונית
        const invoiceItem = new InvoiceItemModel(
            '',
            invoiceId as `${string}-${string}-${string}-${string}-${string}`, // ← הוספת as כאן
            BillingItemType.WORKSPACE,
            `השכרת ${ws.workspaceType}`,
            ws.quantity,
            unitPrice,
            totalPrice,
            taxRate,
            Math.round(totalPrice * (taxRate / 100) * 100) / 100,
            ws.workspaceType,
            ws.workspaceId,
            new Date().toISOString(),
            new Date().toISOString()
        );

        // הוסף את פריט החשבונית ל-DB
        await serviceCreateInvoiceItem(invoiceItem);
        items.push(invoiceItem); // הוסף את הפריט לרשימת הפריטים

        subtotal += totalPrice;
        console.log(`Subtotal after workspace ${ws.workspaceId}: ${subtotal}`);
    }

    //הוספת חיוב עבור כרטיס קליקה אם יש
    // אם יש לקוח עם כרטיס קליקה, הוסף חיוב עבורו
    const isKlikahCardHolder = input.workspaces.some(ws => ws.workspaceType === WorkspaceType.KLIKAH_CARD);
    const isKlikahCardProHolder = input.workspaces.some(ws => ws.workspaceType === WorkspaceType.KLIKAH_CARD_UPGRADED);

    if (isKlikahCardHolder) {
        const klikahCardPrice = 200;
        const klikahCardItem = new InvoiceItemModel(
            '',
            invoiceId as `${string}-${string}-${string}-${string}-${string}`, // ← הוספת as כאן
            BillingItemType.WORKSPACE,
            'דמי כרטיס קליקה',
            1,
            klikahCardPrice,
            klikahCardPrice,
            taxRate,
            Math.round(klikahCardPrice * (taxRate / 100) * 100) / 100,
            WorkspaceType.KLIKAH_CARD,
            undefined,
            new Date().toISOString(),
            new Date().toISOString()
        );
        await serviceCreateInvoiceItem(klikahCardItem);
        items.push(klikahCardItem);
        subtotal += klikahCardPrice;
        console.log('Added Klikah Card charge: 200');
    }

    if (isKlikahCardProHolder) {
        const klikahCardProPrice = 300;
        const klikahCardProItem = new InvoiceItemModel(
            '',
            invoiceId as `${string}-${string}-${string}-${string}-${string}`, // ← הוספת as כאן
            BillingItemType.WORKSPACE,
            'דמי כרטיס קליקה משודרג',
            1,
            klikahCardProPrice,
            klikahCardProPrice,
            taxRate,
            Math.round(klikahCardProPrice * (taxRate / 100) * 100) / 100,
            WorkspaceType.KLIKAH_CARD_UPGRADED,
            undefined,
            new Date().toISOString(),
            new Date().toISOString()
        );
        await serviceCreateInvoiceItem(klikahCardProItem);
        items.push(klikahCardProItem);
        subtotal += klikahCardProPrice;
        console.log('Added Klikah Card PRO charge: 300');
    }

    // חישוב עבור חדרי ישיבות
    // ערכי ברירת מחדל לתמחור חדרי ישיבות
    const DEFAULT_HOURLY_RATE = 100; // מחיר לשעת שימוש בחדר ישיבות

    // חישוב עבור חדרי ישיבות
    if (input.meetingRoomBookings && input.meetingRoomBookings.length > 0) {
        for (const booking of input.meetingRoomBookings) {
            const totalPrice = booking.totalCharge; // Use totalCharge directly
            const pricePerHour = booking.totalHours > 0 ? totalPrice / booking.totalHours : DEFAULT_HOURLY_RATE;

            meetingRoomCharges.push({
                bookingId: booking.bookingId,
                roomId: booking.roomId,
                totalHours: booking.totalHours,
                pricePerHour,
                totalPrice,
            });

            const meetingRoomItem = new InvoiceItemModel(
                '',
                invoiceId as `${string}-${string}-${string}-${string}-${string}`, // ← הוספת as כאן
                BillingItemType.MEETING_ROOM,
                'שימוש בחדר ישיבות',
                booking.totalHours,
                pricePerHour,
                totalPrice,
                taxRate,
                Math.round(totalPrice * (taxRate / 100) * 100) / 100,
                'MEETING_ROOM',
                booking.roomId,
                new Date().toISOString(),
                new Date().toISOString()
            );

            // הוספת פריט החשבונית ל-DB
            await serviceCreateInvoiceItem(meetingRoomItem);
            items.push(meetingRoomItem); // הוספת הפריט לרשימת הפריטים

            subtotal += totalPrice;
            console.log(`Subtotal after booking ${booking.bookingId}: ${subtotal}`);
        }
    }


    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;

    console.log(`Final Subtotal: ${subtotal}, Tax amount: ${taxAmount}, Total: ${total}`);

    return {
        invoice: new InvoiceModel(
            invoiceId,
            invoice_number,
            input.customerId,
            input.customerName,
            InvoiceStatus.DRAFT,
            new Date().toISOString(),
            new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
            items,
            subtotal,
            taxAmount,
            false,
            undefined,
            new Date().toISOString(),
            new Date().toISOString()
        ),
        workspaceCharges,
        meetingRoomCharges,
        subtotal,
        taxAmount,
        total
    };
};