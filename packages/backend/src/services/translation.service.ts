import { createClient } from '@supabase/supabase-js';
import { translateText } from '../utils/translate';
import { supportedLanguages } from 'shared-types';
import { TranslationModel } from '../models/TranslationRecord';


// יצירת לקוח Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// בדיקת תקינות שפה
function isLanguage(value: string): value is string {
    return supportedLanguages.includes(value as any);
}

// שירות התרגום
export class TranslationService {

    // פונקציה לקבלת תרגומים לפי מפתח
    async getByKey(key: string): Promise<TranslationModel[]> {
        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .eq('key', key);

        if (error) {
            console.error('Error fetching by key:', error);
            return [];
        }
        console.log(data);
        
        return data as TranslationModel[];
    }

    // פונקציה לקבלת תרגומים לפי שפה
    async getByLang(lang: string): Promise<TranslationModel[]> {

        const { data, error } = await supabase
            .from('translations')
            .select('*')
            .or(`en.eq.${lang},he.eq.${lang}`);

        if (error) {
            console.error('Error fetching by language:', error);
            return [];
        }
        console.log(data);
        return data as TranslationModel[];
    }

    // פונקציה ליצירת תרגומים עבור כל השפות החסרות
    async createWithTranslations(base: { key: string; text: string; lang: string }): Promise<TranslationModel[]> {
        const { key, text, lang } = base;

        // הבאת תרגומים קיימים
        const existing = await this.getByKey(key);
        const langsToTranslate = supportedLanguages.filter(l => l !== lang);
        if (existing.length > 0) {
            console.log('its exists already');
            return existing;
        }

        let translatedText = '';
        
        if (lang === 'en')
            translatedText = await translateText(text, lang, 'he');
        else
            translatedText = await translateText(text, lang, 'en');
        const newTranslations: TranslationModel[] = [];

        const alreadyExists = existing.find(e => e.en === translatedText || e.he === translatedText);
        let translation: TranslationModel = undefined!;
        if (!alreadyExists) {
            if (lang === 'en') {
                 translation = new TranslationModel(
                    key,
                    text,
                    translatedText,
                    new Date(),
                    new Date(),
                );

            }
            else {
                translation = new TranslationModel(
                    key,
                    translatedText,
                    text,
                    new Date(),
                    new Date(),
                );
            }
        };

        const selfExists = existing.find(e => e.en === lang || e.he === lang);

        const { error } = await supabase
            .from('translations')
            .insert([translation!.toDatabaseFormat()]);
        console.log('Inserting translations:', translation!.toDatabaseFormat());

        if (error) {
            console.error('Error inserting translations:', error);
            return [];
        }
        console.log(newTranslations);
        
        return translation ? [translation] : [];
    }
}

// יצוא השירות
export const translationService = new TranslationService();
