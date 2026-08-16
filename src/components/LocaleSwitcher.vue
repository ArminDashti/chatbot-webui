<script setup lang="ts">
import { Languages } from 'lucide-vue-next'
import { locale, setLocale, t } from '@/lib/locale'

const buttonClass =
  'rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
const activeClass = 'bg-muted text-foreground'
</script>

<template>
  <div class="inline-flex items-center gap-1.5">
    <Languages class="h-4 w-4 shrink-0 text-muted-foreground" :stroke-width="1.75" aria-hidden="true" />
    <div class="inline-flex items-center rounded-md border border-input p-0.5" role="group" :aria-label="t('language')">
      <button type="button" :class="[buttonClass, locale === 'en' ? activeClass : '']" @click="setLocale('en')">
        EN
      </button>
      <button type="button" :class="[buttonClass, locale === 'fa' ? activeClass : '']" @click="setLocale('fa')">
        فا
      </button>
    </div>
  </div>
</template>
