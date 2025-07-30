import { useNavigate, useParams } from "react-router-dom";
import React, { useState } from "react";
import { Button } from '../../../../Common/Components/BaseComponents/Button';
import { Lead, LeadSource, LeadStatus, InteractionType , WorkspaceType } from "shared-types";

//אין צורך בעמוד זה כי בעריכה רואים את הפרטים...!!!!!!!

//יש לנו לינק שלוחצים על מתעניין מגיעים לדף הזה
export const DetailsOfTheLead = () => {
    const navigate = useNavigate();

    const { leadId } = useParams(); // מזהה המתעניין, אם יש צורך בו
    // דוגמה בלבד של מתעניין בודד צריך לעשות קריאת שרת לקבל את המתעניין או לקבל מהקומפוננטה הראשית
    const [currentLead, setCurrentLead] = useState<Lead>({
        id: leadId || '1',
        idNumber: "123456789",
        name: 'יוסי כהן',
        phone: '0501234567',
        email: 'yossi@example.com',
        businessType: 'סטארטאפ',
        interestedIn: WorkspaceType.BASE,
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
        contactDate: new Date().toISOString(), // תאריך יצירת הקשר
        followUpDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(), // תאריך מעקב לאחר שבוע
        notes: 'מתעניין בחדר פרטי ובשולחן בחדר',
        /* האינטרקציות יהיו כלינק לאינטרקציה ולא כך */

        interactions: [
            {
                id: '1', // מזהה ייחודי לאינטראקציה
                leadId: '1', // מזהה המתעניין
                type: InteractionType.EMAIL,
                date: new Date().toISOString(),
                notes: 'שלחתי מייל עם פרטים',
                userId: 'user123', // מזהה המשתמש שיצר את האינטראקציה
                userEmail: 'user@example.com',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const handleClick = () => {
        // פונקציה שתעביר אותי לדף רישום מתעניין עם המידע הנדרש
        navigate("interestedCustomerRegistration", { state: { data: currentLead } });
    };

    //הדף בנוי בצורת טופס ולכן אין כל כך מה להראות כאן בעצם אני אמורה למלא את הדף הזה בעת רישום מתעניין 
    //ומאז הוא מלא כל פעם שרוצים לראות את פרטי המתעניין 
    //הטופס שלי מכיל את כל הפרטים הנל כמובן שצריך לבדוק שהכל יהיה תקין..

    // <Button onClick={} variant="primary" size="sm" > אנטרקציה של המתעניין </Button>  
    //זה כפתור שמעביר אותי לאינטרקציות של המתעניין לא ברור עדיין אם צריך לכל מתעניין בנפרד או רק שיהיה את של כולם ביחד 
    return <div className="customer-page p-5">
        <h2 className="text-xl font-bold mb-4">פרטי המתעניין</h2>
        <Button onClick={handleClick} variant="primary" size="sm" >רישום מתעניין ללקוח</Button>
        <p><strong>שם:</strong> {currentLead.name}</p>
        <p><strong>טלפון:</strong> {currentLead.phone}</p>
        <p><strong>אימייל:</strong> {currentLead.email}</p>
        <p><strong>סוג עסק:</strong> {currentLead.businessType}</p>
        <p><strong>מעוניין ב:</strong> {currentLead.interestedIn}</p>
        <p><strong>מקור:</strong> {currentLead.source}</p>
        <p><strong>סטטוס:</strong> {currentLead.status}</p>
        {currentLead.contactDate && <p><strong>תאריך קשר:</strong> {new Date(currentLead.contactDate).toLocaleDateString()}</p>}
        {currentLead.followUpDate && <p><strong>תאריך מעקב:</strong> {new Date(currentLead.followUpDate).toLocaleDateString()}</p>}
        <p><strong>הערות:</strong> {currentLead.notes}</p>

        <h3>אינטראקציות:</h3>
        {/* האינטרקציות יהיו כלינק לאינטרקציה ולא כך */}
        <ul>
            {currentLead.interactions.map(interaction => (
                <li key={interaction.id}>
                    <p><strong>סוג:</strong> {interaction.type}</p>
                    <p><strong>תאריך:</strong> {new Date(interaction.date).toLocaleDateString()}</p>
                    <p><strong>הערות:</strong> {interaction.notes}</p>
                    <p><strong>נוצר על ידי:</strong> {interaction.userEmail}</p>
                </li>
            ))}
        </ul>
    </div>

}



