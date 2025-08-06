import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { updateWorkspaceMap } from '../services/workspaceMap.service';
import {useWorkSpaceStore} from '../../../frontend/src/Stores/Workspace/workspaceStore';


dotenv.config(); // טוען את משתני הסביבה

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY! // נדרש להרשאות עדכון
);

const updateContractsAndCustomers = async () => {
  const today = dayjs().format('YYYY-MM-DD');
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

  /* ========== EXPIRED-שלב 1: עדכון חוזים שפג תוקפם ל- ========== */
  const { data: expiredContracts, error: fetchExpiredError } = await supabase
    .from('contract')
    .select('id')
    .eq('status', 'ACTIVE')
    .eq('end_date', today);

  if (fetchExpiredError) {
    console.error('❌ שגיאה בשליפת חוזים שפג תוקפם:', fetchExpiredError);
  } else if (expiredContracts && expiredContracts.length > 0) {
    const expiredIds = expiredContracts.map((c) => c.id);

    const { error: updateExpiredError } = await supabase
      .from('contract')
      .update({ status: 'EXPIRED' })
      .in('id', expiredIds);

    if (updateExpiredError) {
      console.error('❌ שגיאה בעדכון חוזים ל-EXPIRED:', updateExpiredError);
    } else {
      console.log(`✅ עודכנו ${expiredIds.length} חוזים לסטטוס EXPIRED`);
    }
  } else {
    console.log('ℹ️ אין חוזים שפג תוקפם היום.');
  }

  /* ========== שלב: לקוחות עם תאריך עזיבה מחר ב-customer_period ========== */
const { data: leavingPeriods, error: fetchLeavingError } = await supabase
  .from('customer_period')
  .select('customer_id')
  .eq('exit_date', tomorrow);

if (fetchLeavingError) {
  console.error('❌ שגיאה בשליפת רשומות customer_period:', fetchLeavingError);
} else if (!leavingPeriods || leavingPeriods.length === 0) {
  console.log('ℹ️ אין לקוחות עם תאריך עזיבה מחר.');
} else {
  const customerIds = leavingPeriods.map((p) => p.customer_id);

  
  const { data: customers, error: fetchCustomersError } = await supabase
    .from('customer')
    .select('id_number')
    .in('id', customerIds);

  if (fetchCustomersError) {
    console.error('❌ שגיאה בשליפת id_number מהלקוחות:', fetchCustomersError);
  } else if (!customers || customers.length === 0) {
    console.log('ℹ️ לא נמצאו לקוחות מתאימים לעדכון.');
  } else {
    const idNumbers = customers.map((c) => c.id_number);

    const { error: updateCustomersError } = await supabase
      .from('customer')
      .update({ status: 'EXITED' })
      .in('id_number', idNumbers);

    if (updateCustomersError) {
      console.error('❌ שגיאה בעדכון לקוחות ל-EXITED:', updateCustomersError);
    } else {
      console.log(`✅ עודכנו ${idNumbers.length} לקוחות לסטטוס EXITED`);
    }
  }
}
};

const updateWorkspacesByAssignment = async () => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { setWorkSpaces } = useWorkSpaceStore.getState();

  const { data: assignments, error: assignmentError } = await supabase
    .from('space_assignment')
    .select('workspaceId, customerId')
    .lte('assigned_date', today)
    .or(`unassigned_date.is.null,unassigned_date.gte.${today}`);

  if (assignmentError) {
    console.error('Error fetching assignments:', assignmentError);
    return;
  }

  const { data: workspaces, error: workspaceError } = await supabase
    .from('workspace')
    .select('*');

  if (workspaceError) {
    console.error('Error fetching workspaces:', workspaceError);
    return;
  }

  if (!workspaces || !assignments) return;

  const uniqueCustomerIds = [...new Set(assignments.map(a => a.customerId).filter(Boolean))];

  const { data: customers, error: customerError } = await supabase
    .from('customers')
    .select('id, name')
    .in('id', uniqueCustomerIds);

  if (customerError) {
    console.error('Error fetching customers:', customerError);
    return;
  }

  const customerMap = new Map(customers?.map(c => [c.id, c.name]));

  const updatedWorkspaces = workspaces.map(ws => {
    const assignment = assignments.find(a => a.workspaceId === ws.id);
    const customerName = assignment?.customerId ? customerMap.get(assignment.customerId) : '';

    return {
      ...ws,
      currentCustomerId: assignment?.customerId || '',
      currentCustomerName: customerName || '',
    };
  });

  setWorkSpaces(updatedWorkspaces);
};



// // ✅ ירוץ כל יום בשעה 22:00
cron.schedule("0 22 * * *", () => {
  console.log("🔥 cron רץ לבדיקת חוזים בשעה 22:00...");
  updateContractsAndCustomers();
});

cron.schedule("0 6 * * *", () => {
  console.log("🔥 cron רץ לבדיקת חוזים בשעה 6:00...");
  updateWorkspacesByAssignment();
});
// ✅ ירוץ כל דקה
// cron.schedule("* * * * *", () => {
//   console.log("🔥 cron רץ לבדיקת חוזים ולקוחות (כל דקה)...");
//   updateContractsAndCustomers();
// });

