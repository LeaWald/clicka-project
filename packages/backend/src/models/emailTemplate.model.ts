import { DateISO, ID, EmailTemplate } from "shared-types";

export class EmailTemplateModel implements EmailTemplate {
    id?: ID;
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    language: 'he' | 'en';
    variables: string[];
    createdAt: DateISO;
    updatedAt: DateISO;

    constructor(data: any) {
        this.id = data.id ?? undefined;
        this.name = data.name;
        this.subject = data.subject;
        this.bodyHtml = data.bodyHtml ?? data.body_html ?? '';
        this.bodyText = data.bodyText ?? data.body_text ?? '';
        this.language = data.language ?? 'he';
        this.variables = data.variables ?? [];
        let parsedVariables: string[] = [];
        if (Array.isArray(data.variables)) {
            // אם זה כבר מערך, נחלץ את החלק שלפני הנקודתיים (אם קיים)
            parsedVariables = data.variables.map((v: string) => v.split(':')[0].trim());
        } else if (typeof data.variables === 'string') {
            // אם זו מחרוזת, נפצל לפי פסיקים ואז נחלץ
            parsedVariables = data.variables.split(',').map((v: string) => v.split(':')[0].trim());
        }
        this.variables = parsedVariables;
        this.createdAt = data.createdAt ?? data.created_at ?? new Date().toISOString();
        this.updatedAt = data.updatedAt ?? data.updated_at ?? new Date().toISOString();
    }

    toDatabaseFormat() {
        return {
            name: this.name,
            subject: this.subject,
            body_html: this.bodyHtml,
            body_text: this.bodyText,
            language: this.language,
            variables: this.variables,
            created_at: this.createdAt,
            updated_at: this.updatedAt,
        };
    }
}
