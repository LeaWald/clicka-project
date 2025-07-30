
import { UUID } from "node:crypto";
import type { Contract, Customer, CustomerPaymentMethod, CustomerPeriod, CustomerStatus, DateISO, FileReference, ID, PaymentMethod, PaymentMethodType, WorkspaceType } from "shared-types";

export class CustomerModel implements Customer {
  id?: UUID; //PK
  name: string;
  phone: string;
  email?: string;
  idNumber: string; //identity card
  businessName: string;
  businessType: string;
  status: CustomerStatus;
  currentWorkspaceType?: WorkspaceType;
  workspaceCount: number;
  contractSignDate?: string;
  contractStartDate?: string;
  billingStartDate?: string;
  notes?: string;
  invoiceName?: string;
  paymentMethods?: CustomerPaymentMethod[];  // ללקוח יכולים להיות כמה אמצעי תשלום שונים – למשל שני כרטיסים. כל אמצעי תשלום שייך ללקוח אחד.
  paymentMethodType: PaymentMethodType;
  ip: string;
  periods?: CustomerPeriod[];
  // contracts: Contract[];  // One customer can have several contracts. 1:N
  createdAt: DateISO;
  updatedAt: DateISO;

  constructor(
    id: UUID,
    name: string,
    phone: string,
    email: string,
    idNumber: string,
    businessName: string,
    businessType: string,
    status: CustomerStatus,
    workspaceCount: number,
    createdAt: DateISO,
    updatedAt: DateISO,
    paymentMethods: CustomerPaymentMethod[],
    paymentMethodType: PaymentMethodType,
    ip: string,
    currentWorkspaceType?: WorkspaceType,
    contractSignDate?: string,
    contractStartDate?: string,
    billingStartDate?: string,
    notes?: string,
    invoiceName?: string,
    periods?: CustomerPeriod[] | undefined,
    // contracts: Contract[] = []
  ) {
    this.id = id || undefined;
    this.name = name;
    this.phone = phone;
    this.email = email || undefined;
    this.idNumber = idNumber;
    this.businessName = businessName;
    this.businessType = businessType;
    this.status = status;
    this.currentWorkspaceType = currentWorkspaceType;
    this.workspaceCount = workspaceCount;
    this.contractSignDate = contractSignDate;
    this.contractStartDate = contractStartDate;
    this.billingStartDate = billingStartDate;
    this.notes = notes;
    this.invoiceName = invoiceName;
    this.ip = ip;
    this.paymentMethods = paymentMethods;
    this.paymentMethodType = paymentMethodType;
    this.periods = periods;
    // this.contracts = contracts;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toDatabaseFormat() {
    return {
      name: this.name,
      email: this.email,
      phone: this.phone,
      id_number: this.idNumber,
      business_name: this.businessName,
      business_type: this.businessType,
      status: this.status,
      current_workspace_type: this.currentWorkspaceType,
      workspace_count: this.workspaceCount,
      contract_sign_date: this.contractSignDate,
      contract_start_date: this.contractStartDate,
      billing_start_date: this.billingStartDate,
      notes: this.notes,
      invoice_name: this.invoiceName,
      payment_methods_type: this.paymentMethodType,
      ip: this.ip,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }
  static fromDatabaseFormat(dbData: any): CustomerModel {
    return new CustomerModel(
      dbData.id,
      dbData.name,
      dbData.phone,
      dbData.email,
      dbData.id_number,
      dbData.business_name,
      dbData.business_type,
      dbData.status,
      dbData.workspace_count,
      dbData.created_at,
      dbData.updated_at,
      dbData.paymentMethods || [],
      dbData.payment_methods_type,
      dbData.ip,
      dbData.current_workspace_type,
      dbData.contract_sign_date,
      dbData.contract_start_date,
      dbData.billing_start_date,
      dbData.notes,
      dbData.invoice_name,
    );
  }
  static fromDatabaseFormatArray(dbDataArray: any[]): CustomerModel[] {
    return dbDataArray.map(dbData => CustomerModel.fromDatabaseFormat(dbData));
  }

  static partialToDatabaseFormat(data: Partial<CustomerModel>) {
    const dbObj: any = {};
    if (data.name !== undefined) dbObj.name = data.name;
    if (data.email !== undefined) dbObj.email = data.email;
    if (data.phone !== undefined) dbObj.phone = data.phone;
    if (data.idNumber !== undefined) dbObj.id_number = data.idNumber;
    if (data.businessName !== undefined) dbObj.business_name = data.businessName;
    if (data.businessType !== undefined) dbObj.business_type = data.businessType;
    if (data.status !== undefined) dbObj.status = data.status;
    if (data.currentWorkspaceType !== undefined) dbObj.current_workspace_type = data.currentWorkspaceType;
    if (data.workspaceCount !== undefined) dbObj.workspace_count = data.workspaceCount;
    if (data.contractSignDate !== undefined) dbObj.contract_sign_date = data.contractSignDate;
    if (data.contractStartDate !== undefined) dbObj.contract_start_date = data.contractStartDate;
    if (data.billingStartDate !== undefined) dbObj.billing_start_date = data.billingStartDate;
    if (data.notes !== undefined) dbObj.notes = data.notes;
    if (data.invoiceName !== undefined) dbObj.invoice_name = data.invoiceName;
    if (data.paymentMethodType !== undefined) dbObj.payment_methods_type = data.paymentMethodType;
    if (data.createdAt !== undefined) dbObj.created_at = data.createdAt;
    if (data.updatedAt !== undefined) dbObj.updated_at = data.updatedAt;
    if (data.ip !== undefined) dbObj.ip = data.ip;
    // הוסיפי כאן שדות נוספים במידת הצורך
    return dbObj;
  }

}