import { google } from "googleapis";
import { SendEmail } from "shared-types/google";
import { UserTokenService } from "./userTokenService";
import { EmailTemplateService } from "./emailTemplate.service";
import { customerService } from "./customer.service";
import { ID } from "shared-types";

function getAuth(token: string) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ access_token: token });
  return client;
}

function encodeMessage(request: SendEmail): string {
  const boundaryMixed = "__MIXED_BOUNDARY__";
  const boundaryAlt = "__ALT_BOUNDARY__";

  const headers = [
    `From: me`,
    `To: ${request.to.join(", ")}`,
    request.cc?.length ? `Cc: ${request.cc.join(", ")}` : "",
    request.bcc?.length ? `Bcc: ${request.bcc.join(", ")}` : "",
    `Subject: ${encodeSubject(request.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
  ].filter(Boolean).join("\n");

  const bodyPlain = request.isHtml
    ? "This email requires an HTML viewer."
    : request.body;
  const bodyHtml = request.isHtml ? request.body : "";

  const altPart = [
    `--${boundaryMixed}`,
    `Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
    "",
    `--${boundaryAlt}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyPlain,
    `--${boundaryAlt}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyHtml,
    `--${boundaryAlt}--`,
  ].join("\n");

  const attachmentParts = request.attachments?.map((attachment) => {
    const base64Content = typeof attachment.data === "string"
      ? attachment.data
      : attachment.data.toString("base64");

    return [
      `--${boundaryMixed}`,
      `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      "",
      base64Content,
    ].join("\n");
  }) || [];

  const fullMessage = [
    headers,
    "",
    altPart,
    ...attachmentParts,
    `--${boundaryMixed}--`,
  ].join("\n");

  return Buffer.from(fullMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
}

const MAX_BATCH_SIZE = 10; // כמות המיילים בכל קבוצה
const RETRY_LIMIT = 6;

export async function sendEmailsInBatch(
  emails: SendEmail[],
  accessToken: string,
): Promise<void> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  for (let i = 0; i < emails.length; i += MAX_BATCH_SIZE) {
    const batch = emails.slice(i, i + MAX_BATCH_SIZE);

    for (const email of batch) {
      await retryWithBackoff(() => sendSingleEmail(email, auth));
    }

    // המתנה בין קבוצות כדי למנוע עומס
    await delay(1000);
  }
}
async function sendSingleEmail(email: SendEmail, auth: any) {
  const raw = encodeMessage(email); // פונקציה שיוצרת מייל מקודד
  const gmail = google.gmail({ version: "v1", auth });
  await gmail.users.messages.send({
    auth,
    userId: "me",
    requestBody: {
      raw,
    },
  });
}
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retryWithBackoff(
  fn: () => Promise<void>,
  retries = RETRY_LIMIT,
): Promise<void> {
  let delayMs = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (err: any) {
      const errorCode = err?.code || err?.response?.status;

      if ([429, 403].includes(errorCode)) {
        console.warn(`⏳ ניסיון ${i + 1} נכשל - ממתין ${delayMs}ms`);
        await delay(delayMs);
        delayMs *= 2; // exponential backoff
      } else {
        throw err; // שגיאה אחרת – זרקי מיד
      }
    }
  }
  throw new Error(`שליחה נכשלה לאחר ${RETRY_LIMIT} ניסיונות`);
}

export async function sendEmail(
  userId: string,
  request: SendEmail,
  token: string,
) {
  const gmail = google.gmail({ version: "v1", auth: getAuth(token) });
  const raw = encodeMessage(request);
  const res = await gmail.users.messages.send({ userId, requestBody: { raw } });
  return res.data;
}
export async function listEmails(
  userId: string,
  token: string,
  options?: {
    maxResults?: number;
    q?: string;
    labelIds?: string[];
    pageToken?: string;
  },
) {
  const gmail = google.gmail({ version: "v1", auth: getAuth(token) });
  let listRes;
  try {
    listRes = await gmail.users.messages.list({
      userId,
      maxResults: options?.maxResults,
      q: options?.q,
      labelIds: options?.labelIds,
      pageToken: options?.pageToken,
    });
  } catch (error) {
    return [{ error: "Failed to fetch message list", details: error }];
  }
  const messages = listRes.data?.messages;
  if (!messages || messages.length === 0) return [];
  const detailed = await Promise.all(
    messages.map(async (msg) => {
      try {
        const full = await gmail.users.messages.get({
          userId,
          id: msg.id!,
          format: "metadata",
        });
        return {
          id: msg.id,
          snippet: full.data.snippet,
          headers: full.data.payload?.headers,
        };
      } catch (err) {
        return {
          error: `Failed to fetch message ${msg.id}`,
          details: err instanceof Error ? err.message : err,
        };
      }
    }),
  );
  return detailed;
}

export const sendEmailToConfrim = async (email: string | undefined, id: ID) => {
  const userTokenService = new UserTokenService();
  const emailService = new EmailTemplateService();
  const customerservice = new customerService();
  const token = await userTokenService.getSystemAccessToken();
  const template = await emailService.getTemplateByName("אימות מייל");
  const customer = await customerservice.getById(id);
  if (!token) {
    throw console.log("the token worng", token);
  }
  if (!template) {
    console.warn("email template not found", template);
    return;
  }
  const renderedHtml = await emailService.renderTemplate(
    template.bodyHtml,
    {
      "name": customer.name,
      "link":
        `${process.env.REACT_APP_API_URL}/customers/confirm-email/${id}/${email}`,
    },
  );
  await sendEmail(
    "me",
    {
      to: [email ?? ""],
      subject: encodeSubject(template.subject),
      body: renderedHtml,
      isHtml: true,
    },
    token,
  );

  
};