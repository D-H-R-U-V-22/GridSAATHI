import { useSessionStore } from '../store/useSessionStore';
import { getDictionary, Language } from '../config/i18n';
import { TranslationKey } from '../config/i18n/en';

export function useTranslation() {
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const dict = getDictionary(language);

  const t = (key: TranslationKey): string => {
    return dict[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return { t, language, setLanguage, toggleLanguage, dict };
}
