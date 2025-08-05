import { useState } from 'react';
import { CreateExpenseModal } from './expenseForm';
export const ExpensesPage = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button className="btn-primary" onClick={() => setShowModal(true)}>
        הוספת הוצאה
      </button>
      <CreateExpenseModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};