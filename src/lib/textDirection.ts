export type TextDirection = 'rtl' | 'ltr'

const persianOrArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

export function textDirection(text: string): TextDirection {
  return persianOrArabic.test(text) ? 'rtl' : 'ltr'
}
