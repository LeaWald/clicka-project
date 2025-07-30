import { Request, Response } from 'express';
import { contractService } from '../services/contract.service';
import { ContractModel } from '../models/contract.model';

const serviceContract = new contractService();

// קבלת כל החוזים עם שם הלקוח
export const getAllContracts = async (req: Request, res: Response) => {
  try {
    const contracts = await serviceContract.getAllContractsWithCustomerName();
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error in getAllContracts controller:', error);
    res.status(500).json({ message: 'Error fetching all contracts', error });
  }
};

// קבלת חוזה לפי מזהה
export const getContractById = async (req: Request, res: Response) => {
  const { contractId } = req.params;
  try {
    const contract = await serviceContract.getById(contractId);
    res.status(200).json(contract);
  } catch (error) {
    console.error('Error in getContractById controller:', error);
    res.status(500).json({ message: 'Error fetching contract by ID', error });
  }
};

// קבלת חוזה לפי מזהה לקוח
export const getAllContractsByCustomerId = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  try {
    const contracts = await serviceContract.getAllContractsByCustomerId(customerId);
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error in getContractByCustomerId controller:', error);
    res.status(500).json({ message: 'Error fetching contract by customer ID', error });
  }
};

// חוזים שתוקפם עומד להסתיים
export const getContractsEndingSoon = async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  try {
    const contracts = await serviceContract.getContractsEndingSoon(days);
    res.status(200).json(contracts);
  } catch (error) {
    console.error('Error in getContractsEndingSoon controller:', error);
    res.status(500).json({ message: 'Error fetching contracts ending soon', error });
  }
};

// יצירת חוזה חדש
export const postNewContract = async (req: Request, res: Response) => {
  try {
    const {
      id,
      customer_id,
      version,
      status,
      start_date,
      documents,
      created_at,
      updated_at,
      sign_date,
      end_date,
      terms,
      signed_by,
      witnessed_by,
    } = req.body;

    const contractData = new ContractModel(
      id,
      customer_id,
      version,
      status,
      start_date,
      documents || [],
      created_at,
      updated_at,
      sign_date,
      end_date,
      terms,
      signed_by,
      witnessed_by
    );

    await serviceContract.post(contractData);
    res.status(201).json({ message: 'New contract created successfully' });
  } catch (error) {
    console.error('Error in postNewContract controller:', error);
    res.status(500).json({ message: 'Error creating new contract', error });
  }
};

// עדכון חוזה
export const updateContract = async (req: Request, res: Response) => {
  const { contractId } = req.params;
  const updatedData = req.body;

  try {
    const updatedContract = await serviceContract.patch(updatedData, contractId);
    res.status(200).json(updatedContract);
  } catch (error) {
    console.error('שגיאה בעדכון חוזה:', error);
    res.status(500).json({ message: 'שגיאה בעדכון חוזה', error });
  }
};

// מחיקת חוזה
export const deleteContract = async (req: Request, res: Response) => {
  const { contractId } = req.params;
  try {
    await serviceContract.delete(contractId);
    res.status(204).send();
  } catch (error) {
    console.error('שגיאה במחיקת חוזה:', error);
    res.status(500).json({ message: 'שגיאה במחיקת חוזה', error });
  }
};

// הוספת מסמך לחוזה
export const postContractDocument = async (req: Request, res: Response) => {
  const { documentData, customerId } = req.body; // לבדוק אם זה אמור להיות contractId
  try {
    await serviceContract.postContractDocument(documentData, customerId);
    res.status(200).json({ message: 'Contract document added successfully' });
  } catch (error) {
    console.error('Error in postContractDocument controller:', error);
    res.status(500).json({ message: 'Error adding contract document', error });
  }
};

// מחיקת מסמך מהחוזה
export const deleteContractDocument = async (req: Request, res: Response) => {
  const { customerId, documentId } = req.params;
  try {
    await serviceContract.deleteContractDocument(customerId, documentId);
    res.status(200).json({ message: 'Contract document deleted successfully' });
  } catch (error) {
    console.error('Error in deleteContractDocument controller:', error);
    res.status(500).json({ message: 'Error deleting contract document', error });
  }
};

// עדכון חוזה עם מזהה מסמך
export const updateContractDocument = async (req: Request, res: Response) => {
  const { contractId } = req.params;
    const { document } = req.body;
  
  console.log('updateContractDocument controller called with:', { contractId, document, body: req.body });
  
  try {
    await serviceContract.updateContractWithDocument(contractId, document);
    console.log('Contract updated successfully');
    res.status(200).json({ message: 'Contract updated with document successfully' });
  } catch (error) {
    console.error('Error updating contract with document:', error);
    res.status(500).json({ message: 'Error updating contract with document', error });
  }
};

// יצירה או עדכון חוזה עם מסמך
export const createOrUpdateContractWithDocument = async (req: Request, res: Response) => {
  const { customerId, documentId } = req.body;
  
  console.log('createOrUpdateContractWithDocument called with:', { customerId, documentId });
  
  try {
    await serviceContract.createOrUpdateContractWithDocument(customerId, documentId);
    res.status(200).json({ message: 'Contract created/updated with document successfully' });
  } catch (error) {
    console.error('Error creating/updating contract with document:', error);
    res.status(500).json({ message: 'Error creating/updating contract with document', error });
  }
};

// חיפוש חוזים לפי טקסט
export const searchContractsByText = async (req: Request, res: Response) => {
  try {
    const text = req.query.text as string;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'יש לספק טקסט לחיפוש.' });
    }

    const results = await serviceContract.getContractsByText(text);
    return res.json(results);
  } catch (error) {
    console.error('שגיאה בחיפוש חוזים:', error);
    return res.status(500).json({ error: 'שגיאה בשרת.' });
  }
};
