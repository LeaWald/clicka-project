// src/api/leadCustomer.ts

import {
  Lead,
  CreateLeadRequest,
  Customer,
  UpdateCustomerRequest,
  CreateCustomerRequest,
  RecordExitNoticeRequest,
  Contract,
  StatusChangeRequest,
} from 'shared-types';
import { axiosInstance } from '../../../Service/Axios';

// ---------- לידים ----------

export const getAllLeads = async (): Promise<Lead[]> => {
  try {
    const response = await axiosInstance.get<Lead[]>('/leads');
    return response.data;
  } catch (error) {
    console.error('Error getting all leads:', error);
    throw error;
  }
};

export const createLead = async (lead: CreateLeadRequest): Promise<Lead> => {
  try {
    const response = await axiosInstance.post<Lead>('/leads', lead);
    return response.data;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/leads/${id}`);
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};


// ---------- לקוחות ----------

const CUSTOMERS_BASE_PATH = '/customers';


export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await axiosInstance.get<Customer[]>(CUSTOMERS_BASE_PATH);
    return response.data;
  } catch (error) {
    console.error('Error getting all customers:', error);
    throw error;
  }
};

export const getCustomersByPage = async (page = 1, pageSize = 50): Promise<Customer[]> => {
  try {
    const response = await axiosInstance.get<Customer[]>(`${CUSTOMERS_BASE_PATH}/page?page=${page}&pageSize=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error('Error getting customers by page:', error);
    throw error;
  }
};

export const getAllCustomerStatus = async (): Promise<string[]> => {
  try {
    const response = await axiosInstance.get<string[]>(`${CUSTOMERS_BASE_PATH}/status/all`);
    return response.data;
  } catch (error) {
    console.error('Error getting customer statuses:', error);
    throw error;
  }
};

export const getCustomersToNotify = async (id: string): Promise<Customer[]> => {
  try {
    const response = await axiosInstance.get<Customer[]>(`${CUSTOMERS_BASE_PATH}/notify/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting customers to notify:', error);
    throw error;
  }
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const response = await axiosInstance.get<Customer>(`${CUSTOMERS_BASE_PATH}/id/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting customer by ID:', error);
    throw error;
  }
};

export const getCustomersByFilter = async (filters: Record<string, any>): Promise<Customer[]> => {
  try {
    const response = await axiosInstance.get<Customer[]>(`${CUSTOMERS_BASE_PATH}/filter`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error filtering customers:', error);
    throw error;
  }
};

export const postExitNotice = async (id: string, data: RecordExitNoticeRequest): Promise<void> => {
  try {
    await axiosInstance.post(`/customers/exit-notice`, { id, ...data });
  } catch (error) {
    console.error('Error posting exit notice:', error);
    throw error;
  }
};

export const createCustomer = async (data: CreateCustomerRequest): Promise<Customer> => {
  try {
    const response = await axiosInstance.post<Customer>(`${CUSTOMERS_BASE_PATH}/post-customer`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const patchCustomer = async (id: string, data: Partial<UpdateCustomerRequest>): Promise<void> => {
  try {
    await axiosInstance.patch(`${CUSTOMERS_BASE_PATH}/${id}`, data);
  } catch (error) {
    console.error('Error patching customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`${CUSTOMERS_BASE_PATH}/${id}`);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

export const recordExitNotice = async (id: string, data: RecordExitNoticeRequest): Promise<Customer> => {
  try {
    const response = await axiosInstance.post<Customer>(`${CUSTOMERS_BASE_PATH}/${id}/exit-notice`, data);
    return response.data;
  } catch (error) {
    console.error('Error recording exit notice:', error);
    throw error;
  }
};

// ---------- חוזים ----------

export const getAllContracts = async (): Promise<Contract[]> => {
  try {
    const response = await axiosInstance.get<Contract[]>('/api/contract');
    return response.data;
  } catch (error) {
    console.error("שגיאה בשליפת חוזים:", error);
    throw error;
  }
};

export const postNewContract = async (contractData: Partial<Contract>) => {
  const response = await axiosInstance.post("/api/contract", contractData);
  return response.data;
};

export const postContractDocuments = async (formData: FormData) => {
  const response = await axiosInstance.post("/api/contract/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const fetchContractByCustomerId = async (customerId: string) => {
  const response = await axiosInstance.get(`/api/contract/customer/${customerId}`);
  return response.data;
};

export const fetchContractByContractId = async (contractId: string) => {
  const response = await axiosInstance.get(`/api/contract/${contractId}`);
  return response.data;
};

export const deleteContract = async (contractId: string) => {
  try {
    await axiosInstance.delete(`/api/contract/${contractId}`);
  } catch (error) {
    console.error("שגיאה במחיקת חוזה:", error);
    throw error;
  }
};

export const patchContract = async (contractId: string, data: Partial<Contract>): Promise<void> => {
  try {
    await axiosInstance.patch(`/api/contract/${contractId}`, data);
  } catch (error) {
    console.error('Error patching contract:', error);
    throw error;
  }
};