// components/LanguageSelector.tsx
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lang: string) => {
        console.log(lang);
        localStorage.setItem('language', lang);
        i18n.changeLanguage(lang);
    };

    return (
        <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language}>
            <option value="he">עברית</option>
            <option value="en">English</option>
        </select>
    );
};

export default LanguageSelector;