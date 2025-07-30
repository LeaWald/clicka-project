import { ContractStatus } from "shared-types";
import type {
  Contract,
  ContractTerms,
  DateISO,
  FileReference,
  ID,
} from "shared-types";
import { ContractModel } from "../models/contract.model";
import { baseService } from "./baseService";
import { supabase } from "../db/supabaseClient";
import { uploadFileAndReturnReference } from "./drive-service";
import { DocumentModel } from "../models/document.model";
import { randomUUID } from "crypto";

export class contractService extends baseService<ContractModel> {
  constructor() {
    super("contract");
  }

  // שליפת כל החוזים עם שם לקוח
  getAllContractsWithCustomerName = async (): Promise<(Contract & { customerName: string })[]> => {
    const { data, error } = await supabase
      .from("contract")
      .select(`
        *,
        customer:customer_id (
          name
        )
      `);

    if (error) {
      console.error("שגיאה בשליפת חוזים עם שמות לקוחות:", error);
      throw error;
    }

    return (data ?? []).map((c: any) => ({
      id: c.id,
      customerId: c.customer_id,
      version: c.version,
      status: c.status,
      signDate: c.sign_date,
      startDate: c.start_date,
      endDate: c.end_date,
      terms: {
        workspaceType: c.terms?.workspace_type ?? c.terms?.workspaceType ?? null,
        workspaceCount: c.terms?.workspace_count ?? c.terms?.workspaceCount ?? null,
        monthlyRate: c.terms?.monthly_rate ?? c.terms?.monthlyRate ?? null,
        duration: c.terms?.duration ?? null,
        renewalTerms: c.terms?.renewal_terms ?? c.terms?.renewalTerms ?? null,
        terminationNotice: c.terms?.termination_notice ?? c.terms?.terminationNotice ?? null,
        specialConditions: c.terms?.special_conditions ?? c.terms?.specialConditions ?? [],
      },
      documents: c.documents ?? [],
      signedBy: c.signed_by,
      witnessedBy: c.witnessed_by,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      customerName: c.customer?.name ?? "לא ידוע",
    }));
  };

  // // חוזה אחד לפי מזהה לקוח
  // getContractByCustomerId = async (customerId: ID): Promise<Contract> => {
  //   const { data, error } = await supabase
  //     .from("contract")
  //     .select("*")
  //     .eq("customer_id", customerId)
  //     .single();

  //   if (error) {
  //     console.error("שגיאה בעת שליפת חוזה לפי לקוח:", error.message);
  //     throw new Error("לא ניתן לשלוף חוזה עבור הלקוח.");
  //   }

  //   return {
  //     id: data.id,
  //     customerId: data.customer_id,
  //     version: data.version,
  //     status: data.status,
  //     signDate: data.sign_date,
  //     startDate: data.start_date,
  //     endDate: data.end_date,
  //     terms: {
  //       workspaceType: data.terms?.workspace_type,
  //       workspaceCount: data.terms?.workspace_count,
  //       monthlyRate: data.terms?.monthly_rate,
  //       duration: data.terms?.duration,
  //       renewalTerms: data.terms?.renewal_terms,
  //       terminationNotice: data.terms?.termination_notice,
  //       specialConditions: data.terms?.special_conditions,
  //     },
  //     documents: data.documents,
  //     signedBy: data.signed_by,
  //     witnessedBy: data.witnessed_by,
  //     createdAt: data.created_at,
  //     updatedAt: data.updated_at,
  //   };
  // };

  // שליפת כל החוזים של לקוח
  getAllContractsByCustomerId = async (customerId: ID): Promise<Contract[]> => {
    const { data, error } = await supabase
      .from("contract")
      .select("*")
      .eq("customer_id", customerId);

    if (error) {
      console.error("שגיאה בעת שליפת החוזים:", error.message);
      throw new Error("לא ניתן לשלוף את החוזים עבור לקוח זה.");
    }

    return data as Contract[];
  };

  // חוזים שמסתיימים תוך X ימים
  getContractsEndingSoon = async (days: number = 30): Promise<Contract[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + days);

    const allContracts = await this.getAllContractsWithCustomerName();
    return allContracts.filter(contract => {
      if (!contract.endDate) return false;
      const end = new Date(contract.endDate);
      return end >= today && end <= targetDate;
    });
  };

  // חיפוש חוזים לפי טקסט
  getContractsByText = async (text: string): Promise<ContractModel[]> => {
    const searchFields = ["customerId", "status"];
    const filters = searchFields.map(field => `${field}.ilike.%${text}%`).join(",");

    const { data, error } = await supabase
      .from("contract")
      .select("*")
      .or(filters);

    if (error) {
      console.error("שגיאה בחיפוש חוזים:", error.message);
      return [];
    }

    return data as ContractModel[];
  };

  // עדכון תנאים של חוזה קיים
  updateContractTerms = async (
    contractId: ID,
    customerId: ID,
    terms: ContractTerms
  ): Promise<ContractModel> => {
    const now = new Date().toISOString() as DateISO;

    const contract = new ContractModel(
      contractId,
      customerId,
      1,
      ContractStatus.ACTIVE,
      now,
      [],
      now,
      now,
      undefined,
      undefined,
      terms
    );

    const payload = contract.toDatabaseFormat();
    await this.patch(payload, contractId);
    return contract;
  };

  // הוספת מסמך לחוזה
  postContractDocument = async (
    documentId: ID,
    contractId: ID
  ): Promise<void> => {
    const contract = await this.getById(contractId);
    const updatedDocs = [...(contract.documents ?? []), documentId];
    await this.patch({ documents: updatedDocs }, contractId);
  };

  // מחיקת מסמך מהחוזה
  deleteContractDocument = async (
    contractId: ID,
    documentId: ID
  ): Promise<void> => {
    const contract = await this.getById(contractId);
    const updatedDocs = contract.documents.filter(
      (docId) => docId !== documentId
    );
    await this.patch({ documents: updatedDocs }, contractId);
  };

  // עדכון חוזה עם מזהה מסמך
  updateContractWithDocument = async (
    contractId: ID,
    documentId: ID
  ): Promise<void> => {
    console.log('updateContractWithDocument called with:', { contractId, documentId });
    
    const contract = await this.getById(contractId);
    console.log('Current contract:', contract);
    console.log('Current documents:', contract.documents);
    
    const updatedDocs = [...(contract.documents ?? []), documentId];
    console.log('Updated documents array:', updatedDocs);
    
    const result = await this.patch({ documents: updatedDocs }, contractId);
    console.log('Patch result:', result);
  };

  // יצירה או עדכון חוזה עם מסמך
  createOrUpdateContractWithDocument = async (
    customerId: ID,
    documentId: ID
  ): Promise<void> => {
    console.log('createOrUpdateContractWithDocument called with:', { customerId, documentId });
    
    // בדוק שהמסמך קיים
    const { data: document, error: docError } = await supabase
      .from('document')
      .select('id')
      .eq('id', documentId)
      .single();
      
    if (docError || !document) {
      throw new Error('Document not found');
    }
    
    // חפש חוזה קיים ללקוח
    const existingContracts = await this.getAllContractsByCustomerId(customerId);
    console.log('Existing contracts for customer:', existingContracts);
    
    if (existingContracts && existingContracts.length > 0) {
      // יש חוזה קיים - עדכן אותו
      const contract = existingContracts[0]; // קח את החוזה הראשון
      const updatedDocs = [...(contract.documents ?? []), documentId];
      
      console.log('Updating existing contract with document');
      await this.patch({ documents: updatedDocs }, contract.id!);
    } else {
      // אין חוזה - צור חדש
      console.log('Creating new contract for customer');
      const newContract = new ContractModel(
        randomUUID(),
        customerId,
        1,
        ContractStatus.DRAFT,
        new Date().toISOString(),
        [documentId], // מערך עם מזהה המסמך
        new Date().toISOString(),
        new Date().toISOString()
      );
      
      await this.post(newContract);
    }
  };


}
