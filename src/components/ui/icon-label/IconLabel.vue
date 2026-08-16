<script setup lang="ts">
import type { Component } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    icon: Component
    class?: string
    iconClass?: string
    mirrorRtl?: boolean
  }>(),
  {
    class: '',
    iconClass: '',
    mirrorRtl: false,
  },
)
</script>

<template>
  <span :class="cn('inline-flex items-center gap-1.5', props.class)">
    <component
      :is="icon"
      :class="cn('h-4 w-4 shrink-0', mirrorRtl ? 'rtl:-scale-x-100' : '', iconClass)"
      :stroke-width="1.75"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>
