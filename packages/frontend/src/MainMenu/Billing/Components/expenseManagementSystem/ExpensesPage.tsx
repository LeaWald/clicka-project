import React, { useState } from 'react';
import { CreateExpenseForm } from './expenseForm';

export const ExpensesPage = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button className="btn-primary" onClick={() => setShowModal(true)}>
        הוספת הוצאה
      </button>

      <CreateExpenseForm />
    </>
  );
};
