<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { LayoutDashboard, MessageSquare, MessagesSquare, Users } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconLabel } from '@/components/ui/icon-label'
import { fetchSummary, type SummaryStats } from '@/lib/auth'
import { t } from '@/lib/locale'

const stats = ref<SummaryStats | null>(null)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    stats.value = await fetchSummary()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('loadFailed')
  }
})
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <h1 class="mb-4 text-xl font-semibold">
      <IconLabel :icon="LayoutDashboard">{{ t('adminDashboard') }}</IconLabel>
    </h1>
    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <div v-if="stats" class="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>
            <IconLabel :icon="Users">{{ t('users') }}</IconLabel>
          </CardTitle>
        </CardHeader>
        <CardContent class="text-3xl font-semibold">{{ stats.users }}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <IconLabel :icon="MessagesSquare">{{ t('conversations') }}</IconLabel>
          </CardTitle>
        </CardHeader>
        <CardContent class="text-3xl font-semibold">{{ stats.conversations }}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <IconLabel :icon="MessageSquare">{{ t('messages') }}</IconLabel>
          </CardTitle>
        </CardHeader>
        <CardContent class="text-3xl font-semibold">{{ stats.messages }}</CardContent>
      </Card>
    </div>
  </div>
</template>
