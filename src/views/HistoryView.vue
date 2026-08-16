<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { History, Trash2 } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import { deleteConversation, fetchConversations, formatDateTime, type Conversation } from '@/lib/auth'
import { t } from '@/lib/locale'

const router = useRouter()
const rows = ref<Conversation[]>([])
const query = ref('')
const errorMessage = ref<string | null>(null)

async function loadRows() {
  try {
    rows.value = await fetchConversations(query.value)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('loadFailed')
  }
}

onMounted(() => {
  void loadRows()
})

watch(query, () => {
  void loadRows()
})

async function onDelete(id: string) {
  if (!window.confirm(t('deleteThisChat'))) return
  errorMessage.value = null
  try {
    await deleteConversation(id)
    await loadRows()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('deleteFailed')
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card>
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="History">{{ t('historyTitle') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <input
          v-model="query"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          :placeholder="t('searchTitlesAndMessages')"
        />
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <div
          v-for="r in rows"
          :key="r.id"
          class="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <button
            class="flex min-w-0 flex-1 items-center justify-between text-start hover:underline"
            @click="router.push({ path: '/chat', query: { id: r.id } })"
          >
            <span class="truncate">{{ r.title }}</span>
            <span class="shrink-0 text-muted-foreground">{{ formatDateTime(r.updated_at) }}</span>
          </button>
          <Button variant="outline" size="sm" @click="onDelete(r.id)">
            <IconLabel :icon="Trash2">{{ t('delete') }}</IconLabel>
          </Button>
        </div>
        <p v-if="!rows.length" class="text-sm text-muted-foreground">{{ t('noChats') }}</p>
      </CardContent>
    </Card>
  </div>
</template>
