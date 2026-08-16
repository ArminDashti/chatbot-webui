import { ref } from 'vue'
import { en, type MessageKey } from '@/i18n/en'
import { fa } from '@/i18n/fa'

export type Locale = 'en' | 'fa'

const LOCALE_KEY = 'chatbot-locale'

const dictionaries = { en, fa } as const

export const locale = ref<Locale>('en')

function browserLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('fa') ? 'fa' : 'en'
}

export function getLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'en' || stored === 'fa') return stored
  return browserLocale()
}

export function initLocale(): void {
  applyLocale(getLocale())
}

export function setLocale(next: Locale): void {
  localStorage.setItem(LOCALE_KEY, next)
  applyLocale(next)
}

function applyLocale(next: Locale): void {
  locale.value = next
  document.documentElement.lang = next
  document.documentElement.dir = next === 'fa' ? 'rtl' : 'ltr'
}

export function t(key: MessageKey, vars?: Record<string, string>): string {
  let text: string = dictionaries[locale.value][key] ?? en[key]
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value)
    }
  }
  return text
}

export function roleLabel(role: string): string {
  return role === 'admin' ? t('roleAdmin') : t('roleUser')
}
