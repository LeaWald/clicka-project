import React, { useEffect } from 'react';
import { useLeadsStore } from "../../../../Stores/LeadAndCustomer/leadsStore";
import { ChartDisplay, ChartData } from '../../../../Common/Components/BaseComponents/Graph';
import { LeadSource } from 'shared-types';

const LeadSourcesPieChart = () => {
  const { leads, fetchLeads, loading } = useLeadsStore();
  
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);
  
  // תרגום מקורות לעברית
  const sourceLabels: Record<LeadSource, string> = {
    [LeadSource.WEBSITE]: 'אתר אינטרנט',
    [LeadSource.REFERRAL]: 'הפניה',
    [LeadSource.SOCIAL_MEDIA]: 'רשתות חברתיות',
    [LeadSource.EVENT]: 'אירוע',
    [LeadSource.PHONE]: 'טלפון',
    [LeadSource.WALK_IN]: 'הגעה ישירה',
    [LeadSource.EMAIL]: 'אימייל',
    [LeadSource.OTHER]: 'אחר'
  };
  
  const sourceCounts: { [key: string]: number } = leads.reduce((acc: { [key: string]: number }, lead) => {
    const sourceLabel = sourceLabels[lead.source] || lead.source;
    acc[sourceLabel] = (acc[sourceLabel] || 0) + 1;
    return acc;
  }, {});
  
  const totalCount = leads.length;
  const data: ChartData[] = Object.entries(sourceCounts).map(([source, count]) => ({
    label: source,
    value: totalCount > 0 ? (count / totalCount) * 100 : 0,
  }));
  
  const mostPopularSource = Object.entries(sourceCounts).reduce((prev, curr) => {
    return (curr[1] > prev[1]) ? curr : prev;
  }, ["", 0]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-slate-600">טוען נתוני מקורות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extralight text-slate-900 mb-4 tracking-wide">
            מקורות המתעניינים
          </h1>
          <div className="w-24 h-px bg-slate-300 mx-auto mb-6"></div>
          <p className="text-lg text-slate-600 font-light max-w-2xl mx-auto">
            ניתוח התפלגות מקורות המתעניינים ומגמות הגעה
          </p>
        </div>

        {/* Main Chart Card */}
        <div className="bg-white shadow-lg mb-8">
          <div className="p-12">
            <ChartDisplay type="pie" data={data} />
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="bg-white shadow-lg border-l-4 border-slate-900">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-2">{totalCount}</p>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">סה״כ מתעניינים</p>
            </div>
          </div>
          
          <div className="bg-white shadow-lg border-l-4 border-slate-700">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-2">{Object.keys(sourceCounts).length}</p>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">מקורות שונים</p>
            </div>
          </div>
          
          <div className="bg-white shadow-lg border-l-4 border-slate-500">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a9.014 9.014 0 012.916.52 6.003 6.003 0 01-4.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0A7.454 7.454 0 0112 13.5c-.97 0-1.912-.143-2.804-.4" />
                </svg>
              </div>
              <p className="text-3xl font-light text-slate-900 mb-2">
                {mostPopularSource[0] ? ((mostPopularSource[1] / totalCount) * 100).toFixed(0) + '%' : '0%'}
              </p>
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">מקור מוביל</p>
            </div>
          </div>
        </div>

        {/* Top Source Highlight */}
        {mostPopularSource[0] && (
          <div className="bg-white shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a9.014 9.014 0 012.916.52 6.003 6.003 0 01-4.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0A7.454 7.454 0 0112 13.5c-.97 0-1.912-.143-2.804-.4" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-2">המקור המוביל</h3>
              <p className="text-2xl font-light text-slate-900 mb-1">{mostPopularSource[0]}</p>
              <p className="text-slate-600 font-light">
                {mostPopularSource[1]} מתעניינים • {((mostPopularSource[1] / totalCount) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
        
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-slate-100 p-4 rounded-lg mb-8">
            <h4 className="font-medium mb-2">מידע לבדיקה:</h4>
            <p>סה״כ לידים: {leads.length}</p>
            <p>מקורות: {JSON.stringify(sourceCounts, null, 2)}</p>
          </div>
        )}
        
        {/* Empty State */}
        {totalCount === 0 && (
          <div className="bg-white shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">אין נתונים זמינים</h3>
            <p className="text-slate-600 font-light">עדיין לא נוספו מתעניינים למערכת</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadSourcesPieChart;