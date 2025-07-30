

////מעודכן כולל פרופיל
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash,
  Mail,
  Phone,
  Building2,
  IdCard,
  FileText,
  Calendar,
  ClipboardSignature,
  ScrollText,
  Coins,
  BadgePercent,
  Camera,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CustomerStatus, PaymentMethodType, WorkspaceType } from "shared-types";
import { Button } from "./Button";

export interface CustomerCardProps {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  businessType: string;
  status: CustomerStatus;
  image?: string;
  idNumber?: string;
  currentWorkspaceType?: WorkspaceType;
  workspaceCount?: number;
  contractSignDate?: string;
  contractStartDate?: string;
  billingStartDate?: string;
  notes?: string;
  invoiceName?: string;
  paymentMethodType?: PaymentMethodType;
  ip: string;
  createdAt?: string;
  updatedAt?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<CustomerStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  NOTICE_GIVEN: "bg-yellow-100 text-yellow-800",
  EXITED: "bg-red-100 text-red-800",
  PENDING: "bg-gray-100 text-gray-800",
  CREATED: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<CustomerStatus, string> = {
  ACTIVE: "פעיל",
  NOTICE_GIVEN: "הודעת עזיבה",
  EXITED: "עזב",
  PENDING: "בהמתנה",
  CREATED: "נוצר"
};

const workspaceTypeLabels: Record<WorkspaceType, string> = {
  PRIVATE_ROOM1: "חדר פרטי",
  PRIVATE_ROOM2: "חדר של 2",
  PRIVATE_ROOM3: "חדר של 3",
  DESK_IN_ROOM: "שולחן בחדר",
  OPEN_SPACE: "אופן ספייס",
  KLIKAH_CARD: "כרטיס קליקה",
  DOOR_PASS: "דלת כניסה",
  WALL: "קיר",
  COMPUTER_STAND: "עמדת מחשב",
  RECEPTION_DESK: "דלפק קבלה",
  BASE: "בסיס"

};

const paymentMethodLabels: Record<PaymentMethodType, string> = {
  CREDIT_CARD: "כרטיס אשראי",
  BANK_TRANSFER: "העברה בנקאית",
  CHECK: "שיק",
  CASH: "מזומן",
  OTHER: "אחר",
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "לא זמין";
  const date = new Date(dateString);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`;
};

const getColorForChar = (char: string) => {
  const colors = [
    "bg-red-200 text-red-800",
    "bg-green-200 text-green-800",
    "bg-blue-200 text-blue-800",
    "bg-yellow-200 text-yellow-800",
    "bg-purple-200 text-purple-800",
    "bg-pink-200 text-pink-800",
    "bg-indigo-200 text-indigo-800",
    "bg-teal-200 text-teal-800",
  ];
  const index = char.toUpperCase().charCodeAt(0) % colors.length;
  return colors[index];
};

export const ExpandableCustomerCard = ({
  id,
  name,
  phone,
  email,
  businessName,
  businessType,
  status,
  image,
  idNumber,
  currentWorkspaceType,
  workspaceCount,
  contractSignDate,
  contractStartDate,
  billingStartDate,
  notes,
  invoiceName,
  paymentMethodType,
  ip,
  createdAt,
  updatedAt,
  onEdit,
  onDelete,
}: CustomerCardProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleEditImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`updateImage/${id}`);
  };

  const initials = name?.charAt(0).toUpperCase();
  const avatarColor = getColorForChar(initials || "A");
  const hasImage = !!image;

  return (
    <div className="rounded-xl border shadow p-2 mb-0.5 bg-white transition-all duration-300 text-right">
      <div className="cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              {hasImage ? (
                <img
                  src={image}
                  alt={name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 hover:border-blue-500 cursor-pointer"
                  onClick={handleEditImage}
                />
              ) : (
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold cursor-pointer ${avatarColor}`}
                  onClick={handleEditImage}
                >
                  {initials}
                </div>
              )}
              <Camera
                size={14}
                className="absolute -bottom-1 -left-1 bg-white rounded-full p-[1px] border cursor-pointer"
                onClick={handleEditImage}
              />
            </div>

            <div className="text-xl font-bold text-gray-900">{name}</div>

            <div
              className={`text-xs px-3 py-1 rounded-xl font-semibold flex items-center gap-2 ${statusColors[status]}`}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`updateStatus/${id}`);
              }}
            >
              {statusLabels[status]}
              <Pencil size={12} />
            </div>
          </div>
          {open ? (
            <ChevronUp className="text-gray-600" />
          ) : (
            <ChevronDown className="text-gray-600" />
          )}
        </div>

        <div className="mt-4 flex justify-between flex-wrap gap-y-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Phone size={16} /> {phone}
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} /> {email}
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={16} /> {businessName}
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-6 border-t pt-5 grid gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <IdCard size={14} /> ת"ז: {idNumber || "לא זמין"}
          </div>
          <div className="flex items-center gap-2">
            <BadgePercent size={14} /> תחום עיסוק: {businessType}
          </div>
          <div className="flex items-center gap-2">
            <ClipboardSignature size={14} /> סוג מקום עבודה: {workspaceTypeLabels[currentWorkspaceType!] || "לא זמין"}
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} /> מקומות עבודה: {workspaceCount ?? "לא זמין"}
          </div>
          <div className="flex items-center gap-2">
            <ScrollText size={14} /> חתימה: {formatDate(contractSignDate)}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} /> התחלת חוזה: {formatDate(contractStartDate)}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} /> תחילת חיוב: {formatDate(billingStartDate)}
          </div>
          <div className="flex items-center gap-2">
            <FileText size={14} /> הערות: {notes || "אין"}
          </div>
          <div className="flex items-center gap-2">
            <FileText size={14} /> חשבונית ע"ש: {invoiceName || "לא זמין"}
          </div>
          <div className="flex items-center gap-2">
            <Coins size={14} /> תשלום: {paymentMethodLabels[paymentMethodType!] || "לא זמין"}
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} /> כתובת IP: {ip || "לא זמין"} {/* הוספת שדה ה-IP */}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} /> נוצר: {formatDate(createdAt)}
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} /> עודכן: {formatDate(updatedAt)}
          </div>

          <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
            <div className="flex gap-3 text-blue-600 font-medium text-sm">
              <button onClick={() => navigate(`${id}/contract`, { state: { customerName: name } })}>חוזה לקוח</button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEdit(id)}
                className="flex gap-1 items-center"
              >
                <Pencil size={14} /> עריכה
              </Button>
              <Button
                size="sm"
                variant="accent"
                onClick={() => onDelete(id)}
                className="flex gap-1 items-center"
              >
                <Trash size={14} /> מחיקה
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
