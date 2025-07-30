// useTranslation.ts
import { useContext, useEffect, useState } from "react";
import { cacheTranslation, getCached } from "../../Stores/translationStore";
import { LangContext } from "./langContext";

export function useTranslation(requestedKeys: string[]) {
  const lang = useContext(LangContext); // ⬅️ שליפת שפה מהקונטקסט
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const { cached, missing } = getCached(lang, requestedKeys);

    setTranslations(cached); // מציג מיד מה שיש

    if (missing.length === 0) return;

    const url = `${process.env.REACT_APP_API_URL}/translate?lang=${lang}&keys=${missing.join(",")}`;

    fetch(url)
      .then(res => res.json())
      .then((data) => {
        cacheTranslation(lang, data);
        setTranslations(prev => ({ ...prev, ...data }));
      })
      .catch(err => {
        console.error("Translation error:", err);
      });
  }, [requestedKeys.join(","), lang]); // תלות גם בשפה

  return (key: string) => translations[key] || key;
}
