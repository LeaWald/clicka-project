// translationLoader.ts
export function detectTextLanguage(text: string): 'he' | 'en' | 'mixed' | 'unknown' {
  const hebrewRegex = /[\u0590-\u05FF]/;
  const englishRegex = /[a-zA-Z]/;

  const hasHebrew = hebrewRegex.test(text);
  const hasEnglish = englishRegex.test(text);

  if (hasHebrew && !hasEnglish) return 'he';
  if (hasEnglish && !hasHebrew) return 'en';
  if (hasHebrew && hasEnglish) return 'mixed';

  return 'unknown';
}

export async function fetchTranslations(keys: string[], lang: string): Promise<Record<string, string>> {
  let lng = detectTextLanguage(keys[0]) === 'he' ? 'en' : 'he';
  if(lang !== 'he' && lng === 'he') {
    return {};
  }
  else if(lang !== 'en' && lng === 'en') {
    return {};
  }
  console.log(keys, lang);
  const url = `${process.env.REACT_APP_API_URL}/translate/locales/${lang}/common.json?keys=${keys.join(",")}`;

  const res = await fetch(url);
  if (!res.ok) console.log("Failed to fetch translations:", res.status, res.statusText);
  

  return await res.json();
}
