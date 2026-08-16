<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchChatStats, type ChatStats } from '@/lib/auth'

const stats = ref<ChatStats | null>(null)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    stats.value = await fetchChatStats()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Load failed'
  }
})
</script>

<template>
  <div class="h-full space-y-4 overflow-auto p-4">
    <h1 class="text-xl font-semibold">Chat stats</h1>
    <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
    <Card v-if="stats">
      <CardHeader><CardTitle>By user</CardTitle></CardHeader>
      <CardContent>
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b text-muted-foreground">
              <th class="py-2">User</th>
              <th>Conversations</th>
              <th>Messages</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stats.by_user" :key="row.user_id" class="border-b">
              <td class="py-2">{{ row.username }}</td>
              <td>{{ row.conversations }}</td>
              <td>{{ row.messages }}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
    <Card v-if="stats">
      <CardHeader><CardTitle>By day (UTC)</CardTitle></CardHeader>
      <CardContent>
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b text-muted-foreground">
              <th class="py-2">Day</th>
              <th>Conversations</th>
              <th>Messages</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stats.by_day" :key="row.day" class="border-b">
              <td class="py-2">{{ row.day }}</td>
              <td>{{ row.conversations }}</td>
              <td>{{ row.messages }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!stats.by_day.length" class="text-sm text-muted-foreground">No messages yet.</p>
      </CardContent>
    </Card>
  </div>
</template>
