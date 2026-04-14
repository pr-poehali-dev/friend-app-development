import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Lang, TKey, getSavedLang, saveLang, t as translate } from "./i18n";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const LangContext = createContext<LangContextType>({
  lang: "ru",
  setLang: () => {},
  t: (key) => translate(key, "ru"),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSavedLang);

  const setLang = useCallback((l: Lang) => {
    saveLang(l);
    setLangState(l);
  }, []);

  const t = useCallback((key: TKey) => translate(key, lang), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export default LangContext;
