import { CustomerModel } from "../models/customer.model";
import { baseService } from "./baseService";
import { serviceCustomerPeriod } from "./customerPeriod.service";
import {
  ContractStatus,
  CreateCustomerRequest,
  CustomerStatus,
  GetCustomersRequest,
  ID,
  PaymentMethodType,
  RecordExitNoticeRequest,
  StatusChangeRequest,
  UpdateCustomerRequest,
} from "shared-types";
import { supabase } from "../db/supabaseClient";
import { CustomerPeriodModel } from "../models/customerPeriod.model";
import { ContractModel } from "../models/contract.model";
import { contractService } from "../services/contract.service";
import { customerPaymentMethodModel } from "../models/customerPaymentMethod.model";
import { serviceCustomerPaymentMethod } from "./customerPaymentMethod.service";
import { EmailTemplateService } from "./emailTemplate.service";
import { encodeSubject, sendEmail } from "./gmail-service";
import { UserTokenService } from "./userTokenService";
import { getDocumentById } from "./document.service";
import { deleteFileFromDrive } from "./drive-service";
import * as XLSX from "xlsx"; //חדש

export class customerService extends baseService<CustomerModel> {
  constructor() {
    super("customer");
  }

  // const serviceDocument = new documentSer

  getAllCustomers = async (): Promise<CustomerModel[] | null> => {
    console.log("getAllCustomers called");
    const customers = await this.getAll();
    console.log("Raw customers from getAll():", customers);
    console.log("Number of customers:", customers?.length || 0);

    const customersWithPayments = await Promise.all(
      customers.map(async (customer) => {
        if (customer.paymentMethodType === PaymentMethodType.CREDIT_CARD) {
          const paymentMethods =
            await serviceCustomerPaymentMethod.getByCustomerId(customer.id!);
          customer.paymentMethods = paymentMethods || [];
          console.log("Customers fetched from DB:", customers);
        }
        return customer;
      })
    );

    const result = CustomerModel.fromDatabaseFormatArray(customersWithPayments);
    console.log("Final result:", result);
    console.log("Final result length:", result?.length || 0);
    return result;
  };

  //מחזיר את כל הסטטוסים של הלקוח
  getAllCustomerStatus = async (): Promise<CustomerStatus[] | null> => {
    return Object.values(CustomerStatus) as CustomerStatus[];
  };

  //לא הבנתי מה היא צריכה לעשות
  getCustomersToNotify = async (
    id: ID
  ): Promise<GetCustomersRequest[] | null> => {
    return [];
  };

  createCustomer = async (
    newCustomer: CreateCustomerRequest
  ): Promise<CustomerModel> => {
    console.log("in servise");
    console.log(newCustomer);

    const customerData: CustomerModel = {
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      idNumber: newCustomer.idNumber,
      businessName: newCustomer.businessName,
      businessType: newCustomer.businessType,
      status: CustomerStatus.CREATED,
      currentWorkspaceType: newCustomer.currentWorkspaceType,
      workspaceCount: newCustomer.workspaceCount,
      contractSignDate: newCustomer.contractSignDate,
      contractStartDate: newCustomer.contractStartDate,
      billingStartDate: newCustomer.billingStartDate,
      notes: newCustomer.notes,
      invoiceName: newCustomer.invoiceName,
      paymentMethodType: newCustomer.paymentMethodType,
      ip: newCustomer.ip,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
          updated_at: this.updatedAt,
        };
      },
    };

    //לפני היצירה יש לבדוק שהחלל באמת פנוי צריך לפנות לקבוצה 3
    console.log("in servise");

    console.log(customerData);
    let customer = await this.post(customerData);
    customer = CustomerModel.fromDatabaseFormat(customer);

    const newContract: ContractModel = {
      customerId: customer.id!,
      version: 1,
      status: ContractStatus.DRAFT,
      signDate: newCustomer.contractSignDate,
      startDate: newCustomer.contractStartDate,
      //   endDate?: string;
      terms: {
        //ערכים התחלתיים לבנתיים
        workspaceType: newCustomer.currentWorkspaceType,
        workspaceCount: newCustomer.workspaceCount,
        duration: 1,
        monthlyRate: 0,
        renewalTerms: "",
        terminationNotice: 0,
      },
      documents: [], // מערך ריק של מזהי מסמכים
      //   signedBy?: string;
      //   witnessedBy?: string;
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toDatabaseFormat() {
        return {
          customer_id: this.customerId,
          version: this.version,
          status: this.status,
          sign_date: this.signDate,
          start_date: this.startDate,
          end_date: this.endDate,
          terms: this.terms,
          documents: this.documents,
          signed_by: this.signedBy,
          witnessed_by: this.witnessedBy,
          created_at: this.createdAt,
          updated_at: this.updatedAt,
        };
      },
    };
    const serviceContract = new contractService();
    console.log("לפני היצירת חוזה");

    const contract = await serviceContract.post(newContract);

    console.log("📄 New contract created in customer service:", contract);
    // console.log("Contract ID:", contract.id);
    // console.log("Customer ID:", contract.customerId);
    // console.log("Contract terms:", contract.terms);

    //create customer payment method
    if (newCustomer.paymentMethodType == PaymentMethodType.CREDIT_CARD) {
      const newPaymentMethod: customerPaymentMethodModel = {
        customerId: customer.id!,
        isActive: true,
        creditCardExpiry: newCustomer.paymentMethod?.creditCardExpiry,
        creditCardHolderIdNumber:
          newCustomer.paymentMethod?.creditCardHolderIdNumber,
        creditCardHolderPhone: newCustomer.paymentMethod?.creditCardHolderPhone,
        creditCardNumber: newCustomer.paymentMethod?.creditCardNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        toDatabaseFormat() {
          return {
            customer_id: this.customerId,
            credit_card_number: this.creditCardNumber,
            credit_card_expiry: this.creditCardExpiry,
            credit_card_holder_id_number: this.creditCardHolderIdNumber,
            credit_card_holder_phone: this.creditCardHolderPhone,
            is_active: this.isActive,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
          };
        },
      };

      const paymentMethod =
        await serviceCustomerPaymentMethod.post(newPaymentMethod);

      console.log("paymentMethod in service");
      console.log(paymentMethod);
    }

    console.log("📧 Customer created successfully:", customer);

    return customer;
  };

  updateCustomer = async (dataToUpdate: any, id: ID) => {
    console.log("updateCustomer called with data:", dataToUpdate);

    try {
      await this.patch(CustomerModel.partialToDatabaseFormat(dataToUpdate), id); // תפס את השגיאה
      if (dataToUpdate.paymentMethodType === PaymentMethodType.CREDIT_CARD) {
        // אם סוג התשלום הוא כרטיס אשראי, נעדכן את שיטת התשלום
        //אם כבר היה שיטת תשלום אז נעדכן, אחרת ניצור
        const paymentMethods =
          await serviceCustomerPaymentMethod.getByCustomerId(id);
        console.log("paymentMethods in updateCustomer", paymentMethods);
        if (paymentMethods && paymentMethods.length > 0) {
          // אם יש כבר שיטת תשלום, נעדכן אותה
          const paymentMethodData = {
            ...paymentMethods[0], // נשתמש בנתונים הקיימים
            isActive: true,
            creditCardNumber: dataToUpdate.creditCardNumber,
            creditCardExpiry: dataToUpdate.creditCardExpiry,
            creditCardHolderIdNumber: dataToUpdate.creditCardHolderIdNumber,
            creditCardHolderPhone: dataToUpdate.creditCardHolderPhone,
            updatedAt: new Date().toISOString(),
          };
          console.log("paymentMethodData in updateCustomer", paymentMethodData);

          await serviceCustomerPaymentMethod.patch(
            customerPaymentMethodModel.partialToDatabaseFormat(
              paymentMethodData
            ),
            paymentMethods[0].id!
          );
        } else {
          // אם אין שיטת תשלום, ניצור חדשה
          const newPaymentMethod: customerPaymentMethodModel = {
            customerId: id,
            isActive: true,
            creditCardExpiry: dataToUpdate.creditCardExpiry,
            creditCardHolderIdNumber: dataToUpdate.creditCardHolderIdNumber,
            creditCardHolderPhone: dataToUpdate.creditCardHolderPhone,
            creditCardNumber: dataToUpdate.creditCardNumber,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            toDatabaseFormat() {
              return {
                customer_id: this.customerId,
                credit_card_number: this.creditCardNumber,
                credit_card_expiry: this.creditCardExpiry,
                credit_card_holder_id_number: this.creditCardHolderIdNumber,
                credit_card_holder_phone: this.creditCardHolderPhone,
                is_active: this.isActive,
                created_at: this.createdAt,
                updated_at: this.updatedAt,
              };
            },
          };

          await serviceCustomerPaymentMethod.post(newPaymentMethod);
        }
      }
    } catch (error) {
      console.error("שגיאה בעדכון הלקוח:", error);
      throw error; // זרוק את השגיאה הלאה
    }
  };

  // יצרית הודעת עזיבה של לקוח
  postExitNotice = async (
    exitNotice: RecordExitNoticeRequest,
    id: ID
  ): Promise<void> => {
    const updateStatus: UpdateCustomerRequest = {
      status: CustomerStatus.PENDING,
    };

    await this.updateCustomer(updateStatus as CustomerModel, id);

    const customerLeave: CustomerModel | null = await this.getById(id);

    if (customerLeave) {
      // יצירת תקופת עזיבה ללקוח
      const period: CustomerPeriodModel = {
        customerId: id,
        entryDate: customerLeave.createdAt || new Date().toISOString(),
        exitDate: exitNotice.plannedExitDate,
        exitNoticeDate: exitNotice.exitNoticeDate,
        exitReason: exitNotice.exitReason,
        exitReasonDetails: exitNotice.exitReasonDetails,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        toDatabaseFormat() {
          return {
            customer_id: this.customerId,
            entry_date: this.entryDate,
            exit_date: this.exitDate,
            exit_notice_date: this.exitNoticeDate,
            exit_reason: this.exitReason,
            exit_reason_details: this.exitReasonDetails,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
          };
        },
      };
      try {
        await serviceCustomerPeriod.post(period);
      } catch (error) {
        console.error("in Period ", error);
      }
    }

    if (customerLeave && customerLeave.id) {
      await this.patch(customerLeave, customerLeave.id);
    } else {
      throw new Error("Customer ID is undefined");
    }

    //ליצור התראה שהלקוח עוזב - קשור לקבוצה 1

    // לעדכן את מערכת החיוב לגבי סיום השירות או חישוב חיוב סופי
    // קשור לקבוצת billing
  };

  getCustomersByText = async (text: string): Promise<CustomerModel[]> => {
    const searchFields = [
      "name",
      "phone",
      "business_name",
      "business_type",
      "email",
    ];

    const filters = searchFields
      .map((field) => `${field}.ilike.%${text}%`)
      .join(",");

    console.log("Filters:", filters);

    const { data, error } = await supabase
      .from("customer")
      .select("*")
      .or(filters);

    if (error) {
      console.error("שגיאה:", error);
      return [];
    }

    const customers = data || [];
    return CustomerModel.fromDatabaseFormatArray(customers);
  };

  //מחזיר את כל הלקוחות רק של העמוד הראשון
  getCustomersByPage = async (filters: {
    page?: string;
    limit?: number;
  }): Promise<CustomerModel[]> => {
    console.log("Service getCustomersByPage called with:", filters);

    const { page, limit } = filters;

    const pageNum = Number(filters.page);
    const limitNum = Number(filters.limit);

    if (!Number.isInteger(pageNum) || !Number.isInteger(limitNum)) {
      throw new Error("Invalid filters provided for pagination");
    }

    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data, error } = await supabase
      .from("customer")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    // console.log("Supabase data:", data);
    console.log("Supabase error:", error);

    if (error) {
      console.error("❌ Supabase error:", error.message || error);
      return Promise.reject(
        new Error(`Supabase error: ${error.message || JSON.stringify(error)}`)
      );
    }

    const customers = data || [];

    const customersWithPayments = await Promise.all(
      customers.map(async (customer) => {
        if (customer.payment_methods_type === PaymentMethodType.CREDIT_CARD) {
          const paymentMethods =
            await serviceCustomerPaymentMethod.getByCustomerId(customer.id!);
          customer.paymentMethods = paymentMethods || [];
        }
        return customer;
      })
    );    

    return CustomerModel.fromDatabaseFormatArray(customersWithPayments);
  };

  emailService = new EmailTemplateService();

  confirmEmail = async (email: string, id: ID) => {
    const customerToUpdate: CustomerModel | null = await this.getById(id);
    if (!customerToUpdate) {
      return;
    }
    customerToUpdate.email = email;

    await this.patch(customerToUpdate, id);

    const changeStautsData: StatusChangeRequest = {
      newStatus: CustomerStatus.ACTIVE,
      effectiveDate: new Date().toISOString(), // תאריך עדכון הסטטוס הוא התאריך הנוכחי
      reason: "אימות מייל",
      notifyCustomer: true,
    };

    try {
      await fetch(`${process.env.API_URL}/customers/${id}/status-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changeStautsData),
      });
    } catch (error) {
      console.error("Error updating customer status:", error);
    }

    // Send contract email
    const serviceContract = new contractService();
    // Get only the most recent contract
    const contracts = customerToUpdate.id
      ? await serviceContract.getAllContractsByCustomerId(customerToUpdate.id)
      : null;
    if (contracts && contracts.length > 0) {
      const latestContract = contracts[contracts.length - 1]; // Get most recent contract
      const urls: string[] = [];

      // Check if latest contract has documents
      if (latestContract.documents && Array.isArray(latestContract.documents)) {
        for (const doc of latestContract.documents) {
          const document = await getDocumentById(doc);
          if (document?.url) {
            urls.push(document.url);
          }
        }
      }

      if (urls.length > 0) {
        await this.sendEmailWithContract(customerToUpdate, urls.join("\n"));
      }
    }

    // Send welcome message
    await this.sendWellcomeMessageForEveryMember(customerToUpdate.name);
  };

  sendStatusChangeEmails = async (
    detailsForChangeStatus: StatusChangeRequest,
    id: ID,
    token: any
  ): Promise<void> => {
    const customer = await this.getById(id);

    console.log("Customer in sendStatusChangeEmails:", customer);
    console.log("Details for change status:", detailsForChangeStatus);
    await this.updateCustomer({ status: detailsForChangeStatus.newStatus }, id);

    // סטטוסים שדורשים התראה לצוות
    const notifyTeamStatuses = ["NOTICE_GIVEN", "EXITED", "ACTIVE", "CREATED"];
    const shouldNotifyTeam = notifyTeamStatuses.includes(
      detailsForChangeStatus.newStatus
    );

    //אם ללקוח יש מייל וזה true אז יש לשלוח התראה ללקוח
    const shouldNotifyCustomer =
      detailsForChangeStatus.notifyCustomer && !!customer.email;

    const emailPromises: Promise<any>[] = [];

    // function encodeSubject(subject: string): string {
    //   return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
    // }

    // תרגום הסטטוס לעברית

    const statusTranslations: Record<CustomerStatus, string> = {
      ACTIVE: "פעיל",
      NOTICE_GIVEN: "הודעת עזיבה",
      EXITED: "עזב",
      PENDING: "בהמתנה",
      CREATED: "נוצר",
    };

    const effectiveDate = new Date(detailsForChangeStatus.effectiveDate);
    const formattedDate = effectiveDate.toLocaleString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    detailsForChangeStatus.effectiveDate = formattedDate;

    const status =
      statusTranslations[detailsForChangeStatus.newStatus as CustomerStatus] ||
      detailsForChangeStatus.newStatus;

    // פונקציה לשליחת מייל לצוות
    const sendTeamEmail = async () => {
      try {
        const template =
          await this.emailService.getTemplateByName("שינוי סטטוס - צוות");

        if (!template) {
          console.warn("Team email template not found");
          return;
        }
        const renderedHtml = await this.emailService.renderTemplate(
          template.bodyHtml,
          {
            שם: customer.name,
            סטטוס: status,
            תאריך: formattedDate,
            סיבה: detailsForChangeStatus.reason || "ללא סיבה מצוינת",
          }
        );

        console.log("Rendered HTML for team email:\n", renderedHtml);

        const response = await sendEmail(
          "me",
          {
            to: [process.env.SYSTEM_EMAIL || ""],
            subject: encodeSubject(template.subject),
            body: renderedHtml,
            isHtml: true,
          },
          token
        );
        console.log(template.subject);

        console.log("HTML before sending:\n", renderedHtml);
        console.log(
          customer.name,
          detailsForChangeStatus.newStatus,
          detailsForChangeStatus.effectiveDate,
          detailsForChangeStatus.reason
        );

        console.log("Team email sent successfully:", response);
      } catch (err) {
        console.error("שגיאה בשליחת מייל לצוות:", err);
      }
    };

    // פונקציה לשליחת מייל ללקוח
    const sendCustomerEmail = async () => {
      const template =
        await this.emailService.getTemplateByName("שינוי סטטוס - לקוח");
      if (!template) {
        console.warn("Customer email template not found");
        return;
      }
      const renderedHtml = await this.emailService.renderTemplate(
        template.bodyHtml,
        {
          שם: customer.name,
          סטטוס: status,
          תאריך: formattedDate,
        }
      );
      console.log("HTML before sending:\n", renderedHtml);
      console.log(
        customer.name,
        detailsForChangeStatus.newStatus,
        detailsForChangeStatus.effectiveDate
      );

      return sendEmail(
        "me",
        {
          to: [customer.email ?? ""],
          subject: encodeSubject(template.subject),
          body: renderedHtml,
          isHtml: true,
        },
        token
      );
    };

    //מוסיף למערך הפרומיסים רק אם זה הצליח
    if (shouldNotifyTeam) {
      console.log(
        "Sending email to team for status change:",
        customer.name,
        status
      );
      emailPromises.push(
        sendTeamEmail().catch((err) => {
          console.error("שגיאה בשליחת מייל לצוות", err);
        })
      );
    }
    if (shouldNotifyCustomer) {
      emailPromises.push(
        sendCustomerEmail().catch((err) => {
          console.error("שגיאה בשליחת מייל ללקוח", err);
        })
      );
    }

    //אם פרומיס אחד נכשל זה לא מפעיל את השליחה
    await Promise.all(emailPromises);
  };

  CustomerAuthentication = async (id: ID, token: any): Promise<void> => {
    const customer = await this.getById(id);

    // פונקציה לשליחת מייל לצוות
    const sendEmailToAuth = async () => {
      try {
        const template =
          await this.emailService.getTemplateByName("אימות לקוח");

        if (!template) {
          console.warn("Team email template not found");
          return;
        }
        const renderedHtml = await this.emailService.renderTemplate(
          template.bodyHtml,
          {}
        );

        await sendEmail(
          "me",
          {
            to: [customer.email ?? ""],
            subject: encodeSubject(template.subject),
            body: renderedHtml,
            isHtml: true,
          },
          token
        );
        console.log(template.subject);

        console.log("HTML before sending:\n", renderedHtml);
      } catch (err) {
        console.error("שגיאה בשליחת מייל לצוות:", err);
      }
    };
    sendEmailToAuth();
  };

  serviceUserToken = new UserTokenService();

  sendEmailWithContract = async (customer: CustomerModel, link: string) => {
    const token = await this.serviceUserToken.getSystemAccessToken();
    if (!token) {
      console.error("Token not available");
      return;
    }

    const template =
      await this.emailService.getTemplateByName("שליחת חוזה ללקוח");
    if (!template) {
      console.error("Contract email template not found");
      return;
    }

    const renderedHtml = await this.emailService.renderTemplate(
      template.bodyHtml,
      {
        name: customer.name,
        link: link,
      }
    );

    await sendEmail(
      "me",
      {
        to: [customer.email ?? ""],
        subject: encodeSubject(template.subject),
        body: renderedHtml,
        isHtml: true,
      },
      token
    );
  };

  // מחיקת לקוח עם כל הנתונים הקשורים אליו כולל קבצים בדרייב
  deleteCustomerCompletely = async (customerId: ID): Promise<void> => {
    try {
      const token = await this.serviceUserToken.getSystemAccessToken();
      if (!token) {
        console.warn("No token available for Drive operations");
      }

      // 1. קבלת כל המסמכים הקשורים ללקוח
      const serviceContract = new contractService();
      const contracts =
        await serviceContract.getAllContractsByCustomerId(customerId);
      const documentIds: string[] = [];

      for (const contract of contracts) {
        if (contract.documents && Array.isArray(contract.documents)) {
          documentIds.push(...contract.documents);
        }
      }

      // 2. מחיקת קבצים מדרייב
      if (token && documentIds.length > 0) {
        const { data: documents } = await supabase
          .from("document")
          .select("google_drive_id")
          .in("id", documentIds)
          .not("google_drive_id", "is", null);

        if (documents) {
          for (const doc of documents) {
            try {
              await deleteFileFromDrive(doc.google_drive_id, token);
            } catch (error) {
              console.warn(
                "Failed to delete file from Drive:",
                doc.google_drive_id,
                error
              );
            }
          }
        }
      }

      // 3. מחיקת מסמכים
      if (documentIds.length > 0) {
        await supabase.from("document").delete().in("id", documentIds);
      }

      // 4. מחיקת חוזים
      for (const contract of contracts) {
        await serviceContract.delete(contract.id!);
      }

      // 5. מחיקת תקופות לקוח
      await supabase
        .from("customer_period")
        .delete()
        .eq("customer_id", customerId);

      // 6. מחיקת שיטות תשלום
      await serviceCustomerPaymentMethod.deleteByCustomerId(customerId);

      // 7. מחיקת הלקוח עצמו
      await this.delete(customerId);
    } catch (error) {
      console.error("Error in complete customer deletion:", error);
      throw error;
    }
  };

  sendWellcomeMessageForEveryMember = async (name: string) => {
    console.log("🎉 Starting welcome message for:", name);

    const token = await this.serviceUserToken.getSystemAccessToken();
    if (!token) {
      console.error("Token not available");
      return;
    }

    const template = await this.emailService.getTemplateByName("ברוכה הבאה");
    if (!template) {
      console.error("Welcome email template not found");
      return;
    }

    const renderedHtml = await this.emailService.renderTemplate(
      template.bodyHtml,
      { name: name }
    );

    const customers = await this.getAll();
    console.log("👥 Total customers found:", customers.length);

    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = [
      ...new Set(
        customers
          .map((c) => c.email)
          .filter(
            (email): email is string =>
              typeof email === "string" &&
              email.trim() !== "" &&
              validEmailRegex.test(email.trim())
          )
      ),
    ];

    if (emails.length === 0) {
      console.warn("No valid email addresses found for customers");
      return;
    }

    try {
      const result = await sendEmail(
        "me",
        {
          to: emails,
          subject: encodeSubject(template.subject),
          body: renderedHtml,
          isHtml: true,
        },
        token
      );
      console.log("Welcome emails sent successfully");
    } catch (error) {
      console.error("Failed to send welcome emails:", error);
      throw error;
    }
  };

  importCustomersFromExcelBuffer = async (buffer: Buffer): Promise<void> => {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    const [headerRow, ...dataRows] = rawData;
    const headers = [
      "שם",
      "מספר עמדות",
      "סוג עמדה",
      "תאריך חתימת חוזה",
      "תאריך כניסה",
      "תאריך תחילת תשלום",
      "הודעת עזיבה",
      "תאריך יציאה",
      "סיבת עזיבה",
      "הערות חוזה",
      "טלפון",
      "מייל",
      "ת.ז.",
      "שם העסק",
      "תחום העסק",
      "הערות",
      "מס' אשראי",
      "תוקף",
      "3 ספרות",
      "ת.ז. בעל הכרטיס",
      "טלפון בעל הכרטיס",
      'חשבונית עסקה ע\"ש',
    ];
    function formatDate(value: any): string | null {
      if (!value) return null;
      if (typeof value === "number") {
        const excelStartDate = new Date(1900, 0, 1);
        const parsed = new Date(
          excelStartDate.getTime() + (value - 2) * 86400000
        );
        return parsed.toISOString().split("T")[0];
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime())
        ? null
        : parsed.toISOString().split("T")[0];
    }
    function normalizePhone(value: any): string {
      let phoneStr = String(value ?? "").replace(/\D/g, "");
      if (!phoneStr.startsWith("0")) {
        phoneStr = "0" + phoneStr;
      }
      return phoneStr;
    }
    for (const row of dataRows) {
      const rowObj: Record<string, any> = {};
      if (row[0] === "שם" && row[1] === "מספר עמדות") continue;
      headers.forEach((key, i) => {
        rowObj[key] = row[i];
      });
      // :white_check_mark: בדיקה אם כל השורה ריקה
      const isEmptyRow = Object.values(rowObj).every(
        (val) => val === undefined || val === null || String(val).trim() === ""
      );
      if (isEmptyRow) continue;
      // :white_check_mark: בדיקה אם השדות המרכזיים קיימים
      if (
        !rowObj["שם"] ||
        !rowObj["מייל"] ||
        !rowObj["טלפון"] ||
        !rowObj["ת.ז."]
      ) {
        continue;
      }
      const email = rowObj["מייל"];
      const idNumber = String(rowObj["ת.ז."]);
      //  בדיקה אחת בלבד מול המסד – מייל או ת.ז
      const { data: existingCustomer, error: checkError } = await supabase
        .from("customer")
        .select("id")
        .or(`email.eq.${email},id_number.eq.${idNumber}`)
        .maybeSingle();
      if (checkError) {
        console.error(":x: שגיאה בבדיקת כפילויות:", checkError.message);
        continue;
      }
      let customerId: string;
      if (!existingCustomer) {
        //  הכנסת לקוח חדש
        const customerData = {
          name: rowObj["שם"],
          phone: normalizePhone(rowObj["טלפון"]),
          email,
          id_number: idNumber,
          business_name: rowObj["שם העסק"],
          business_type: rowObj["תחום העסק"],
          workspace_count: Number(rowObj["מספר עמדות"]) || 1,
          notes: rowObj["הערות"] || null,
          contract_sign_date: formatDate(rowObj["תאריך חתימת חוזה"]),
          contract_start_date: formatDate(rowObj["תאריך כניסה"]),
          billing_start_date: formatDate(rowObj["תאריך תחילת תשלום"]),
          invoice_name: rowObj['חשבונית עסקה ע"ש'],
          status: "ACTIVE",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data: customerInsert, error: customerError } = await supabase
          .from("customer")
          .insert(customerData)
          .select()
          .single();
        if (customerError || !customerInsert) {
          console.error(":x: שגיאה בהכנסת לקוח:", customerError?.message);
          continue;
        }
        customerId = customerInsert.id;
        // :white_check_mark: הכנסת תקופת לקוח
        const entryDate = formatDate(rowObj["תאריך כניסה"]);
        if (entryDate) {
          const { error: periodError } = await supabase
            .from("customer_period")
            .insert({
              customer_id: customerId,
              entry_date: entryDate,
              exit_date: formatDate(rowObj["תאריך יציאה"]),
              exit_notice_date: rowObj["הודעת עזיבה"] || null,
              exit_reason: rowObj["סיבת עזיבה"] || null,
              exit_reason_details: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          if (periodError) {
            console.error(":x: שגיאה בהכנסת תקופת לקוח:", periodError.message);
          }
        }
        console.log(":white_check_mark: לקוח הוזן בהצלחה:", rowObj["שם"]);
      } else {
        // :white_check_mark: הלקוח כבר קיים
        customerId = existingCustomer.id;
        console.warn(`:warning: לקוח ${email} כבר קיים – בדיקת פרטי תשלום`);
      }
      // :white_check_mark: הכנסת/עדכון נתוני תשלום אם קיימים
      if (rowObj["מס' אשראי"]) {
        const { data: existingPayment } = await supabase
          .from("customer_payment_method")
          .select("id")
          .eq("customer_id", customerId)
          .maybeSingle();
        if (!existingPayment) {
          // הכנסת פרטי תשלום חדשים
          const paymentData = {
            customer_id: customerId,
            credit_card_number: String(rowObj["מס' אשראי"]),
            credit_card_expiry: String(rowObj["תוקף"] || ""),
            credit_card_holder_id_number: String(
              rowObj["ת.ז. בעל הכרטיס"] || ""
            ),
            credit_card_holder_phone: normalizePhone(
              rowObj["טלפון בעל הכרטיס"] || ""
            ),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error: paymentError } = await supabase
            .from("customer_payment_method")
            .insert(paymentData);
          if (paymentError) {
            console.error(":x: שגיאה בהכנסת פרטי תשלום:", paymentError.message);
          } else {
            console.log(
              `:white_check_mark: פרטי תשלום הוזנו ללקוח ${customerId}`
            );
          }
        } else {
          console.log(
            `:information_source: ללקוח ${customerId} כבר קיימים פרטי תשלום – לא בוצע עדכון`
          );
        }
      }
    }
  };
}

const serviceCustomer = new customerService();

// מחלץ לקובץ csv את כל הלקוחות שעומדים בסינון שמקבלת הפונקציה
// export const exportCustomersToFileByFilter = async (
//   filter: Partial<CustomerModel>
// ): Promise<Buffer | null> => {
// const customerToExport = await serviceCustomer.getByFilters(filter);

// if (!customerToExport || customerToExport.length === 0) {
//   return null;
// }

//   // פונקציה מהספריה csv-writer
//   const csvStringifier = createObjectCsvStringifier({
//     header: [
//       { id: "id", title: "ID" },
//       { id: "name", title: "Name" },
//       { id: "idNumber", title: "ID Number" },
//       { id: "businessName", title: "Business Name" },
//       { id: "businessType", title: "Business Type" },
//       { id: "currentWorkspaceType", title: "Current Workspace Type" },
//       { id: "workspaceCount", title: "Workspace Count" },
//       { id: "contractSignDate", title: "Contract Sign Date" },
//       { id: "billingStartDate", title: "Billing Start Date" },
//       { id: "invoiceName", title: "InvoiceName" },
//       { id: "contractDocuments", title: "Contract Documents" },
//       { id: "paymentMethodsType", title: "Payment Methods Type" },
//       { id: "notes", title: "Notes" },
//       { id: "updatedAt", title: "Updated At" },
//       { id: "contracts", title: "Contracts" },
//       { id: "phone", title: "Phone" },
//       { id: "status", title: "Status" },
//       { id: "createdAt", title: "Created At" },
//     ],
//   });

//   const csvHeader = csvStringifier.getHeaderString();
//   // const csvBody = csvStringifier.stringifyRecords(customerToExport);
// const csvFull = csvHeader + csvBody;

// return Buffer.from(csvFull, "utf-8");
// };

// לשאול את שולמית

// export const getStatusChanges = async (id:ID): Promise<CustomerStatus[] | null> => {
//     const customer: GetCustomersRequest | null = await getCustomerById(id);

//     if (customer && customer.status) {
//         const statuses: CustomerStatus[] = customer.status;
//         return statuses;
//     } else {
//         console.warn(`No status changes found for customer with ID: ${id}`);
//         return null;
//     }
// }

// export const getCustomerHistory = async (customerId: ID): Promise<CustomerHistory[]> => {
//     // אמור לשלוף את ההיסטוריה של הלקוח עם ה-customerId הנתון
//     return []; // להחזיר מערך של היסטוריית לקוח
// }