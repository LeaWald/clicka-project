import type {
  DateISO,
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
  ExpenseStatus,
  FileReference,
  ID
} from "shared-types";
export class ExpenseModel implements Expense {
  id: ID;
  vendor_id: ID;
  vendor_name: string;
  category_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  tax?: number;
  date: DateISO;
  due_date?: DateISO;
  paid_date?: DateISO;
  status: ExpenseStatus;
  payment_method?: ExpensePaymentMethod;
  reference?: string;
  invoice_number?: string;
  invoice_file?: FileReference;
  receipt_file?: FileReference;
  notes?: string;
  approved_by?: ID;
  approvedAt?: DateISO;
  createdAt: DateISO;
  updatedAt: DateISO;
  is_income: boolean;
  source_type: "vendor" | "store";
  purchaser_name: string;
  constructor(
    id: ID,
    vendor_id: ID,
    vendor_name: string,
    category_id: string,
    category: ExpenseCategory | undefined,
    description: string,
    amount: number,
    tax: number | undefined,
    date: DateISO,
    due_date: DateISO | undefined,
    paid_date: DateISO | undefined,
    status: ExpenseStatus,
    payment_method: ExpensePaymentMethod | undefined,
    reference: string | undefined,
    invoice_number: string | undefined,
    invoice_file: FileReference | undefined,
    receipt_file: FileReference | undefined,
    notes: string | undefined,
    approved_by: ID | undefined,
    approvedAt: DateISO | undefined,
    createdAt: DateISO,
    updatedAt: DateISO,
    is_income: boolean,
    source_type: "vendor" | "store",
    purchaser_name: string
  ) {
    this.id = id;
    this.vendor_id = vendor_id;
    this.vendor_name = vendor_name;
    this.category_id = category_id;
this.category = category!;
    this.description = description;
    this.amount = amount;
    this.tax = tax;
    this.date = date;
    this.due_date = due_date;
    this.paid_date = paid_date;
    this.status = status;
    this.payment_method = payment_method;
    this.reference = reference;
    this.invoice_number = invoice_number;
    this.invoice_file = invoice_file;
    this.receipt_file = receipt_file;
    this.notes = notes;
    this.approved_by = approved_by;
    this.approvedAt = approvedAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.is_income = is_income;
    this.source_type = source_type;
    this.purchaser_name = purchaser_name;
  }
  toDatabaseFormat() {
    return {
      id: this.id,
      vendor_id: this.vendor_id,
      vendor_name: this.vendor_name,
      category_id: this.category_id,
      description: this.description,
      amount: this.amount,
      tax: this.tax,
      date: this.date,
      due_date: this.due_date,
      paid_date: this.paid_date,
      status: this.status,
      payment_method: this.payment_method,
      reference: this.reference,
      invoice_number: this.invoice_number,
      invoice_file: this.invoice_file,
      receipt_file: this.receipt_file,
      notes: this.notes,
      approved_by: this.approved_by,
      approved_at: this.approvedAt,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      is_income: this.is_income,
      source_type: this.source_type,
      purchaser_name: this.purchaser_name,
    };
  }
  static fromDatabaseFormat(dbData: any): ExpenseModel {
    return new ExpenseModel(
      dbData.id,
      dbData.vendor_id,
      dbData.vendor_name,
      dbData.category_id,
      dbData.category,
      dbData.description,
      dbData.amount,
      dbData.tax,
      dbData.date,
      dbData.due_date,
      dbData.paid_date,
      dbData.status,
      dbData.payment_method,
      dbData.reference,
      dbData.invoice_number,
      dbData.invoice_file,
      dbData.receipt_file,
      dbData.notes,
      dbData.approved_by,
      dbData.approved_at,
      dbData.created_at,
      dbData.updated_at,
      dbData.is_income,
      dbData.source_type,
      dbData.purchaser_name
    );
  }
  static fromDatabaseFormatArray(dbDataArray: any[]): ExpenseModel[] {
    return dbDataArray.map(ExpenseModel.fromDatabaseFormat);
  }
}