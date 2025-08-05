
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateExpenseModal } from './expenseForm';

export const CreateExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    navigate(-1); // חזרה לדף הקודם
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <>
      <CreateExpenseModal 
        open={isModalOpen} 
        onClose={handleClose}
      />
    </>
  );
};