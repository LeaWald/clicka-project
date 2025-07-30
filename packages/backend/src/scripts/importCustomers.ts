import * as XLSX from 'xlsx';
import fs from 'fs';
import { supabase } from '../db/supabaseClient';

function formatDate(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'number') {
    const excelStartDate = new Date(1900, 0, 1);
    const parsed = new Date(excelStartDate.getTime() + (value - 2) * 86400000);
    return parsed.toISOString().split('T')[0];
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
}

function normalizePhone(value: any): string {
  let phoneStr = String(value ?? '').replace(/\D/g, '');
  if (!phoneStr.startsWith('0')) {
    phoneStr = '0' + phoneStr;
  }
  return phoneStr;
}

async function importCustomers() {
  const fileBuffer = fs.readFileSync('src/data/clickaCustomerFields.xlsx');
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  const [headerRow, ...dataRows] = rawData;
  const headers = [
    'שם', 'מספר עמדות', 'סוג עמדה', 'תאריך חתימת חוזה', 'תאריך כניסה',
    'תאריך תחילת תשלום', 'הודעת עזיבה', 'תאריך יציאה', 'סיבת עזיבה', 'הערות חוזה',
    'טלפון', 'מייל', 'ת.ז.', 'שם העסק', 'תחום העסק', 'הערות', "מס' אשראי",
    'תוקף', '3 ספרות', 'ת.ז. בעל הכרטיס', 'טלפון בעל הכרטיס', 'חשבונית עסקה ע\"ש'
  ];

  for (const row of dataRows) {
    const rowObj: Record<string, any> = {};
    if (row[0] === 'שם' && row[1] === 'מספר עמדות') continue;

    headers.forEach((key, i) => {
      rowObj[key] = row[i];
    });

    // ✅ בדיקה אם כל השורה ריקה
    const isEmptyRow = Object.values(rowObj).every(
      (val) => val === undefined || val === null || String(val).trim() === ''
    );
    if (isEmptyRow) continue;

    // ✅ בדיקה אם השדות המרכזיים קיימים
    if (!rowObj['שם'] || !rowObj['מייל'] || !rowObj['טלפון'] || !rowObj['ת.ז.']) {
      continue;
    }

    const email = rowObj['מייל'];
    const idNumber = String(rowObj['ת.ז.']);

    //  בדיקה אחת בלבד מול המסד – מייל או ת.ז
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customer')
      .select('id')
      .or(`email.eq.${email},id_number.eq.${idNumber}`)
      .maybeSingle();

    if (checkError) {
      console.error('❌ שגיאה בבדיקת כפילויות:', checkError.message);
      continue;
    }

    let customerId: string;

    if (!existingCustomer) {
      //  הכנסת לקוח חדש
      const customerData = {
        name: rowObj['שם'],
        phone: normalizePhone(rowObj['טלפון']),
        email,
        id_number: idNumber,
        business_name: rowObj['שם העסק'],
        business_type: rowObj['תחום העסק'],
        workspace_count: Number(rowObj['מספר עמדות']) || 1,
        notes: rowObj['הערות'] || null,
        contract_sign_date: formatDate(rowObj['תאריך חתימת חוזה']),
        contract_start_date: formatDate(rowObj['תאריך כניסה']),
        billing_start_date: formatDate(rowObj['תאריך תחילת תשלום']),
        invoice_name: rowObj["חשבונית עסקה ע\"ש"],
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data: customerInsert, error: customerError } = await supabase
        .from('customer')
        .insert(customerData)
        .select()
        .single();
      if (customerError || !customerInsert) {
        console.error('❌ שגיאה בהכנסת לקוח:', customerError?.message);
        continue;
      }

      customerId = customerInsert.id;

      // ✅ הכנסת תקופת לקוח
      const entryDate = formatDate(rowObj['תאריך כניסה']);
      if (entryDate) {
        const { error: periodError } = await supabase.from('customer_period').insert({
          customer_id: customerId,
          entry_date: entryDate,
          exit_date: formatDate(rowObj['תאריך יציאה']),
          exit_notice_date: rowObj['הודעת עזיבה'] || null,
          exit_reason: rowObj['סיבת עזיבה'] || null,
          exit_reason_details: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (periodError) {
          console.error('❌ שגיאה בהכנסת תקופת לקוח:', periodError.message);
        }
      }

      console.log('✅ לקוח הוזן בהצלחה:', rowObj['שם']);
    } else {
      // ✅ הלקוח כבר קיים
      customerId = existingCustomer.id;
      console.warn(`⚠️ לקוח ${email} כבר קיים – בדיקת פרטי תשלום`);
    }

    // ✅ הכנסת/עדכון נתוני תשלום אם קיימים
    if (rowObj["מס' אשראי"]) {
      const { data: existingPayment } = await supabase
        .from('customer_payment_method')
        .select('id')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!existingPayment) {
        // הכנסת פרטי תשלום חדשים
        const paymentData = {
          customer_id: customerId,
          credit_card_number: String(rowObj["מס' אשראי"]),
          credit_card_expiry: String(rowObj['תוקף'] || ''),
          credit_card_holder_id_number: String(rowObj['ת.ז. בעל הכרטיס'] || ''),
          credit_card_holder_phone: normalizePhone(rowObj['טלפון בעל הכרטיס'] || ''),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: paymentError } = await supabase
          .from('customer_payment_method')
          .insert(paymentData);

        if (paymentError) {
          console.error('❌ שגיאה בהכנסת פרטי תשלום:', paymentError.message);
        } else {
          console.log(`✅ פרטי תשלום הוזנו ללקוח ${customerId}`);
        }
      } else {
        console.log(`ℹ️ ללקוח ${customerId} כבר קיימים פרטי תשלום – לא בוצע עדכון`);
      }
    }
  }
}

importCustomers();
