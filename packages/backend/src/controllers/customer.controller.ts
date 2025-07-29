import { Request, Response } from "express";
import { customerService } from "../services/customer.service";
import {
  CreateCustomerRequest,
  StatusChangeRequest,

} from "shared-types";
import { serviceCustomerPaymentMethod } from "../services/customerPaymentMethod.service";
import { UserTokenService } from "../services/userTokenService";
import { EmailTemplateService } from "../services/emailTemplate.service";

const serviceCustomer = new customerService();
const userTokenService = new UserTokenService();
const emailService = new EmailTemplateService();


export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    // const customers = await serviceCustomer.getAll()
    const customers = await serviceCustomer.getAllCustomers();

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customers", error });
  }
};

export const postCustomer = async (req: Request, res: Response) => {
  try {
    const newCustomer: CreateCustomerRequest = req.body;

    // console.log("in controller");
    // console.log(newCustomer);
    const email = newCustomer.email;

    const customer = await serviceCustomer.createCustomer(newCustomer);

    const token = await userTokenService.getSystemAccessToken();

    const template = await emailService.getTemplateByName(
          "אימות לקוח",
    );
    if (!template) {
          console.warn("Team email template not found");
          return;
        }
        // const renderedHtml = await emailService.renderTemplate(
        //   template.bodyHtml,
        //   {
        //     "שם": customer.name,
        //     "סטטוס": status,
        //     "תאריך": formattedDate,
        //     "סיבה": detailsForChangeStatus.reason || "ללא סיבה מצוינת",
        //   },
        // );
    

    if (!email || !token)
      res.status(401).json("its have a problam on email or token");
    
    

    // sendEmail( "me",
    //       {
    //         to: [email ?? ""],
    //         subject: template.subject,
    //         body: renderedHtml,
    //         isHtml: true,
    //       },
    //       token,)
    console.log("in controller");
    console.log(customer);

    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error });
  }
}

export const getCustomerById = async (req: Request, res: Response) => {

  const { id } = req.params;
  console.log("in getCustomerById", id);

  try {
    const customer = await serviceCustomer.getById(id);
    if (customer) {
      res.status(200).json(customer);
    } else {
      res.status(404).json({ message: "Customer not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer", error });
  }
};

export const searchCustomersByText = async (req: Request, res: Response) => {
  try {
    const text = req.query.text as string;

    // if (!text || text.trim() === "") {
    //   return res.status(400).json({ error: "יש לספק טקסט לחיפוש." });
    // }

    console.log("מחפש לקוחות עם טקסט:", text);
    const leads = await serviceCustomer.getCustomersByText(text);
    // console.log("לקוחות שמצאתי:", leads);

    return res.json(leads);
  } catch (error) {
    console.error("שגיאה בחיפוש לקוחות:", error);
    return res.status(500).json({ error: "שגיאה בשרת." });
  }
};

//Returns the possible client status modes
export const getAllCustomerStatus = async (req: Request, res: Response) => {
  try {
    const statuses = await serviceCustomer.getAllCustomerStatus();
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all statuses", error });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const statuses = await serviceCustomer.delete(id);
    res.status(200).json(statuses);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all statuses", error });
  }
};

// מקבל את כל הלקוחות שצריך לשלוח להם התראות
export const getCustomersToNotify = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const customers = await serviceCustomer.getCustomersToNotify(id);
    res.status(200).json(customers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching customers to notify", error });
  }
};

// יצירת הודעת עזיבה
export const postExitNotice = async (req: Request, res: Response) => {
  const exitNotice = req.body; // הנח שהנתונים מגיעים בגוף הבקשה
  const { id } = req.params;

  try {
    await serviceCustomer.postExitNotice(exitNotice, id);
    res.status(200).json({ message: "Exit notice posted" });
  } catch (error) {
    res.status(500).json({ message: "Error posting exit notice", error });
  }
};

// לקבל מספר לקוחות לפי גודל העמוד
export const getCustomersByPage = async (req: Request, res: Response) => {
  const filters = req.query;
  console.log("Filters received:", filters);

  try {
    // המרה עם בדיקה
    const pageNum = Number(filters.page);
    const limitNum = Math.max(1, Number(filters.limit) || 10);

    // אם pageNum לא מספר תקין, תגדיר כברירת מחדל 1
    const validPage = Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1;

    const filtersForService = {
      page: String(validPage), // convert to string
      limit: limitNum,
    };

    console.log("Filters passed to service:", filtersForService);

    const customer =
      await serviceCustomer.getCustomersByPage(filtersForService);

    if (customer.length > 0) {
      res.status(200).json(customer);
    } else {
      return res.status(200).json([]); // החזרת מערך ריק אם אין לקוחות
    }
  } catch (error: any) {
    console.error("❌ Error in getCustomersByPage controller:");
    if (error instanceof Error) {
      console.error("🔴 Message:", error.message);
      console.error("🟠 Stack:", error.stack);
    } else {
      console.error("🟡 Raw error object:", error);
    }

    res
      .status(500)
      .json({ message: "Server error", error: error?.message || error });
  }
  console.log("getCustomersByPage completed");
};

// עדכון מלא/חלקי של לקוח
export const patchCustomer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body; // נתוני העדכון החלקיים
  console.log("Update data received in patchCustomer controller:", updateData);

  try {
    // await serviceCustomer.patch(updateData, id)
    await serviceCustomer.updateCustomer(updateData, id);
    res.status(200).json({ message: "Customer updated successfully (PATCH)" });
  } catch (error) {
    console.error("Error in patchCustomer controller:", error);
    res.status(500).json({ message: "Error patching customer", error });
  }
};

export const getCustomerPaymentMethods = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const paymentMethods = await serviceCustomerPaymentMethod.getByCustomerId(id);
    res.status(200).json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: "Error fetching customer payment methods", error });
  }
}

// לשאול את שולמית לגבי זה

// export const getHistoryChanges = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     try {
//         const history = await customerService.getHistoryChanges(id);
//         if (history) {
//             res.status(200).json(history);
//         } else {
//             res.status(404).json({ message: 'History not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching history changes', error });
//     }
// }

// export const getStatusChanges = async (req: Request, res: Response) => {
//     const { id } = req.params;
//     try {
//         const statusChanges = await customerService.getStatusChanges(id);
//         res.status(200).json(statusChanges);
//     } catch (error) {
//         console.error('Error in getStatusChanges controller:', error);
//         res.status(500).json({ message: 'Error fetching status changes', error});
//     }
// }

export const confirmEmail = async (req: Request, res: Response) => {
  const email = req.params.email;
  const id = req.params.id;

  if (!email || !id) {
    return res.status(400).send(createHtmlMessage("שגיאה: אימייל או מזהה חסרים"));
  }

  try {
    await serviceCustomer.confirmEmail(email, id);
    res.send(createHtmlMessage("האימות הצליח! תודה שהצטרפת אלינו."));

  } catch (error: any) {
    console.error("שגיאה באימות:", error);

   

    // כל שגיאה אחרת
    res
      .status(500)
      .send(createHtmlMessage("\nאירעה שגיאה במהלך האימות." + error.details));
  }
};


function createHtmlMessage(message: string) {
  return `
    <html dir="rtl">
      <head>
        <title>אימות מייל</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 100px;
            background-color: #f5f5f5;
            color: #333;
          }
          .box {
            background: white;
            display: inline-block;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>${message}</h1>
        </div>
      </body>
    </html>
  `;
}



export const changeCustomerStatus = async (req: Request, res: Response) => {
  try {
    console.log("changeCustomerStatus called with params:", req.params);
    const userTokenService = new UserTokenService();
    const id = req.params.id; // מזהה הלקוח מהנתיב (או body לפי איך מוגדר)
    const statusChangeData : StatusChangeRequest = req.body; // פרטים לשינוי הסטטוס

    const token = await userTokenService.getSystemAccessToken();
    console.log("changeCustomerStatus called with token:", token);

    // הנחת שהמשתמש מחובר ויש לו מזהה
    if (!token) {
      return res
        .status(401)
        .json({ error: "Unauthorized: missing access token" });
    }

    if (!id || !statusChangeData) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // קוראים לפונקציה ששולחת מיילים ומשנה סטטוס
    await serviceCustomer.sendStatusChangeEmails(
      statusChangeData,
      id,
      token
    );

    res
      .status(200)
      .json({ message: "Status change processed and emails sent." });
  } catch (error) {
    console.error("Error in changeCustomerStatus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};