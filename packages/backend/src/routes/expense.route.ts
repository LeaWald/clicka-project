import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
// יצירת מופע Controllers
const expenseController = new ExpenseController();
// יצירת Router ראשי
const expenseRouter = Router();
// === נתיבי הוצאות ===
expenseRouter.get("/getAll", expenseController.getAllExpenses1.bind(expenseController));
expenseRouter.post("/createExpense", expenseController.createExpense.bind(expenseController));
expenseRouter.get("/getAllExpenses", expenseController.getAllExpenses.bind(expenseController));
expenseRouter.get("/getExpenseById/:id", expenseController.getExpenseById.bind(expenseController));
expenseRouter.put("/:id", expenseController.updateExpense.bind(expenseController));
expenseRouter.put("/markExpenseAsPaid/:id", expenseController.markExpenseAsPaid.bind(expenseController));
expenseRouter.delete("/:id", expenseController.deleteExpense.bind(expenseController));
expenseRouter.get("/by-page", expenseController.getExpensesByPage.bind(expenseController));
expenseRouter.get("/filter", expenseController.getExpensesByFilter.bind(expenseController));
expenseRouter.get('/petty-cash', expenseController.getPettyCashExpenses.bind(expenseController));
// === נתיבי קטגוריות הוצאה ===
expenseRouter.get("/categories", expenseController.getAllCategories.bind(expenseController));
expenseRouter.post("/createCategories", expenseController.createCategory.bind(expenseController));
expenseRouter.delete("/categories/:id", expenseController.deleteCategory.bind(expenseController));
// ייצוא ה-router לשימוש ב-app הראשי
export default expenseRouter;