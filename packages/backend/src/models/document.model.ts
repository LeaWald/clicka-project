import { ID, DateISO } from 'shared-types/core';
export interface Document {
  id: ID;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  url: string;
  googleDriveId: string;
  created_at: DateISO;
  updated_at: DateISO;
//   type?: DocumentType;
}

export class DocumentModel implements Document {
  id: ID;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  url: string;
  googleDriveId: string;
  created_at: DateISO;
  updated_at: DateISO;
//   type?: DocumentType;

  constructor(params: Document) {
    this.id = params.id ?? crypto.randomUUID();
    this.name = params.name;
    this.path = params.path;
    this.mimeType = params.mimeType;
    this.size = params.size;
    this.url = params.url;
    this.googleDriveId = params.googleDriveId;
    this.created_at = params.created_at ?? new Date().toISOString();
    this.updated_at = params.updated_at ?? new Date().toISOString();
    // this.type = params.type;
  }

  toDatabaseFormat() {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      mime_type: this.mimeType,
      size: this.size,
      url: this.url,
      google_drive_id: this.googleDriveId,
    //   type: this.type,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  static fromDatabaseFormat(dbData: any): DocumentModel {
    return new DocumentModel({
      id: dbData.id,
      name: dbData.name,
      path: dbData.path,
      mimeType: dbData.mime_type,
      size: dbData.size,
      url: dbData.url,
      googleDriveId: dbData.google_drive_id,
      created_at: dbData.created_at,
      updated_at: dbData.updated_at,
    //   type: dbData.type,
    });
  }
}