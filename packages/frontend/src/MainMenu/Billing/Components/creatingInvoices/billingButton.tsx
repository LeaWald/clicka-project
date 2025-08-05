import { Button as BaseButton } from "../../../../Common/Components/BaseComponents/Button";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CustomerModel } from '../../../../../../backend/src/models/customer.model'; 

export const CreateInvoiceButtons = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const [openSingle, setOpenSingle] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [startDateSingle, setStartDateSingle] = useState("");
  const [endDateSingle, setEndDateSingle] = useState("");

  const [openAll, setOpenAll] = useState(false);
  const [startDateAll, setStartDateAll] = useState("");
  const [endDateAll, setEndDateAll] = useState("");

  const [customers, setCustomers] = useState<CustomerModel[]>([]); 

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/customers'); 
        if (!res.ok) throw new Error("שגיאה בטעינת לקוחות");
        const data = await res.json();
        setCustomers(data); 
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleDialogOpenSingle = () => setOpenSingle(true);
  const handleDialogCloseSingle = () => setOpenSingle(false);

  const handleDialogOpenAll = () => setOpenAll(true);
  const handleDialogCloseAll = () => setOpenAll(false);

  const handleSingle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      console.log(`Fetching billing calculation for customer ID: ${customerId}`);
      if (!customerId) {
        alert("יש לבחור לקוח");
        return;
      };
      // קריאה לפונקציית החישוב בלבד
      const res = await fetch(`/api/billing/calculate/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: startDateSingle, endDate: endDateSingle }),
      });

      if (!res.ok) throw new Error("חישוב החיוב נכשל");

      alert("החישוב בוצע בהצלחה");
      handleDialogCloseSingle();
      if (onSuccess) onSuccess();

    } catch (err) {
      if (onError) onError(err);
      alert("אירעה שגיאה בעת חישוב החיוב");
    }
  };

  const handleAll = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await fetch(`/api/billing/calculate-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: startDateAll, endDate: endDateAll }),
      });
      if (!res.ok) throw new Error("חישוב החיוב נכשל");
      alert("החשבוניות חושבו בהצלחה");
      handleDialogCloseAll();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (onError) onError(err);
      alert("אירעה שגיאה בעת חישוב החיוב");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <BaseButton onClick={handleDialogOpenSingle}>חשב חיוב ללקוח</BaseButton>
      <BaseButton onClick={handleDialogOpenAll}>חשב חיוב לכל הלקוחות</BaseButton>

      <Dialog open={openSingle} onClose={handleDialogCloseSingle}>
        <DialogTitle>חשב חיוב ללקוח</DialogTitle>
        <form onSubmit={handleSingle}>
          <DialogContent>
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="customer-select-label">בחר לקוח</InputLabel>
              <Select
                labelId="customer-select-label"
                id="customerId"
                value={customerId}
                label="בחר לקוח"
                onChange={e => setCustomerId(e.target.value as string)}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              required
              margin="dense"
              id="startDateSingle"
              label="תאריך התחלה"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDateSingle}
              onChange={e => setStartDateSingle(e.target.value)}
            />
            <TextField
              required
              margin="dense"
              id="endDateSingle"
              label="תאריך סיום"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDateSingle}
              onChange={e => setEndDateSingle(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogCloseSingle}>ביטול</Button>
            <Button type="submit">חשב</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openAll} onClose={handleDialogCloseAll}>
        <DialogTitle>חשב חיוב לכל הלקוחות</DialogTitle>
        <form onSubmit={handleAll}>
          <DialogContent>
            <TextField
              autoFocus
              required
              margin="dense"
              id="startDateAll"
              label="תאריך התחלה"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDateAll}
              onChange={e => setStartDateAll(e.target.value)}
            />
            <TextField
              required
              margin="dense"
              id="endDateAll"
              label="תאריך סיום"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDateAll}
              onChange={e => setEndDateAll(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogCloseAll}>ביטול</Button>
            <Button type="submit">חשב</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
