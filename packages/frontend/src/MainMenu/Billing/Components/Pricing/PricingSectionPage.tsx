import React, { useState, useEffect, useCallback } from 'react';
import WorkspacePricingForm from './WorkspacePricingForm';
import MeetingRoomPricingForm from './MeetingRoomPricingForm';
import LoungePricingForm from './LoungePricingForm';
import { WorkspaceType } from 'shared-types';
import { Button } from '../../../../Common/Components/BaseComponents/Button';
import { InputField } from '../../../../Common/Components/BaseComponents/Input';
import { SelectField } from '../../../../Common/Components/BaseComponents/Select';
import Swal from 'sweetalert2';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import clsx from 'clsx';
import { useTheme } from '../../../../Common/Components/themeConfig';
import { useAuthStore } from '../../../../Stores/CoreAndIntegration/useAuthStore';
import axios from 'axios';
const urll = process.env.REACT_APP_API_URL ;

interface Props {
  type: 'workspace' | 'meeting-room' | 'lounge';
}

interface FormInputs {
  workspaceType: WorkspaceType;
  effectiveDate: string;
}

const typeLabels: Record<Props['type'], string> = {
  workspace: 'סביבת עבודה',
  'meeting-room': 'חדרי ישיבות',
  lounge: "לאונג'",
};

const workspaceOptions = [
  { value: 'OPEN_SPACE', label: 'אופן ספייס' },
  { value: 'KLIKAH_CARD', label: 'כרטיס קליקה' },
  { value: 'PRIVATE_ROOM1', label: 'חדר פרטי 1' },
  { value: 'PRIVATE_ROOM2', label: 'חדר פרטי 2' },
  { value: 'PRIVATE_ROOM3', label: 'חדר פרטי 3' },
  { value: 'DESK_IN_ROOM', label: 'שולחן בחדר' },
];

const PricingSectionPage: React.FC<Props> = ({ type }) => {
  // ---------------------------
  // מצב ניהול סקשנים (tabs) בעמוד:
  // current - מחיר נוכחי
  // create - יצירת מחיר חדש
  // edit - עדכון או מחיקת מחיר קיים
  // history - היסטוריית מחירים
  // ---------------------------
  const [section, setSection] = useState<'current' | 'create' | 'edit' | 'history'>('current');

  // מצבים כלליים
  const [loading, setLoading] = useState(false); // טעינה בשרת
  const [error, setError] = useState<string | null>(null); // הודעות שגיאה כלליות
  const [currentPrice, setCurrentPrice] = useState<any>(null); // מחיר נוכחי שמוצג ב-current
  const [historyPrices, setHistoryPrices] = useState<any[]>([]); // רשימת מחירים מההיסטוריה
  const [selectedEffectiveDate, setSelectedEffectiveDate] = useState<string>(''); // תאריך שנבחר בעדכון/מחיקה
  const [selectedPriceData, setSelectedPriceData] = useState<any | null>(null); // נתוני המחיר שנבחר לעדכון/מחיקה

  // יצירת form עם react-hook-form
  const methods = useForm<FormInputs>({
    defaultValues: {
      workspaceType: workspaceOptions[0].value as WorkspaceType,
      effectiveDate: '',
    },
  });

  // משתנים לצפייה בשינויים ב-value של השדות
  const watchedEffectiveDate = methods.watch('effectiveDate');
  const watchedWorkspaceType = methods.watch('workspaceType');

  // קבלת פרטי המשתמש מה-store לצורך הרשאות
  const { user } = useAuthStore();

  // בדיקה אם המשתמש הוא בעל הרשאה ניהולית
  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'MANAGER';

  // ---------------------------
  // פונקציה לטעינת היסטוריית מחירים לפי סוג המחיר (workspace/meeting-room/lounge)
  // משתמשת ב-useCallback כדי למנוע יצירת פונקציה חדשה בכל רינדור
  // מפעילה טעינה ומעדכנת סטייט של היסטוריית מחירים
  // ---------------------------
  const fetchHistoryPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    let url = '';

    switch (type) {
      case 'workspace':
        url = `${urll}/pricing/workspace/history/${watchedWorkspaceType}`;
        break;
      case 'meeting-room':
        url = `${urll}/pricing/meeting-room/history`;
        break;
      case 'lounge':
        url = `${urll}/pricing/lounge/history`;
        break;
    }

    try {
      const { data } = await axios.get(url, { withCredentials: true });
      setHistoryPrices(data);
    } catch (e: any) {
      setError('שגיאה בטעינת היסטוריה: ' + e.message);
      Swal.fire('שגיאה', 'שגיאה בטעינת היסטוריה: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [type, watchedWorkspaceType]);


  // ---------------------------
  // פונקציה לטעינת המחיר הנוכחי בהתאם לסוג המחיר
  // דומה לפונקציית ההיסטוריה אך מחזירה רק את המחיר העדכני ביותר
  // ---------------------------
  const fetchCurrentPrice = useCallback(async () => {
    setLoading(true);
    setError(null);
    let url = '';

    switch (type) {
      case 'workspace':
        url = `${urll}/pricing/workspace/current/${watchedWorkspaceType}`;
        break;
      case 'meeting-room':
        url = `${urll}/pricing/meeting-room/current`;
        break;
      case 'lounge':
        url = `${urll}/pricing/lounge/current`;
        break;
    }

    try {
      const { data } = await axios.get(url, { withCredentials: true });
      setCurrentPrice(data);
    } catch (e: any) {
      if (e.response?.status === 404) {
        setCurrentPrice(null);
      } else {
        setError('שגיאה בטעינת המחיר הנוכחי');
        Swal.fire('שגיאה', 'שגיאה בטעינת המחיר הנוכחי', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [type, watchedWorkspaceType]);

  // ---------------------------
  // useEffect שיעדכן את המחיר הנוכחי כאשר הסקשן הנוכחי הוא 'current'
  // ---------------------------
  useEffect(() => {
    if (section === 'current') {
      fetchCurrentPrice();
    } else {
      setCurrentPrice(null);
    }
  }, [section, fetchCurrentPrice]);

  // ---------------------------
  // useEffect שיעדכן את היסטוריית המחירים כאשר הסקשן 'history' או 'edit' נבחר
  // באותו הזמן מאפס שדות נבחרים בטופס
  // ---------------------------
  useEffect(() => {
    if (section === 'history' || section === 'edit') {
      fetchHistoryPrices();
      methods.setValue('effectiveDate', '');
      setSelectedEffectiveDate('');
      setSelectedPriceData(null);
    } else {
      setHistoryPrices([]);
    }
  }, [section, fetchHistoryPrices, methods]);

  // ---------------------------
  // עדכון התאריך שנבחר ע"י המשתמש בטופס
  // ---------------------------
  useEffect(() => {
    setSelectedEffectiveDate(watchedEffectiveDate);
  }, [watchedEffectiveDate]);

  // ---------------------------
  // כאשר משתנה התאריך שנבחר, מחפש במחירי ההיסטוריה את הנתונים התואמים לתאריך זה
  // ומעדכן את הנתונים שנבחרו לעריכה/מחיקה
  // ---------------------------
  useEffect(() => {
    if (selectedEffectiveDate && historyPrices.length > 0) {
      const foundPrice = historyPrices.find(
        (p: any) => p.effectiveDate?.slice(0, 10) === selectedEffectiveDate
      );
      setSelectedPriceData(foundPrice || null);
    } else {
      setSelectedPriceData(null);
    }
  }, [selectedEffectiveDate, historyPrices]);

  // ---------------------------
  // פונקציה למחיקת מחיר נבחר מההיסטוריה (רק למנהלים)
  // מבצעת בדיקות, אישור מחיקה, ושולחת בקשת DELETE לשרת
  // מעדכנת את הממשק בהתאם
  // ---------------------------
  const handleDelete = useCallback(async () => {
    if (!selectedPriceData || !selectedPriceData.id) {
      Swal.fire('שגיאה', 'יש לבחור תאריך תוקף קיים למחיקה.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'האם אתה בטוח?',
      text: `האם אתה בטוח שברצונך למחוק את תמחור מיום ${selectedPriceData.effectiveDate?.slice(0, 10)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'כן, מחק!',
      cancelButtonText: 'ביטול',
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    setError(null);
    let url = '';

    const recordIdToDelete = selectedPriceData.id;
    switch (type) {
      case 'workspace':
        url = `${urll}/pricing/workspace/${recordIdToDelete}`;
        break;
      case 'meeting-room':
        url = `${urll}/pricing/meeting-room/${recordIdToDelete}`;
        break;
      case 'lounge':
        url = `${urll}/pricing/lounge/${recordIdToDelete}`;
        break;
      default:
        Swal.fire('שגיאה', 'שגיאה: סוג מחיר לא נתמך למחיקה.', 'error');
        setLoading(false);
        return;
    }

    try {
      await axios.delete(url, { withCredentials: true });

      Swal.fire('נמחק!', 'התמחור נמחק בהצלחה!', 'success');
      setHistoryPrices((prev) => prev.filter((p) => p.id !== selectedPriceData.id));
      if (currentPrice?.id === selectedPriceData.id) setCurrentPrice(null);
      methods.setValue('effectiveDate', '');
      setSelectedEffectiveDate('');
      setSelectedPriceData(null);

      await fetchHistoryPrices();
      await fetchCurrentPrice();
      setSection('history');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'שגיאה במחיקת התמחור';
      setError(msg);
      Swal.fire('שגיאה', msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPriceData, type, currentPrice, methods, fetchHistoryPrices, fetchCurrentPrice]);

  // ---------------------------
  // פונקציה להצגת המחיר הנוכחי בהתאם לסוג המחיר
  // ---------------------------
  const renderCurrentPrice = () => {
    if (loading) return <div>טוען מחיר נוכחי...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!currentPrice) return <div>לא נמצא מחיר נוכחי.</div>;

    return (
      <div className="bg-white p-4 rounded-md shadow">
        <h4 className="font-semibold text-lg mb-2">
          פרטי מחיר נוכחי - {typeLabels[type]} (
          {watchedWorkspaceType.replace('_', ' ') || ''}):
        </h4>
        {type === 'workspace' && (
          <>
            <p><strong>מחיר שנה 1:</strong> {currentPrice.year1Price} ₪</p>
            <p><strong>מחיר שנה 2:</strong> {currentPrice.year2Price} ₪</p>
            <p><strong>מחיר שנה 3:</strong> {currentPrice.year3Price} ₪</p>
            <p><strong>מחיר שנה 4:</strong> {currentPrice.year4Price} ₪</p>
            <p><strong>מחיר יומיים מהמשרד:</strong> {currentPrice.twoDaysFromOfficePrice} ₪</p>
            <p><strong>מחיר שלושה ימים מהמשרד:</strong> {currentPrice.threeDaysFromOfficePrice} ₪</p>
          </>
        )}
        {type === 'meeting-room' && (
          <>
            <p><strong>מחיר לשעה:</strong> {currentPrice.hourlyRate} ₪</p>
            <p><strong>מחיר לשעה (הנחה):</strong> {currentPrice.discountedHourlyRate} ₪</p>
            <p><strong>שעות חינם בכרטיס קליקה:</strong> {currentPrice.freeHoursKlikahCard}</p>
          </>
        )}
        {type === 'lounge' && (
          <>
            <p><strong>מחיר ערב:</strong> {currentPrice.eveningRate} ₪</p>
            <p><strong>הנחה לחברים:</strong> {currentPrice.memberDiscountRate * 100}%</p>
          </>
        )}
        <p><strong>תאריך תחילה:</strong> {currentPrice.effectiveDate?.slice(0, 10)}</p>
      </div>
    );
  };

  // ---------------------------
  // פונקציה להצגת טבלה עם היסטוריית המחירים
  // מותאמת לסוג המחיר (workspace/meeting-room/lounge)
  // משתמשת בהגדרות נושא (theme) ליישור וטיפוגרפיה
  // ---------------------------
  const renderHistory = () => {
    if (loading) return <div>טוען היסטוריה...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!historyPrices || historyPrices.length === 0) return <div>לא נמצאה היסטוריה.</div>;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { theme } = useTheme();
    const effectiveDir = theme.direction;

    // כותרות עמודות בטבלה בהתאם לסוג המחיר
    let headers: string[] = ['תאריך תחילה'];
    if (type === 'workspace') {
      headers.push('שנה 1', 'שנה 2', 'שנה 3', 'שנה 4', 'יומיים מהמשרד', 'שלושה ימים מהמשרד');
    } else if (type === 'meeting-room') {
      headers.push('מחיר לשעה', 'מחיר לשעה (הנחה)', 'שעות חינם בכרטיס קליקה');
    } else if (type === 'lounge') {
      headers.push('מחיר ערב', 'הנחה לחברים (%)');
    }

    return (
      <div>
        <h3 className="font-bold mb-2 text-lg">היסטוריית תמחור {typeLabels[type]}:</h3>
        <div
          dir={effectiveDir}
          className={clsx('overflow-x-auto')}
          role="region"
          aria-label="History Table Data"
        >
          <table
            className={clsx(
              'min-w-full table-auto border border-gray-300 rounded text-sm',
              effectiveDir === 'rtl' ? 'text-right' : 'text-left'
            )}
            style={{
              fontFamily:
                effectiveDir === 'rtl'
                  ? theme.typography.fontFamily.hebrew
                  : theme.typography.fontFamily.latin,
            }}
          >
            <thead className="bg-gray-100">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    scope="col"
                    className={clsx(
                      'border px-4 py-2 font-semibold',
                      idx > 1 ? 'hidden md:table-cell' : ''
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historyPrices.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{row.effectiveDate?.slice(0, 10)}</td>
                  {type === 'workspace' && (
                    <>
                      <td className="border px-4 py-2">{row.year1Price}</td>
                      <td className="border px-4 py-2">{row.year2Price}</td>
                      <td className="border px-4 py-2">{row.year3Price}</td>
                      <td className="border px-4 py-2">{row.year4Price}</td>
                      <td className="border px-4 py-2">{row.twoDaysFromOfficePrice}</td>
                      <td className="border px-4 py-2">{row.threeDaysFromOfficePrice}</td>
                    </>
                  )}
                  {type === 'meeting-room' && (
                    <>
                      <td className="border px-4 py-2">{row.hourlyRate}</td>
                      <td className="border px-4 py-2">{row.discountedHourlyRate}</td>
                      <td className="border px-4 py-2">{row.freeHoursKlikahCard}</td>
                    </>
                  )}
                  {type === 'lounge' && (
                    <>
                      <td className="border px-4 py-2">{row.eveningRate}</td>
                      <td className="border px-4 py-2">{row.memberDiscountRate * 100}%</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---------------------------
  // בדיקה שהערך של workspaceType תקין ונמצא בערכי enum של WorkspaceType
  // אם לא, מגדירים אותו כברירת מחדל ל-PRIVATE_ROOM
  // ---------------------------
  const workspaceTypeEnum: WorkspaceType = Object.values(WorkspaceType).includes(
    watchedWorkspaceType as WorkspaceType
  )
    ? (watchedWorkspaceType as WorkspaceType)
    : WorkspaceType.PRIVATE_ROOM1;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        ניהול תמחור: {typeLabels[type]}
      </h2>

      {/* מספקים את ה-context של react-hook-form לכל הטפסים */}
      <FormProvider {...methods}>
        {/* בחירת סוג סביבת עבודה - רק ל-type = workspace */}
        {type === 'workspace' && (
          <div className="mb-6 flex items-center gap-3 bg-gray-50 p-3 rounded-md shadow-sm">
            <label htmlFor="workspaceType" className="font-semibold text-gray-700">
              סוג סביבת עבודה:
            </label>
            <Controller
              name="workspaceType"
              control={methods.control}
              render={({ field }) => (
                <SelectField {...field} options={workspaceOptions} label="" />
              )}
            />
          </div>
        )}

        {/* כפתורי ניווט בין סקשנים */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          <Button
            variant={section === 'current' ? 'primary' : 'secondary'}
            onClick={() => setSection('current')}
          >
            מחיר נוכחי
          </Button>
          <Button
            variant={section === 'create' ? 'primary' : 'secondary'}
            onClick={() => setSection('create')}
          >
            יצירת מחיר חדש
          </Button>
          <Button
            variant={section === 'edit' ? 'primary' : 'secondary'}
            onClick={() => setSection('edit')}
          >
            עדכון/מחיקת מחיר
          </Button>
          <Button
            variant={section === 'history' ? 'primary' : 'secondary'}
            onClick={() => setSection('history')}
          >
            היסטוריית מחירים
          </Button>
        </div>

        {/* תוכן הסקשן הנבחר */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 min-h-[300px] flex flex-col justify-center items-center">
          {loading && <div className="text-blue-600 text-lg">טוען נתונים...</div>}
          {error && <div className="text-red-600 text-lg">{error}</div>}

          {!loading && !error && (
            <>
              {section === 'current' && renderCurrentPrice()}

              {section === 'create' && isAdmin && (
                <>
                  <h3 className="font-bold mb-4 text-lg text-gray-700">יצירת מחיר חדש:</h3>
                  {type === 'workspace' ? (
                    <WorkspacePricingForm
                      workspaceType={workspaceTypeEnum}
                      onSuccess={() => {
                        setSection('history');
                        fetchHistoryPrices();
                        fetchCurrentPrice();
                      }}
                    />
                  ) : type === 'meeting-room' ? (
                    <MeetingRoomPricingForm
                      onSuccess={() => {
                        setSection('history');
                        fetchHistoryPrices();
                        fetchCurrentPrice();
                      }}
                    />
                  ) : (
                    <LoungePricingForm
                      onSuccess={() => {
                        setSection('history');
                        fetchHistoryPrices();
                        fetchCurrentPrice();
                      }}
                    />
                  )}
                </>
              )}
              {section === 'create' && !isAdmin && (
                <div className="text-red-500 font-bold text-center">
                  רק מנהל יכול ליצור תמחור חדש.
                </div>
              )}

              {section === 'edit' && isAdmin && (
                <>
                  {/* בחירת תאריך לעדכון או מחיקה */}
                  <div className="mb-4 flex items-center gap-2 bg-gray-100 p-3 rounded-md shadow-sm">
                    <label htmlFor="effectiveDate" className="font-bold text-gray-700">
                      בחר תאריך לתחילת תוקף (עדכון/מחיקה):
                    </label>
                    <Controller
                      name="effectiveDate"
                      control={methods.control}
                      render={({ field }) => (
                        <InputField {...field} type="date" label="תאריך תוקף" />
                      )}
                    />
                    <Button
                      variant="accent"
                      onClick={handleDelete}
                      disabled={!selectedEffectiveDate || !selectedPriceData || loading}
                    >
                      {loading ? 'מוחק...' : 'מחק מחיר'}
                    </Button>
                  </div>

                  {/* טופס עדכון מחירים אם יש נתונים */}
                  {selectedEffectiveDate && selectedPriceData && (
                    <>
                      <h3 className="font-bold mb-4 text-lg text-gray-700">
                        עריכת מחיר מתאריך {selectedEffectiveDate}:
                      </h3>
                      {type === 'workspace' ? (
                        <WorkspacePricingForm
                          workspaceType={workspaceTypeEnum}
                          initialData={selectedPriceData}
                          onSuccess={() => {
                            setSection('history');
                            fetchHistoryPrices();
                            fetchCurrentPrice();
                            methods.setValue('effectiveDate', '');
                            setSelectedPriceData(null);
                          }}
                        />
                      ) : type === 'meeting-room' ? (
                        <MeetingRoomPricingForm
                          initialData={selectedPriceData}
                          onSuccess={() => {
                            setSection('history');
                            fetchHistoryPrices();
                            fetchCurrentPrice();
                            methods.setValue('effectiveDate', '');
                            setSelectedPriceData(null);
                          }}
                        />
                      ) : (
                        <LoungePricingForm
                          initialData={selectedPriceData}
                          onSuccess={() => {
                            setSection('history');
                            fetchHistoryPrices();
                            fetchCurrentPrice();
                            methods.setValue('effectiveDate', '');
                            setSelectedPriceData(null);
                          }}
                        />
                      )}
                    </>
                  )}
                  {/* הודעה אם אין נתונים למחיר בתאריך שנבחר */}
                  {selectedEffectiveDate && !selectedPriceData && !loading && !error && (
                    <div className="text-yellow-600 font-semibold text-center mt-4">
                      לא נמצאו נתוני תמחור לתאריך זה. אנא ודא שהתאריך נכון.
                    </div>
                  )}
                </>
              )}
              {section === 'edit' && !isAdmin && (
                <div className="text-red-500 font-bold text-center">
                  רק מנהל יכול לעדכן או למחוק תמחור.
                </div>
              )}

              {section === 'history' && renderHistory()}
            </>
          )}
        </div>
      </FormProvider>
    </div>
  );
};

export default PricingSectionPage;