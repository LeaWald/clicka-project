import {
  PricingTierCreateRequest,
  PricingTier,
  UpdatePricingTierRequest,
  MeetingRoomPricing,
  UpdateMeetingRoomPricingRequest,
  LoungePricing,
  UpdateLoungePricingRequest,
} from "shared-types";
import { WorkspaceType } from "shared-types";
import type { ID } from "shared-types";
import { supabase } from '../db/supabaseClient'; 
import {
    
    MeetingRoomPricingModel,
    LoungePricingModel,
    PricingTierModel
} from '../models/pricing.model';


// בדיקה שמחירים אינם שליליים - פונקציה זו נשארת ללא שינוי
export function validatePrices(prices: number[]) {
  for (const price of prices) {
    if (price < 0) throw new Error("לא ניתן להזין מחירים שליליים");
  }
}
/*
// בדיקה של חפיפות תאריכי התחולה בין שכבות פעילות באותה קטגוריה - מעודכנת לעבודה מול Supabase
export async function checkEffectiveDateConflict(
  supabaseClient: typeof supabase,
  tableName: string,
  newEffectiveDate: string,
  filterConditions: Record<string, any> = {},
  idToExclude: ID | undefined = undefined // הגדרת ערך ברירת מחדל ל-undefined
) {
  const newDate = new Date(newEffectiveDate); // תאריך התחולה החדש שאותו בודקים

  let query = supabaseClient
    .from(tableName)
    .select('id, effective_date')
    .eq('effective_date', newDate.toISOString().split('T')[0]) // השוואת תאריך בלבד (YYYY-MM-DD)
    .eq('active', true); // בודקים רק רשומות פעילות

  // הוספת תנאי סינון נוספים (לדוגמה, workspace_type, או כל פילטר אחר)
  for (const key in filterConditions) {
    if (Object.prototype.hasOwnProperty.call(filterConditions, key)) { // ודא שזה מאפיין של האובייקט
      query = query.eq(key, filterConditions[key]);
    }
  }

  // אם נשלח ID להחרגה (במקרה של עדכון), מוסיפים את התנאי .neq()
  if (idToExclude) {
    query = query.neq('id', idToExclude);
  }

  // ביצוע השאילתה וציפייה לפריט יחיד או לא כלום
  const { data: conflictingItem, error } = await query.maybeSingle();

  // טיפול בשגיאות מה-Supabase (למעט שגיאת 'No rows found')
  if (error && error.code !== 'PGRST116') {
    console.error(`Error checking effective date conflict in ${tableName}:`, error);
    throw new Error('Failed to check for effective date conflicts.');
  }

  // אם נמצא פריט מתנגש (שאינו הפריט המעודכן עצמו)
  if (conflictingItem) {
    throw new Error(
      `תאריך התחולה ${newEffectiveDate} מתנגש עם שכבה קיימת (id: ${conflictingItem.id})`
    );
  }
  // אם conflictingItem הוא null, אין התנגשות, והפונקציה מסתיימת בהצלחה.

}
  */
// ========================
// סביבת עבודה - מעודכן לעבודה מול Supabase
// ========================

export async function createPricingTierWithHistory(
  request: PricingTierCreateRequest,
): Promise<PricingTier> {
  try {
    const now = new Date();
    const currentTimestamp = now.toISOString();

    // שלב 1: מצא את המחיר ה"פעיל" הנוכחי (ש effective_date שלו הוא היום או בעבר)
    // זהו המחיר שאותו אנחנו רוצים להפוך ל-active: false
    const { data: currentActivePricing, error: fetchCurrentError } = await supabase
      .from('pricing_tiers')
      .select('id') // אנחנו צריכים רק את ה-ID שלו
      .eq('active', true)
      .lte('effective_date', currentTimestamp) // תאריך התחלה הוא היום או בעבר
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (fetchCurrentError && fetchCurrentError.code !== 'PGRST116') {
      console.error('שגיאה באחזור תמחור חדר ישיבות פעיל נוכחי:', fetchCurrentError);
      throw new Error('הפעולה לאחזור תמחור חדר ישיבות פעיל נוכחי נכשלה');
    }

    // שלב 2: אם נמצא מחיר פעיל נוכחי, השבת אותו (active: false)
    if (currentActivePricing) {
      const { error: updateError } = await supabase
        .from('pricing_tiers')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
          // updated_by: createdBy, // הוסף אם קיים שדה updated_by בטבלה
        })
        .eq('id', currentActivePricing.id); // <--- עדכן רק את הרשומה הספציפית הזו

      if (updateError) {
        console.error('שגיאה בנטרול תמחור חדר ישיבות פעיל קודם:', updateError);
        throw new Error('הפעולה לנטרול תמחור חדר ישיבות פעיל קודם נכשלה');
      }
    }

    // שלב 3: יצירת תמחור חדש (שיהיה active: true באופן אוטומטי כפי שראינו בפונקציה createMeetingRoomPricing)
    return await createPricingTier(request );
  } catch (e) {
    console.error('חריגה בפונקציה createMeetingRoomPricingWithHistory:', e);
    throw e;
  }
}
export async function createPricingTier(
  request: PricingTierCreateRequest
): Promise<PricingTier> {
  try {
    if (!request.workspaceType) {
      throw new Error("חובה לבחור סוג סביבת עבודה.");
    }
    validatePrices([
      request.year1Price,
      request.year2Price,
      request.year3Price,
      request.year4Price,
      request.twoDaysFromOfficePrice,
      request.threeDaysFromOfficePrice,
    ]);
    const effectiveDate = new Date(request.effectiveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (effectiveDate < today) {
      throw new Error("תאריך התחולה חייב להיות היום או בעתיד.");
    }

    // בדיקת התנגשות תאריכים מול מסד הנתונים
    await checkEffectiveDateConflict(
      supabase,
      'pricing_tiers',
      request.effectiveDate,
      { workspace_type: request.workspaceType }
    );


    const newPricingTierModel = new PricingTierModel({
      workspaceType: request.workspaceType,
      year1Price: request.year1Price,
      year2Price: request.year2Price,
      year3Price: request.year3Price,
      year4Price: request.year4Price,
      twoDaysFromOfficePrice: request.twoDaysFromOfficePrice,
      threeDaysFromOfficePrice: request.threeDaysFromOfficePrice,
      effectiveDate: request.effectiveDate,
      active: true, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const { data, error } = await supabase
      .from('pricing_tiers')
      .insert(newPricingTierModel.toDatabaseFormat())
      .select()
      .single();
    if (error) {
      console.error('שגיאה ביצירת שכבת תמחור:', error);
      throw new Error('הפעולה ליצירת שכבת תמחור נכשלה.');
    }
    return new PricingTierModel({
      id: data.id,
      workspaceType: data.workspace_type,
      year1Price: data.year1_price,
      year2Price: data.year2_price,
      year3Price: data.year3_price,
      year4Price: data.year4_price,
      twoDaysFromOfficePrice: data.two_days_from_office_price,
      threeDaysFromOfficePrice: data.three_days_from_office_price,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('חריגה בפונקציה createPricingTier:', e);
    throw e;
  }
}

// פונקציית העזר checkEffectiveDateConflict (כפי שתוקנה לאחרונה)
// קודם כל, זו הפונקציה שעושה את בדיקת ההתנגשות
export async function checkEffectiveDateConflict(
  supabaseClient: typeof supabase,
  tableName: string,
  newEffectiveDate: string,
  filterConditions: Record<string, any> = {},
  idToExclude: ID | undefined = undefined // הגדרת ערך ברירת מחדל ל-undefined
) {
  const newDate = new Date(newEffectiveDate); // תאריך התחולה החדש שאותו בודקים

  let query = supabaseClient
    .from(tableName)
    .select('id, effective_date')
    .eq('effective_date', newDate.toISOString().split('T')[0]) // השוואת תאריך בלבד (YYYY-MM-DD)
    .eq('active', true); // בודקים רק רשומות פעילות

  // הוספת תנאי סינון נוספים (לדוגמה, workspace_type, או כל פילטר אחר)
  for (const key in filterConditions) {
    if (Object.prototype.hasOwnProperty.call(filterConditions, key)) { // ודא שזה מאפיין של האובייקט
      query = query.eq(key, filterConditions[key]);
    }
  }

  // אם נשלח ID להחרגה (במקרה של עדכון), מוסיפים את התנאי .neq()
  if (idToExclude) {
    query = query.neq('id', idToExclude);
  }

  // ביצוע השאילתה וציפייה לפריט יחיד או לא כלום
  const { data: conflictingItem, error } = await query.maybeSingle();

  // טיפול בשגיאות מה-Supabase (למעט שגיאת 'No rows found')
  if (error && error.code !== 'PGRST116') { // PGRST116 הוא "No rows found", וזה תקין
    console.error(`Error checking effective date conflict in ${tableName}:`, error);
    throw new Error('Failed to check for effective date conflicts.');
  }

  // אם נמצא פריט מתנגש (שאינו הפריט המעודכן עצמו)
  if (conflictingItem) {
    throw new Error(
      `תאריך התחולה ${newEffectiveDate} מתנגש עם שכבה קיימת (id: ${conflictingItem.id})`
    );
  }
  // אם conflictingItem הוא null, אין התנגשות, והפונקציה מסתיימת בהצלחה.
}

export async function getPricingHistory(workspaceType: WorkspaceType): Promise<PricingTier[]> {
  try {
    const { data, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('workspace_type', workspaceType)
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('שגיאה באחזור היסטוריית תמחור סביבת עבודה:', error);
      throw new Error(`שגיאת Supabase: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map(
      (item) =>
        new PricingTierModel({
          id: item.id,
          workspaceType: item.workspace_type,
          year1Price: item.year1_price,
          year2Price: item.year2_price,
          year3Price: item.year3_price,
          year4Price: item.year4_price,
          twoDaysFromOfficePrice: item.two_days_from_office_price,
          threeDaysFromOfficePrice: item.three_days_from_office_price,
          effectiveDate: item.effective_date,
          active: item.active,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })
    );
  } catch (e) {
    console.error('חריגה בפונקציה getPricingHistory:', e);
    throw e;
  }
}


export async function getCurrentPricingTier(
  workspaceType: WorkspaceType
): Promise<PricingTier | null> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('workspace_type', workspaceType)
      .eq('active', true)
      .lte('effective_date', now)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('שגיאה באחזור שכבת תמחור נוכחית:', error);
      throw new Error('הפעולה לאחזור שכבת תמחור נוכחית נכשלה.');
    }

    if (!data) return null;

    return new PricingTierModel({
      id: data.id,
      workspaceType: data.workspace_type,
      year1Price: data.year1_price,
      year2Price: data.year2_price,
      year3Price: data.year3_price,
      year4Price: data.year4_price,
      twoDaysFromOfficePrice: data.two_days_from_office_price,
      threeDaysFromOfficePrice: data.three_days_from_office_price,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('חריגה בפונקציה getCurrentPricingTier:', e);
    throw e;
  }
}

export async function updatePricingTier(
  id: ID,
  update: Partial<UpdatePricingTierRequest>,
  updatedBy?: ID
): Promise<PricingTier> {
  try {
    const { data: existingTier, error: fetchError } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTier) {
      console.error('שגיאה באחזור שכבת תמחור קיימת:', fetchError);
      throw new Error("שכבת תמחור לא נמצאה.");
    }

    const updatedTierModel = new PricingTierModel({
      id: existingTier.id,
      workspaceType: update.workspaceType ?? existingTier.workspace_type,
      year1Price: update.year1Price ?? existingTier.year1_price,
      year2Price: update.year2Price ?? existingTier.year2_price,
      year3Price: update.year3Price ?? existingTier.year3_price,
      year4Price: update.year4Price ?? existingTier.year4_price,
      twoDaysFromOfficePrice: update.twoDaysFromOfficePrice ?? existingTier.two_days_from_office_price,
      threeDaysFromOfficePrice: update.threeDaysFromOfficePrice ?? existingTier.three_days_from_office_price,
      effectiveDate: update.effectiveDate ?? existingTier.effective_date,
      active: existingTier.active,
      createdAt: existingTier.created_at,
      updatedAt: new Date().toISOString(),
    });

    if (
      update.year1Price !== undefined ||
      update.year2Price !== undefined ||
      update.year3Price !== undefined ||
      update.year4Price !== undefined
    ) {
      validatePrices([
        updatedTierModel.year1Price,
        updatedTierModel.year2Price,
        updatedTierModel.year3Price,
        updatedTierModel.year4Price,
      ]);
    }

    if (update.effectiveDate) {
      const todayStartOfDay = new Date();
      todayStartOfDay.setHours(0, 0, 0, 0);

      const newEffectiveDate = new Date(update.effectiveDate);
      if (newEffectiveDate < todayStartOfDay) {
        throw new Error("לא ניתן לעדכן תאריך תחילה לתאריך שכבר עבר.");
      }

      await checkEffectiveDateConflict(
        supabase,
        'pricing_tiers',
        update.effectiveDate,
        { workspace_type: updatedTierModel.workspaceType },
        id
      );
    }

    const { data, error: updateError } = await supabase
      .from('pricing_tiers')
      .update(updatedTierModel.toDatabaseFormat())
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('שגיאה בעדכון שכבת תמחור:', updateError);
      throw new Error('הפעולה לעדכון שכבת תמחור נכשלה.');
    }

    return new PricingTierModel({
      id: data.id,
      workspaceType: data.workspace_type,
      year1Price: data.year1_price,
      year2Price: data.year2_price,
      year3Price: data.year3_price,
      year4Price: data.year4_price,
      twoDaysFromOfficePrice: data.two_days_from_office_price,
      threeDaysFromOfficePrice: data.three_days_from_office_price,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });

  } catch (e) {
    console.error('חריגה בפונקציה updatePricingTier:', e);
    throw e;
  }
}

export async function bulkUpdatePricingTiers(
  updates: Partial<UpdatePricingTierRequest>[],
  updatedBy: ID
): Promise<PricingTier[]> {
  try {
    const updatedTiersPromises: Promise<PricingTier>[] = [];

    for (const update of updates) {
      if (!update.workspaceType) {
        throw new Error("חובה לציין סוג סביבת עבודה לעדכון.");
      }

      const { data: tier, error: fetchError } = await supabase
        .from('pricing_tiers')
        .select('id')
        .eq('workspace_type', update.workspaceType)
        .eq('active', true)
        .single();

      if (fetchError || !tier) {
        throw new Error(`לא נמצאה שכבת תמחור פעילה לסוג ${update.workspaceType}.`);
      }

      updatedTiersPromises.push(updatePricingTier(tier.id, update, updatedBy));
    }

    return Promise.all(updatedTiersPromises);
  } catch (e) {
    console.error('חריגה בפונקציה bulkUpdatePricingTiers:', e);
    throw e;
  }
}

export async function deletePricingTier(id: ID): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pricing_tiers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('שגיאה במחיקה פיזית של שכבת תמחור:', error);
      throw new Error("הפעולה למחיקה פיזית של שכבת תמחור נכשלה.");
    }

    return true;
  } catch (e) {
    console.error('חריגה בפונקציה deletePricingTier:', e);
    throw e;
  }
}
// ========================
// תמחור חדרי ישיבות - מעודכן לעבודה מול Supabase
// ========================

export async function createMeetingRoomPricingWithHistory(
  request: UpdateMeetingRoomPricingRequest
): Promise<MeetingRoomPricing> {
  try {
    const now = new Date();
    const currentTimestamp = now.toISOString();

    // שלב 1: מצא את המחיר ה"פעיל" הנוכחי (ש effective_date שלו הוא היום או בעבר)
    // זהו המחיר שאותו אנחנו רוצים להפוך ל-active: false
    const { data: currentActivePricing, error: fetchCurrentError } = await supabase
      .from('meeting_room_pricing')
      .select('id') // אנחנו צריכים רק את ה-ID שלו
      .eq('active', true)
      .lte('effective_date', currentTimestamp) // תאריך התחלה הוא היום או בעבר
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (fetchCurrentError && fetchCurrentError.code !== 'PGRST116') {
      console.error('שגיאה באחזור תמחור חדר ישיבות פעיל נוכחי:', fetchCurrentError);
      throw new Error('הפעולה לאחזור תמחור חדר ישיבות פעיל נוכחי נכשלה');
    }

    // שלב 2: אם נמצא מחיר פעיל נוכחי, השבת אותו (active: false)
    if (currentActivePricing) {
      const { error: updateError } = await supabase
        .from('meeting_room_pricing')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
          // updated_by: createdBy, // הוסף אם קיים שדה updated_by בטבלה
        })
        .eq('id', currentActivePricing.id); // <--- עדכן רק את הרשומה הספציפית הזו

      if (updateError) {
        console.error('שגיאה בנטרול תמחור חדר ישיבות פעיל קודם:', updateError);
        throw new Error('הפעולה לנטרול תמחור חדר ישיבות פעיל קודם נכשלה');
      }
    }

    // שלב 3: יצירת תמחור חדש (שיהיה active: true באופן אוטומטי כפי שראינו בפונקציה createMeetingRoomPricing)
    return await createMeetingRoomPricing(request);
  } catch (e) {
    console.error('חריגה בפונקציה createMeetingRoomPricingWithHistory:', e);
    throw e;
  }
}
export async function createMeetingRoomPricing(
  request: UpdateMeetingRoomPricingRequest
): Promise<MeetingRoomPricing> {
  try {
    validatePrices([request.hourlyRate, request.discountedHourlyRate]);
    if (request.freeHoursKlikahCard < 0)
      throw new Error("freeHoursKlikahCard לא יכול להיות שלילי");

    await checkEffectiveDateConflict(supabase, 'meeting_room_pricing', request.effectiveDate);

    const newPricingModel = new MeetingRoomPricingModel({
      hourlyRate: request.hourlyRate,
      discountedHourlyRate: request.discountedHourlyRate,
      freeHoursKlikahCard: request.freeHoursKlikahCard,
      effectiveDate: request.effectiveDate,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('meeting_room_pricing')
      .insert(newPricingModel.toDatabaseFormat())
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting room pricing:', error);
      throw new Error('Failed to create meeting room pricing');
    }

    return new MeetingRoomPricingModel({
      id: data.id,
      hourlyRate: data.hourly_rate,
      discountedHourlyRate: data.discounted_hourly_rate,
      freeHoursKlikahCard: data.free_hours_klikah_card,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('Exception in createMeetingRoomPricing:', e);
    throw e;
  }
}

export async function getMeetingRoomPricingHistory(): Promise<MeetingRoomPricing[]> {
  try {
    const { data, error } = await supabase
      .from('meeting_room_pricing')
      .select('*')
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('Error fetching meeting room pricing history:', error);
      throw new Error('Failed to fetch meeting room pricing history');
    }

    return data.map(item => new MeetingRoomPricingModel({
      id: item.id,
      hourlyRate: item.hourly_rate,
      discountedHourlyRate: item.discounted_hourly_rate,
      freeHoursKlikahCard: item.free_hours_klikah_card,
      effectiveDate: item.effective_date,
      active: item.active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (e) {
    console.error('Exception in getMeetingRoomPricingHistory:', e);
    throw e;
  }
}

export async function getCurrentMeetingRoomPricing(): Promise<MeetingRoomPricing | null> {
  try {
    const now = new Date();
    const currentTimestamp = now.toISOString();
    const { data, error } = await supabase
      .from('meeting_room_pricing')
      .select('*')
      .eq('active', true) 
      .lte('effective_date', currentTimestamp)
      .order('effective_date', { ascending: false }) 
      .limit(1) 
      .single(); 

    // טיפול בשגיאה של Supabase כאשר אין רשומות תואמות ('PGRST116')
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current meeting room pricing:', error);
      throw new Error('Failed to fetch current meeting room pricing');
    }
    if (!data) return null;
    return new MeetingRoomPricingModel({
      id: data.id,
      hourlyRate: data.hourly_rate,
      discountedHourlyRate: data.discounted_hourly_rate,
      freeHoursKlikahCard: data.free_hours_klikah_card,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('Exception in getCurrentMeetingRoomPricing:', e);
    throw e;
  }
}
export async function updateMeetingRoomPricing(
  id: ID,
  update: Partial<UpdateMeetingRoomPricingRequest>,
  updatedBy?: ID
): Promise<MeetingRoomPricing> {
  try {
    const { data: existingPricing, error: fetchError } = await supabase
      .from('meeting_room_pricing')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPricing) {
      console.error('Error fetching existing meeting room pricing:', fetchError);
      throw new Error("תמחור חדר ישיבות לא נמצא");
    }

    const updatedPricingModel = new MeetingRoomPricingModel({
        id: existingPricing.id,
        hourlyRate: update.hourlyRate !== undefined ? update.hourlyRate : existingPricing.hourly_rate,
        discountedHourlyRate: update.discountedHourlyRate !== undefined ? update.discountedHourlyRate : existingPricing.discounted_hourly_rate,
        freeHoursKlikahCard: update.freeHoursKlikahCard !== undefined ? update.freeHoursKlikahCard : existingPricing.free_hours_klikah_card,
        effectiveDate: update.effectiveDate !== undefined ? update.effectiveDate : existingPricing.effective_date,
        active: existingPricing.active, // <-- תיקון כאן
        createdAt: existingPricing.created_at,
        updatedAt: new Date().toISOString(),
    });

    if (
      update.hourlyRate !== undefined ||
      update.discountedHourlyRate !== undefined
    ) {
      validatePrices([
        update.hourlyRate ?? updatedPricingModel.hourlyRate,
        update.discountedHourlyRate ?? updatedPricingModel.discountedHourlyRate,
      ]);
    }

    if (updatedPricingModel.freeHoursKlikahCard < 0) {
      throw new Error("freeHoursKlikahCard לא יכול להיות שלילי");
    }

    if (update.effectiveDate) {
      await checkEffectiveDateConflict(supabase, 'meeting_room_pricing', update.effectiveDate, {}, id);
    }

    const { data, error: updateError } = await supabase
      .from('meeting_room_pricing')
      .update(updatedPricingModel.toDatabaseFormat())
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating meeting room pricing:', updateError);
      throw new Error('Failed to update meeting room pricing');
    }

    return new MeetingRoomPricingModel({
      id: data.id,
      hourlyRate: data.hourly_rate,
      discountedHourlyRate: data.discounted_hourly_rate,
      freeHoursKlikahCard: data.free_hours_klikah_card,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('Exception in updateMeetingRoomPricing:', e);
    throw e;
  }
}

export async function deleteMeetingRoomPricing(id: ID): Promise<boolean> {
  try {
    // השתמש ב-.delete() כדי לבצע מחיקה פיזית
    const { error } = await supabase
      .from('meeting_room_pricing') // ודאי ששם הטבלה נכון
      .delete() // <--- השינוי העיקרי כאן!
      .eq('id', id);

    if (error) {
      console.error('Error deleting meeting room pricing physically:', error);
      throw new Error("Failed to physically delete meeting room pricing");
    }

    return true;
  } catch (e) {
    console.error('Exception in deleteMeetingRoomPricing:', e);
    throw e;
  }
}
// export async function getMeetingRoomPriceByDate(date: DateISO): Promise<number | null> {
//   try {
//     const { data, error } = await supabase
//       .from('meeting_room_pricing')
//       .select('*')
//       .lte('effective_date', date)  // כל תאריך תחולה עד לתאריך המבוקש כולל
//       .order('effective_date', { ascending: false })  // מיון מהתאריך הכי קרוב למעלה
//       .limit(1)
//       .single();

//     if (error && error.code !== 'PGRST116') {
//       console.error('Error fetching meeting room pricing by date:', error);
//       throw new Error('Failed to fetch meeting room pricing by date');
//     }

//     if (!data) {
//       return null; // אין תמחור תקף לתאריך זה או לפניו
//     }

//     return data.hourly_rate;
//   } catch (e) {
//     console.error('Exception in getMeetingRoomPriceByDate:', e);
//     throw e;
//   }
// }
// ========================
// תמחור לאונג' - מעודכן לעבודה מול Supabase
// ========================

export async function createLoungePricing(
  request: UpdateLoungePricingRequest
): Promise<LoungePricing> {
  try {
    validatePrices([request.eveningRate, request.memberDiscountRate]);

    if (request.memberDiscountRate > request.eveningRate) { // תיקון: הנחה לא יכולה להיות גבוהה מהמחיר
      throw new Error("הנחת חברים (memberDiscountRate) לא יכולה להיות גבוהה מהמחיר הרגיל (eveningRate).");
    }

    const todayStartOfDay = new Date();
    todayStartOfDay.setHours(0, 0, 0, 0); // מגדיר את היום הנוכחי לתחילתו (00:00:00)

    const effectiveDate = new Date(request.effectiveDate);
    if (effectiveDate < todayStartOfDay) {
      throw new Error("לא ניתן להזין תאריך תחילה שכבר עבר.");
    }

    // בדיקה לקונפליקט תאריכים. פונקציה זו צריכה לוודא שאין תאריך effectiveDate זהה כבר קיים.
    await checkEffectiveDateConflict(supabase, 'lounge_pricing', request.effectiveDate);

    const newPricingModel = new LoungePricingModel({
      eveningRate: request.eveningRate,
      memberDiscountRate: request.memberDiscountRate,
      effectiveDate: request.effectiveDate,
      active: true, // <--- תמיד נוצר כ-active: true
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('lounge_pricing')
      .insert(newPricingModel.toDatabaseFormat())
      .select()
      .single();

    if (error) {
      console.error('Error creating lounge pricing:', error);
      throw new Error(error.message || 'שגיאה ביצירת תמחור לאונג׳');
    }

    return new LoungePricingModel({
      id: data.id,
      eveningRate: data.evening_rate,
      memberDiscountRate: data.member_discount_rate,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('Exception in createLoungePricing:', e);
    throw e;
  }
}

export async function createLoungePricingWithHistory(
  request: UpdateLoungePricingRequest
): Promise<LoungePricing> {
  try {
    const now = new Date();
    const currentTimestamp = now.toISOString();

    // שלב 1: מצא את המחיר ה"פעיל" הנוכחי (זה שeffective_date שלו הוא היום או בעבר)
    // זהו המחיר שאותו אנחנו רוצים להפוך ל-active: false
    const { data: currentActivePricing, error: fetchCurrentError } = await supabase
      .from('lounge_pricing')
      .select('id') // אנחנו צריכים רק את ה-ID שלו
      .eq('active', true) // רק מחיר שסומן כפעיל
      .lte('effective_date', currentTimestamp) // תאריך התחלה הוא היום או בעבר
      .order('effective_date', { ascending: false }) // הכי עדכני מבין הפעילים
      .limit(1)
      .single();

    // טיפול בשגיאה שכיחה של Supabase כאשר אין רשומות תואמות ('PGRST116')
    if (fetchCurrentError && fetchCurrentError.code !== 'PGRST116') {
      console.error('שגיאה באחזור תמחור לאונג׳ פעיל נוכחי:', fetchCurrentError);
      throw new Error('הפעולה לאחזור תמחור לאונג׳ פעיל נוכחי נכשלה');
    }

    // שלב 2: אם נמצא מחיר פעיל נוכחי, השבת אותו (active: false)
    if (currentActivePricing) {
      const { error: updateError } = await supabase
        .from('lounge_pricing')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentActivePricing.id); // <--- עדכן רק את הרשומה הספציפית הזו

      if (updateError) {
        console.error('שגיאה בנטרול תמחור לאונג׳ פעיל קודם:', updateError);
        throw new Error('הפעולה לנטרול תמחור לאונג׳ פעיל קודם נכשלה');
      }
    }

    // שלב 3: יצירת תמחור חדש (שיהיה active: true באופן אוטומטי כפי שראינו בפונקציה createLoungePricing)
    return await createLoungePricing(request);
  } catch (e: any) {
    console.error('חריגה בפונקציה createLoungePricingWithHistory:', e);
    throw new Error(e.message || 'שגיאה כללית ביצירת תמחור חדש');
  }
}

export async function getCurrentLoungePricing(): Promise<LoungePricing | null> {
  try {
    const now = new Date();
    const currentTimestamp = now.toISOString(); // <--- שינוי: כולל שעות ודקות להשוואה מדויקת

    const { data, error } = await supabase
      .from('lounge_pricing')
      .select('*')
      .eq('active', true) // <--- שינוי: מסנן רק מחירים פעילים
      .lte('effective_date', currentTimestamp) // <= היום (כולל שעה)
      .order('effective_date', { ascending: false }) // הכי עדכני
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current lounge pricing:', error);
      throw new Error('Failed to fetch current lounge pricing');
    }

    if (!data) return null;

    return new LoungePricingModel({
      id: data.id,
      eveningRate: data.evening_rate,
      memberDiscountRate: data.member_discount_rate,
      active: data.active,
      effectiveDate: data.effective_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('Exception in getCurrentLoungePricing:', e);
    throw e;
  }
}

export async function getLoungePricingHistory(): Promise<LoungePricing[]> {
  try {
    const { data, error } = await supabase
      .from('lounge_pricing')
      .select('*')
      .order('effective_date', { ascending: false });

    if (error) {
      console.error('Error fetching lounge pricing history:', error);
      throw new Error('Failed to fetch lounge pricing history');
    }

    return data.map(item => new LoungePricingModel({
      id: item.id,
      eveningRate: item.evening_rate,
      memberDiscountRate: item.member_discount_rate,
      effectiveDate: item.effective_date,
      active: item.active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (e) {
    console.error('Exception in getLoungePricingHistory:', e);
    throw e;
  }
}

export async function updateLoungePricing(
  id: ID,
  update: Partial<UpdateLoungePricingRequest>,
  updatedBy?: ID
): Promise<LoungePricing> {
  try {
    const { data: existingPricing, error: fetchError } = await supabase
      .from('lounge_pricing')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingPricing) {
      console.error('Error fetching existing lounge pricing:', fetchError);
      throw new Error("תמחור לאונג' לא נמצא");
    }

    const updatedPricingModel = new LoungePricingModel({
      id: existingPricing.id,
      eveningRate: update.eveningRate !== undefined ? update.eveningRate : existingPricing.evening_rate,
      memberDiscountRate: update.memberDiscountRate !== undefined ? update.memberDiscountRate : existingPricing.member_discount_rate,
      effectiveDate: update.effectiveDate !== undefined ? update.effectiveDate : existingPricing.effective_date,
      active: existingPricing.active, // שומר על סטטוס ה-active הקיים
      createdAt: existingPricing.created_at,
      updatedAt: new Date().toISOString(),
    });

    if (
      update.eveningRate !== undefined ||
      update.memberDiscountRate !== undefined
    ) {
      validatePrices([
        update.eveningRate ?? updatedPricingModel.eveningRate,
        update.memberDiscountRate ?? updatedPricingModel.memberDiscountRate,
      ]);

      // ולידציה שוב על המחירים המעודכנים (או הקיימים אם לא עודכנו)
      if (updatedPricingModel.memberDiscountRate > updatedPricingModel.eveningRate) { // תיקון כאן
        throw new Error("הנחת חברים (memberDiscountRate) לא יכולה להיות גבוהה מהמחיר הרגיל (eveningRate).");
      }
    }

    if (update.effectiveDate) {
      const todayStartOfDay = new Date();
      todayStartOfDay.setHours(0, 0, 0, 0);

      const newEffectiveDate = new Date(update.effectiveDate);
      // מונע עדכון effectiveDate לתאריך שכבר עבר
      // אם תאריך ה-effectiveDate הקיים הוא בעבר, וניסו לעדכן אותו לתאריך חדש שגם הוא בעבר, זה אמור להיכשל.
      // אם תאריך ה-effectiveDate הקיים הוא בעבר, וניסו לעדכן אותו לתאריך עתידי, זה בסדר.
      // אם תאריך ה-effectiveDate הקיים הוא בעתיד, וניסו לעדכן אותו לתאריך שעבר, זה אמור להיכשל.
      if (newEffectiveDate < todayStartOfDay) {
          throw new Error("לא ניתן לעדכן תאריך תחילה לתאריך שכבר עבר.");
      }

      await checkEffectiveDateConflict(supabase, 'lounge_pricing', update.effectiveDate, {}, id);
    }

    const { data, error: updateError } = await supabase
      .from('lounge_pricing')
      .update(updatedPricingModel.toDatabaseFormat())
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lounge pricing:', updateError);
      throw new Error('Failed to update lounge pricing');
    }

    return new LoungePricingModel({
      id: data.id,
      eveningRate: data.evening_rate,
      memberDiscountRate: data.member_discount_rate,
      effectiveDate: data.effective_date,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (e) {
    console.error('Exception in updateLoungePricing:', e);
    throw e;
  }
}

export async function deleteLoungePricing(id: ID): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lounge_pricing')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lounge pricing physically:', error);
      throw new Error("Failed to physically delete lounge pricing");
    }

    return true;
  } catch (e) {
    console.error('Exception in deleteLoungePricing:', e);
    throw e;
  }
}

export async function createOrUpdatePricingTier(
  request: PricingTierCreateRequest | (Partial<UpdatePricingTierRequest> & { id: ID }),
  createdBy: ID
): Promise<PricingTier> {
  try {
    // 1. ולידציות בסיסיות ולוודא ששדות קריטיים קיימים ומוגדרים נכון
    if (!request.workspaceType) {
      throw new Error("חובה לבחור סוג סביבת עבודה.");
    }

    if (request.effectiveDate === undefined) {
      throw new Error("תאריך התחולה (effectiveDate) חייב להיות מוגדר.");
    }
    const effectiveDate = new Date(request.effectiveDate);

    // בטיפול בשדות המחיר נכלול גם את השדות החדשים
    const year1Price = request.year1Price!;
    const year2Price = request.year2Price!;
    const year3Price = request.year3Price!;
    const year4Price = request.year4Price!;
    const twoDaysFromOfficePrice = request.twoDaysFromOfficePrice!;
    const threeDaysFromOfficePrice = request.threeDaysFromOfficePrice!;

    validatePrices([
      year1Price,
      year2Price,
      year3Price,
      year4Price,
      twoDaysFromOfficePrice,
      threeDaysFromOfficePrice,
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (effectiveDate < today) {
      throw new Error("תאריך התחולה חייב להיות היום או בעתיד.");
    }

    let existingTier: PricingTier | null = null;
    let isUpdate = false;
    let excludeId: ID | undefined = undefined;

    // 2. קביעה האם זו פעולת יצירה או עדכון
    if ('id' in request && typeof request.id === 'string' && request.id !== '') {
        isUpdate = true;
        excludeId = request.id;

        const { data, error } = await supabase
            .from('pricing_tiers')
            .select('*')
            .eq('id', excludeId)
            .single();

        if (error || !data) {
            console.error('שגיאה באחזור שכבת תמחור קיימת לעדכון:', error);
            throw new Error("שכבת תמחור לעדכון לא נמצאה.");
        }
        existingTier = new PricingTierModel(data);
    }

    // 3. נטרול שכבות פעילות קודמות ביצירה חדשה בלבד
    if (!isUpdate) {
        const { error: deactivateError } = await supabase
            .from('pricing_tiers')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('workspace_type', request.workspaceType)
            .eq('active', true);

        if (deactivateError) {
            console.error('שגיאה בנטרול שכבות תמחור פעילות קודמות לפני יצירה:', deactivateError);
            throw new Error('הפעולה לנטרול שכבות תמחור פעילות קודמות נכשלה.');
        }
    }

    // 4. בדיקת התנגשות תאריכים
    await checkEffectiveDateConflict(
      supabase,
      'pricing_tiers',
      request.effectiveDate,
      { workspace_type: request.workspaceType },
      excludeId
    );

    let resultData: any;
    let resultError: any;

    // 5. ביצוע פעולת Insert או Update
    if (isUpdate && existingTier) {
        const updatedFields = {
            workspace_type: request.workspaceType,
            year1_price: year1Price,
            year2_price: year2Price,
            year3_price: year3Price,
            year4_price: year4Price,
            two_days_from_office_price: twoDaysFromOfficePrice,
            three_days_from_office_price: threeDaysFromOfficePrice,
            effective_date: request.effectiveDate,
            updated_at: new Date().toISOString(),
            // active: request.active, // אם רלוונטי
            // updated_by: createdBy, // אם יש שדה כזה במסד
        };

        const { data, error } = await supabase
            .from('pricing_tiers')
            .update(updatedFields)
            .eq('id', excludeId!)
            .select()
            .single();

        resultData = data;
        resultError = error;
    } else {
        const newPricingTierModel = new PricingTierModel({
            workspaceType: request.workspaceType,
            year1Price,
            year2Price,
            year3Price,
            year4Price,
            twoDaysFromOfficePrice,
            threeDaysFromOfficePrice,
            effectiveDate: request.effectiveDate,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const { data, error } = await supabase
            .from('pricing_tiers')
            .insert(newPricingTierModel.toDatabaseFormat())
            .select()
            .single();

        resultData = data;
        resultError = error;
    }

    if (resultError) {
      console.error('שגיאה בפעולת תמחור (יצירה/עדכון):', resultError);
      throw new Error('הפעולה ליצירת/עדכון שכבת תמחור נכשלה.');
    }

    return new PricingTierModel({
      id: resultData.id,
      workspaceType: resultData.workspace_type,
      year1Price: resultData.year1_price,
      year2Price: resultData.year2_price,
      year3Price: resultData.year3_price,
      year4Price: resultData.year4_price,
      twoDaysFromOfficePrice: resultData.two_days_from_office_price,
      threeDaysFromOfficePrice: resultData.three_days_from_office_price,
      effectiveDate: resultData.effective_date,
      active: resultData.active,
      createdAt: resultData.created_at,
      updatedAt: resultData.updated_at,
    });
  } catch (e) {
    console.error('חריגה בפונקציה createOrUpdatePricingTier:', e);
    throw e;
  }
}