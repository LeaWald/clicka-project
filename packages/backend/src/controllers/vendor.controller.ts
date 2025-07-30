import type{ CreateVendorRequest, Vendor } from 'shared-types';
import { Request, Response } from 'express';
import { VendorModel } from '../models/vendor.model';
import { create, deleteVendor, getAllVendors, getExpensesByVendorId, getVendorById, saveDocumentAndAttachToVendor } from '../services/vendor.service';
export const createVendorController = async (req: Request, res: Response) => {
  try {
    const newVendor = new VendorModel(req.body); // יצירת מופע מודל מ-req.body
    const vn = await create(req.body as CreateVendorRequest); // העברת המודל
    res.status(201).json(vn);
    console.log("vendor.routes loaded");
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const getVendorController = async (req: Request, res: Response) => {
  try {
    const vendors = await getAllVendors();
    res.json(vendors);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const getVendorByIdController = async (req: Request, res: Response) => {
  try {
    const getById = await getVendorById(req.params.id as any);
    res.json(getById);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export const deleteVendorController = async (req: Request, res: Response) => {
  try {
    const result = await deleteVendor(req.params.id as any);
    res.json({ success: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
export async function uploadVendorDocument(req: Request, res: Response) {
  const vendorId = req.params.id;
  const file = req.body.file;

  if (!file || !vendorId) {
    return res.status(400).json({ error: 'חסרים פרטים' });
  }

  try {
    const document = await saveDocumentAndAttachToVendor(vendorId, file);
    return res.status(201).json(document);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'שגיאה בשמירת המסמך' });
  }
}
export async function fetchExpensesByVendorId(req: Request, res: Response) {
  const { vendorId } = req.params;

  try {
    const expenses = await getExpensesByVendorId(vendorId);
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error in fetchExpensesByVendorId:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
}



