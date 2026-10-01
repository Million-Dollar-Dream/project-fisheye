import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { makeI18n } from "./translate";
import { messagesFor } from "./messages";

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

// Translator and formatters for the current request.
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return makeI18n(locale, messagesFor(locale));
});
