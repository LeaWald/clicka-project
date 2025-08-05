import React, { useEffect, useState } from 'react';
import { useExpenseStore } from '../../../../Stores/Billing/expenseStore';
import { Expense } from 'shared-types';

interface CashSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export const PettyCashSummary: React.FC = () => {
  const { expenses, fetchPettyCashExpenses } = useExpenseStore();
  const [summary, setSummary] = useState<CashSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0
  });

  const calculateSummary = (expenses: Expense[]): CashSummary => {
    // הבאקאנד כבר מחזיר רק פריטי קופה קטנה
    const income = expenses.filter(expense => expense.is_income);
    const expenseItems = expenses.filter(expense => !expense.is_income);
    
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = expenseItems.reduce((sum, item) => sum + item.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      incomeCount: income.length,
      expenseCount: expenseItems.length
    };
  };

  useEffect(() => {
    fetchPettyCashExpenses();
  }, [fetchPettyCashExpenses]);

  useEffect(() => {
    setSummary(calculateSummary(expenses));
  }, [expenses]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-xl font-bold mb-4 text-center">מצב הקופה הקטנה</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded border-r-4 border-green-500">
          <h4 className="font-semibold text-green-700">הכנסות</h4>
          <p className="text-2xl font-bold text-green-600">₪{summary.totalIncome.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{summary.incomeCount} פריטים</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded border-r-4 border-red-500">
          <h4 className="font-semibold text-red-700">הוצאות</h4>
          <p className="text-2xl font-bold text-red-600">₪{summary.totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{summary.expenseCount} פריטים</p>
        </div>
      </div>
      
      <div className={`p-4 rounded text-center ${summary.balance >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'} border-2`}>
        <h4 className="font-semibold">יתרה כוללת</h4>
        <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          ₪{summary.balance.toLocaleString()}
        </p>
      </div>
    </div>
  );
};