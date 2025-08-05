import { Request, Response } from "express";
// ייבוא מחלקת השירות שמבצעת את הלוגיקה העסקית מול מסד הנתונים
import { ExpenseService } from "../services/expense.services";
import type {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  GetExpensesRequest,
  MarkExpenseAsPaidRequest,
} from "shared-types";
export class ExpenseController {
  expenseService = new ExpenseService();
  // ------------------- EXPENSE METHODS -------------------
  async getAllExpenses1(req: Request, res: Response) {
    const result = await this.expenseService.getExpenses1();
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }
  async createExpense(req: Request, res: Response) {
    const expenseData: CreateExpenseRequest = req.body;
    console.log('Prepared expense data:', JSON.stringify(expenseData, null, 2));
    const result = await this.expenseService.createExpense(expenseData);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to create expense" });
    }
  }
  async getAllExpenses(req: Request, res: Response) {
    const filters: GetExpensesRequest = req.query as unknown as GetExpensesRequest;
    const result = await this.expenseService.getExpenses(filters);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }
  async getExpenseById(req: Request, res: Response) {
    const expenseId = req.params.id;
    const result = await this.expenseService.getExpenseById(expenseId);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Expense not found" });
    }
  }
  async updateExpense(req: Request, res: Response) {
    const expenseId = req.params.id;
    const updateData: UpdateExpenseRequest = req.body;
    console.log('Prepared update data:', JSON.stringify(updateData, null, 2));
    const result = await this.expenseService.updateExpense(expenseId, updateData);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to update expense" });
    }
  }
    async markExpenseAsPaid(req: Request, res: Response) {
        const expenseId = req.params.id; // קריאת ה-ID מתוך ה-params
        const paidData: MarkExpenseAsPaidRequest = req.body; // קריאת נתוני התשלום מתוך גוף הבקשה
        const result = await this.expenseService.markExpenseAsPaid(expenseId, paidData); // קריאה לשירות לסימון ההוצאה כ-paid
        if (result) {
            res.status(200).json(result); // הצלחה: החזרת ההוצאה לאחר העדכון
        } else {
            res.status(500).json({ error: "Failed to mark expense as paid" }); // כשלון: החזרת שגיאה
        }
    }
  async deleteExpense(req: Request, res: Response) {
    const expenseId = req.params.id;
    const result = await this.expenseService.deleteExpense(expenseId);
    if (result) {
      res.status(200).send();
    } else {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  }
  async getExpensesByPage(req: Request, res: Response) {
    try {
      const pageNum = Math.max(1, Number(req.params.page) || 1);
      const limitNum = Math.max(1, Number(req.params.limit) || 50);
      const filtersForService = { page: pageNum, limit: limitNum };
      const expenses = await this.expenseService.getExpensesByPage(filtersForService);
      if (expenses.length > 0) {
        res.status(200).json(expenses);
      } else {
        res.status(404).json({ message: "No expenses found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Server error", error: error?.message || error });
    }
  }
  async getExpensesByFilter(req: Request, res: Response) {
    const filters = req.query.id ? { id: req.query.id } : req.query;
    try {
      const expenses = await this.expenseService.getExpenseById(filters.toString());
      if (expenses.length > 0) {
        res.status(200).json(expenses);
      } else {
        res.status(404).json({ message: "No expenses found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error filtering expenses", error });
    }
  }
  async getPettyCashExpenses(req: Request, res: Response) {
    const result = await this.expenseService.getPettyCashExpenses();
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(500).json({ error: "Failed to fetch petty cash expenses" });
    }
  }
  // ------------------- CATEGORY METHODS -------------------
  async getAllCategories(req: Request, res: Response) {
    const categories = await this.expenseService.getAllExpenseCategories();
    if (categories) {
      res.status(200).json(categories);
    } else {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  }
  async createCategory(req: Request, res: Response) {
    try {
      console.log('Creating category with data:', req.body);
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Category name is required" });
      }
      const category = await this.expenseService.createExpenseCategory(name);
      console.log('Category creation result:', category);
      if (category) {
        res.status(201).json(category);
      } else {
        res.status(500).json({ error: "Failed to create category" });
      }
    } catch (error: any) {
      console.error('Error in createCategory controller:', error);
      if (error.message && error.message.includes('כבר קיימת')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
  async deleteCategory(req: Request, res: Response) {
    try {
      console.log('Deleting category with ID:', req.params.id);
      const { id } = req.params;
      const success = await this.expenseService.deleteExpenseCategory(id);
      console.log('Delete result:', success);
      if (success) {
        res.status(200).json({ message: "Category deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete category" });
      }
    } catch (error: any) {
      console.error('Error in deleteCategory controller:', error);
      if (error.message && error.message.includes('בשימוש')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
  }