import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { resources } from "@/locale";

function setDocumentLanguage(language: string) {
  document.documentElement.lang = language;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ["de", "en", "es", "nl", "pl", "zh-Hans"],
    resources,
    fallbackLng: {
      "zh-CN": ["zh-Hans"],
      default: ["en"],
    },
  })
  .then(() => {
    setDocumentLanguage(i18n.language);
  });

i18n.on("languageChanged", setDocumentLanguage);
