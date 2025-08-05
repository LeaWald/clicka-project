import React, { useEffect, useState } from 'react';
import { useExpenseStore } from '../../../../Stores/Billing/expenseStore';
import { Expense } from 'shared-types';

export const PettyCashAnalytics: React.FC = () => {
  const { expenses, fetchPettyCashExpenses } = useExpenseStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'vendor' | 'store'>('all');
  const [selectedPurchaser, setSelectedPurchaser] = useState<string>('');
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchPettyCashExpenses();
  }, [fetchPettyCashExpenses]);

  useEffect(() => {
    // הבאקאנד כבר מחזיר רק פריטי קופה קטנה
    let filtered = expenses;
    
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(expense => expense.source_type === selectedFilter);
    }
    
    if (selectedPurchaser) {
      filtered = filtered.filter(expense => 
        expense.purchaser_name.toLowerCase().includes(selectedPurchaser.toLowerCase())
      );
    }
    
    setFilteredExpenses(filtered);
  }, [expenses, selectedFilter, selectedPurchaser]);

  const uniquePurchasers = Array.from(new Set(expenses.map(e => e.purchaser_name)));

  const calculateStats = (expenses: Expense[]) => {
    const income = expenses.filter(e => e.is_income);
    const expenseItems = expenses.filter(e => !e.is_income);
    const vendorExpenses = expenses.filter(e => e.source_type === 'vendor');
    const storeExpenses = expenses.filter(e => e.source_type === 'store');

    return {
      totalIncome: income.reduce((sum, item) => sum + item.amount, 0),
      totalExpenses: expenseItems.reduce((sum, item) => sum + item.amount, 0),
      vendorTotal: vendorExpenses.reduce((sum, item) => sum + item.amount, 0),
      storeTotal: storeExpenses.reduce((sum, item) => sum + item.amount, 0),
      vendorCount: vendorExpenses.length,
      storeCount: storeExpenses.length
    };
  };

  const stats = calculateStats(filteredExpenses);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-xl font-bold mb-4">ניתוח מתקדם - קופה קטנה</h3>
      
      {/* פילטרים */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">סינון לפי מקור:</label>
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'vendor' | 'store')}
            className="border rounded px-3 py-2"
          >
            <option value="all">הכל</option>
            <option value="vendor">ספקים</option>
            <option value="store">חנויות</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">סינון לפי קונה:</label>
          <select 
            value={selectedPurchaser} 
            onChange={(e) => setSelectedPurchaser(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">הכל</option>
            {uniquePurchasers.map(purchaser => (
              <option key={purchaser} value={purchaser}>{purchaser}</option>
            ))}
          </select>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded border-r-4 border-green-500">
          <h4 className="font-semibold text-green-700">הכנסות</h4>
          <p className="text-xl font-bold text-green-600">₪{stats.totalIncome.toLocaleString()}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded border-r-4 border-red-500">
          <h4 className="font-semibold text-red-700">הוצאות</h4>
          <p className="text-xl font-bold text-red-600">₪{stats.totalExpenses.toLocaleString()}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded border-r-4 border-blue-500">
          <h4 className="font-semibold text-blue-700">ספקים</h4>
          <p className="text-xl font-bold text-blue-600">₪{stats.vendorTotal.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{stats.vendorCount} פריטים</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded border-r-4 border-purple-500">
          <h4 className="font-semibold text-purple-700">חנויות</h4>
          <p className="text-xl font-bold text-purple-600">₪{stats.storeTotal.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{stats.storeCount} פריטים</p>
        </div>
      </div>

      {/* רשימת פריטים מסוננת */}
      <div>
        <h4 className="font-semibold mb-3">פריטים ({filteredExpenses.length})</h4>
        <div className="max-h-64 overflow-y-auto">
          {filteredExpenses.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-right">תיאור</th>
                  <th className="p-2 text-right">סכום</th>
                  <th className="p-2 text-right">סוג</th>
                  <th className="p-2 text-right">מקור</th>
                  <th className="p-2 text-right">קונה</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="border-b">
                    <td className="p-2">{expense.description}</td>
                    <td className={`p-2 font-semibold ${expense.is_income ? 'text-green-600' : 'text-red-600'}`}>
                      ₪{expense.amount.toLocaleString()}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${expense.is_income ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {expense.is_income ? 'הכנסה' : 'הוצאה'}
                      </span>
                    </td>
                    <td className="p-2">{expense.source_type === 'vendor' ? 'ספק' : 'חנות'}</td>
                    <td className="p-2">{expense.purchaser_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 text-center py-4">אין פריטים להצגה</p>
          )}
        </div>
      </div>
    </div>
  );
};