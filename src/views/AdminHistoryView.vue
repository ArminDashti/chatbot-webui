<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Eye, MessagesSquare } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconLabel } from '@/components/ui/icon-label'
import {
  fetchAdminConversation,
  fetchAdminConversations,
  formatDateTime,
  type ChatMessage,
  type Conversation,
} from '@/lib/auth'
import { t } from '@/lib/locale'

const rows = ref<Conversation[]>([])
const query = ref('')
const selected = ref<Conversation | null>(null)
const messages = ref<ChatMessage[]>([])
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    rows.value = await fetchAdminConversations()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('loadFailed')
  }
})

function filtered() {
  const q = query.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(
    (r) => r.title.toLowerCase().includes(q) || (r.username ?? '').toLowerCase().includes(q),
  )
}

async function openRow(row: Conversation) {
  selected.value = row
  const detail = await fetchAdminConversation(row.id)
  messages.value = detail.messages
}
</script>

<template>
  <div class="flex h-full min-h-0 gap-3 overflow-hidden p-4">
    <Card class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="MessagesSquare">{{ t('allUserChats') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="min-h-0 flex-1 space-y-3 overflow-auto">
        <input
          v-model="query"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          :placeholder="t('searchUserOrTitle')"
        />
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <button
          v-for="r in filtered()"
          :key="r.id"
          class="flex w-full flex-col rounded-md border px-3 py-2 text-start text-sm hover:bg-muted"
          @click="openRow(r)"
        >
          <span class="font-medium">{{ r.title }}</span>
          <span class="text-muted-foreground">{{ r.username }} · {{ formatDateTime(r.updated_at) }}</span>
        </button>
      </CardContent>
    </Card>
    <Card class="flex w-[28rem] shrink-0 flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>
          <IconLabel v-if="!selected" :icon="Eye">{{ t('preview') }}</IconLabel>
          <template v-else>{{ selected.title }}</template>
        </CardTitle>
      </CardHeader>
      <CardContent class="min-h-0 flex-1 space-y-2 overflow-auto text-sm">
        <div v-for="m in messages" :key="m.id" class="rounded-md bg-muted px-3 py-2">
          <p class="text-xs uppercase text-muted-foreground">{{ m.role }}</p>
          <p class="whitespace-pre-wrap">{{ m.body }}</p>
        </div>
        <p v-if="!messages.length" class="text-muted-foreground">{{ t('selectAChat') }}</p>
      </CardContent>
    </Card>
  </div>
</template>
