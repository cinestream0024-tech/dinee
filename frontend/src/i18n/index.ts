import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en/common.json";
import fr from "../locales/fr/common.json";
import ar from "../locales/ar/common.json";
import es from "../locales/es/common.json";
import de from "../locales/de/common.json";
export const resources = { en: { common: en }, fr: { common: fr }, ar: { common: ar }, es: { common: es }, de: { common: de } } as const;
export const defaultNS = "common";
export const fallbackLng = "fr";
const saved = localStorage.getItem("i18nextLng");
i18n.use(initReactI18next).init({
  resources, lng: saved && saved in resources ? saved : "fr", fallbackLng, defaultNS, ns: ["common"],
  interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
});
export default i18n;
