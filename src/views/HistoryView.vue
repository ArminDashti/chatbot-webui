<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchConversations, formatDateTime, type Conversation } from '@/lib/auth'

const router = useRouter()
const rows = ref<Conversation[]>([])
const query = ref('')
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    rows.value = await fetchConversations()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Load failed'
  }
})

function filtered() {
  const q = query.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => r.title.toLowerCase().includes(q))
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card>
      <CardHeader>
        <CardTitle>Your chat history</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <input
          v-model="query"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Search titles"
        />
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <button
          v-for="r in filtered()"
          :key="r.id"
          class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
          @click="router.push({ path: '/chat', query: { id: r.id } })"
        >
          <span class="truncate">{{ r.title }}</span>
          <span class="shrink-0 text-muted-foreground">{{ formatDateTime(r.updated_at) }}</span>
        </button>
        <p v-if="!filtered().length" class="text-sm text-muted-foreground">No chats.</p>
      </CardContent>
    </Card>
  </div>
</template>
