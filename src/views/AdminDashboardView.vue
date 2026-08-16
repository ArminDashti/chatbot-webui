<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchSummary, type SummaryStats } from '@/lib/auth'

const stats = ref<SummaryStats | null>(null)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    stats.value = await fetchSummary()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Load failed'
  }
})
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <h1 class="mb-4 text-xl font-semibold">Admin dashboard</h1>
    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <div v-if="stats" class="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent class="text-3xl font-semibold">{{ stats.users }}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Conversations</CardTitle></CardHeader>
        <CardContent class="text-3xl font-semibold">{{ stats.conversations }}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
        <CardContent class="text-3xl font-semibold">{{ stats.messages }}</CardContent>
      </Card>
    </div>
  </div>
</template>
