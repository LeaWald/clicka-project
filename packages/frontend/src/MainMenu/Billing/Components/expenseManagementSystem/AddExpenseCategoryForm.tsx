import { useState } from "react";
import axios from "axios";

export function AddExpenseCategoryForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await axios.post("/api/expenses/createCategories", { name });

      if (response.status === 201) {
        setSuccessMessage("הקטגוריה נוספה בהצלחה!");
        setName("");
      } else {
        setErrorMessage("אירעה שגיאה. נסי שוב.");
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "שגיאת שרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, marginTop: 20 }}>
      <label htmlFor="category-name">שם קטגוריה חדשה:</label>
      <input
        id="category-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="למשל: שכירות, ריהוט..."
        style={{ width: "100%", padding: "8px", marginTop: 4 }}
      />

      <button
        type="submit"
        disabled={loading || name.trim() === ""}
        style={{ marginTop: 10 }}
      >
        {loading ? "שולח..." : "הוספת קטגוריה"}
      </button>

      {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
    </form>
  );
}