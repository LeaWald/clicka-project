// src/api/leadCustomer.ts

import {
  Lead,
  CreateLeadRequest,
  Customer,
  UpdateCustomerRequest,
  CreateCustomerRequest,
  RecordExitNoticeRequest,
  // StatusChangeRequest,
} from 'shared-types';
// Update the import path below if the actual location of Axios.ts is different
import { axiosInstance } from '../../../../Service/Axios';


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

export { axiosInstance };
