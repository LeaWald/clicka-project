import React from "react";
import clsx from "clsx";
import { useTheme } from "../themeConfig";
import { Button } from "./Button";
import { Pencil, Trash } from "lucide-react";


export interface BaseComponentProps {
  className?: string;
  dir?: 'rtl' | 'ltr';
  'data-testid'?: string;
  children?: React.ReactNode;
}

export interface TableColumn<T> {
  header: string;//הכותרת של העמודות של הטבלה 
  accessor: keyof T;// כל מה שיש בתוך הטבלה וזה מסוג גנרי כדי שנוכל להכניס מה שרוצים מכל טיפוס שהוא
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T> extends BaseComponentProps {
  columns: TableColumn<T>[]; //מקבלת ARR לבניית השורות 
  data: T[];//ARR עם כל מה שיש בתוך הטבלה 
  onUpdate?: (row: T) => void;  //פונקציה לעידכון 
  onDelete?: (row: T) => void; //פונקציה למחיקה 
  renderActions?: (row: T) => React.ReactNode; // הוסף שורה זו
  showActions?: boolean;  // אם לא נרצה להציג את עמודת הפעולות, נוכל להגדיר showActions כ-false
}


export const Table = <T extends Record<string, any>>({
  columns,
  data,
  className,
  dir,
  "data-testid": testId,
  onUpdate,
  onDelete,
  renderActions,
  showActions = true, // ✅ ברירת מחדל: כן להציג את העמודה
}: TableProps<T>) => {
  const { theme } = useTheme();
  const effectiveDir = dir || theme.direction;

  return (
    <div dir={effectiveDir} data-testid={testId} className={clsx("overflow-x-auto", className)} role="region"               // <-- Agregado para accesibilidad: define una región del documento.
      aria-label="Table data" >
      {/* //בודק את הכיוון את הבדיקות ואת הרספונסיביות  */}
      <table
        className={clsx(
          "min-w-full table-auto border border-gray-300 rounded text-sm",
          effectiveDir === "rtl" ? "text-right" : "text-left"
        )}
        style={{
          tableLayout: "fixed", // Makes sure the table layout is fixed
          fontFamily:
            effectiveDir === "rtl"
              ? theme.typography.fontFamily.hebrew
              : theme.typography.fontFamily.latin,
        }}
      >
        <thead className="bg-gray-100">
          <tr>
            {/* //col=כל עמודה idx=האינדקס של כל עמודה  */}
            {columns.map((col, idx) => (
              // הוא משתמש בMAP כדי שנוכל לגשת לכל אלמנט עם האינדקסים אנחנו יודעים איפה הם נמצאים 
              <th
                key={idx}
                scope="col" //מגדיר את זה בראש הטבלה 
                className={clsx(
                  "border px-4 py-2 font-semibold"
                  // , idx > 1 ? "hidden md:table-cell" : ""
                )}
              >
                {/* //מגדירים לכל אאינדקסים KEY מיוחד כדי שנדע על איזה אלמנט אנחנו מדברים  */}
                {col.header}
                {/* //כל COL.HEADER זה TH אחד  */}
              </th>
            ))}

            {/* //כאן מוסיפים עמודת פעולה חדשה */}
            {showActions && (
              <th
                scope="col" //כותרת לעמודת הפעולות
                className="border px-4 py-2 font-semibold text-center"
              >
                Actions
                {/* //כותרת לעמודת הכפתורים */}
              </th>
            )}
          </tr>


        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="border px-4 py-2">
                  {col.render
                    ? col.render(row[col.accessor], row)
                    : String(row[col.accessor] ?? '—')
                  }
                </td>
                // {/* //ניגש לכל מה שכתוב בעמודות לדוג אם ACCESOR=NAME אז מדפיס לי ROW[NAME] */}
              ))}
              {showActions && (
                // אם showActions הוא true, אז נציג את עמודת הפעולות
                <td className="border-t px-4 py-2 flex gap-2 justify-center">
                  {typeof renderActions === "function" && renderActions(row)}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="hover:scale-105 hover:brightness-110 transition"
                    onClick={() => onUpdate && onUpdate(row)}
                    aria-label="Update"
                    title="Update"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="accent"
                    size="sm"
                    className="hover:scale-105 hover:brightness-125 transition"
                    onClick={() => onDelete && onDelete(row)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash size={16} />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
