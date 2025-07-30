import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '../../../Common/Components/BaseComponents/Button';
import DownloadIcon from '@mui/icons-material/Download';

interface ExportToExcelProps {
    data: Array<Record<string, any>>;
    fileName: string;
}

export const ExportToExcel: React.FC<ExportToExcelProps> = ({ data, fileName }) => {
    const handleExport = () => {
        // המרת הנתונים לגיליון Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        // ייצוא לקובץ
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    return (
        <Button variant="primary" size="sm" onClick={handleExport}>
            <DownloadIcon />
            יצוא נתונים לאקסל
        </Button>
    );
};

