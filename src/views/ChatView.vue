<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { MessageSquare, Plus, Send, Square, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import {
  createConversation,
  deleteConversation,
  fetchChatReady,
  fetchConversation,
  fetchConversations,
  sendMessageStream,
  type ChatMessage,
  type Conversation,
} from '@/lib/auth'
import { useAuth } from '@/lib/useAuth'
import { textDirection } from '@/lib/textDirection'
import { t } from '@/lib/locale'

const route = useRoute()
const router = useRouter()
const { isAdmin } = useAuth()
const chatReady = ref(true)

const conversations = ref<Conversation[]>([])
const sidebarQuery = ref('')
const activeId = ref<string | null>(null)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const sending = ref(false)
const errorMessage = ref<string | null>(null)
const streamText = ref('')
const listEl = ref<HTMLElement | null>(null)
let abortStream: AbortController | null = null

function onStop() {
  abortStream?.abort()
}

async function loadList() {
  conversations.value = await fetchConversations(sidebarQuery.value)
}

async function onDeleteChat(id: string) {
  if (!window.confirm(t('deleteThisChat'))) return
  await deleteConversation(id)
  if (activeId.value === id) {
    activeId.value = null
    messages.value = []
    await router.replace({ path: '/chat' })
  }
  await loadList()
  if (!activeId.value && conversations.value[0]) {
    await openConversation(conversations.value[0].id)
  }
}

const threadDir = computed(() => {
  const firstUser = messages.value.find((m) => m.role === 'user')
  if (firstUser) return textDirection(firstUser.body)
  return textDirection(draft.value)
})

const composerDir = computed(() => {
  if (draft.value.trim()) return textDirection(draft.value)
  return threadDir.value
})

async function openConversation(id: string) {
  activeId.value = id
  const detail = await fetchConversation(id)
  messages.value = detail.messages
  streamText.value = ''
  await router.replace({ path: '/chat', query: { id } })
  await nextTick()
  scrollBottom()
}

async function onNewChat() {
  const conv = await createConversation()
  await loadList()
  await openConversation(conv.id)
}

function scrollBottom() {
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
}

async function onSend() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  errorMessage.value = null
  if (!activeId.value) {
    const conv = await createConversation(text)
    activeId.value = conv.id
    await loadList()
    await router.replace({ path: '/chat', query: { id: conv.id } })
  }
  const id = activeId.value
  if (!id) return
  draft.value = ''
  sending.value = true
  streamText.value = ''
  abortStream = new AbortController()
  const localUserId = `local-${crypto.randomUUID()}`
  messages.value = [
    ...messages.value,
    {
      id: localUserId,
      conversation_id: id,
      role: 'user',
      body: text,
      created_at: new Date().toISOString(),
    },
  ]
  void nextTick().then(scrollBottom)
  let pendingAssistantId: string | null = null

  const commitAssistant = (body: string, saved?: ChatMessage) => {
    const row: ChatMessage = saved ?? {
      id: pendingAssistantId ?? `pending-${crypto.randomUUID()}`,
      conversation_id: id,
      role: 'assistant',
      body,
      created_at: new Date().toISOString(),
    }
    const replaceId = pendingAssistantId
    pendingAssistantId = row.id
    const idx = messages.value.findIndex((m) => m.id === replaceId || m.id === row.id)
    if (idx >= 0) {
      messages.value = messages.value.map((m, i) => (i === idx ? row : m))
    } else {
      messages.value = [...messages.value, row]
    }
    streamText.value = ''
    void nextTick().then(scrollBottom)
  }

  try {
    await sendMessageStream(
      id,
      text,
      (ev) => {
      if (ev.type === 'user' && ev.message) {
        const withoutLocal = messages.value.filter((m) => m.id !== localUserId && m.id !== ev.message?.id)
        messages.value = [...withoutLocal, ev.message]
      }
      if (ev.type === 'delta' && ev.text) {
        streamText.value += ev.text
        void nextTick().then(scrollBottom)
      }
      if (ev.type === 'complete' && (ev.text || streamText.value)) {
        commitAssistant(ev.text || streamText.value)
      }
      if (ev.type === 'done' && ev.message) {
        commitAssistant(ev.message.body, ev.message)
      }
      if (ev.type === 'error') {
        errorMessage.value = ev.error ?? t('chatFailed')
      }
    }, abortStream.signal)
    if (streamText.value) {
      commitAssistant(streamText.value)
    }
    await loadList()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      errorMessage.value = null
    } else {
      errorMessage.value = err instanceof Error ? err.message : t('sendFailed')
    }
  } finally {
    abortStream = null
    sending.value = false
    await nextTick()
    scrollBottom()
  }
}

onMounted(async () => {
  try {
    chatReady.value = (await fetchChatReady()).ready
  } catch {
    chatReady.value = true
  }
  await loadList()
  const qid = typeof route.query.id === 'string' ? route.query.id : ''
  if (qid) {
    await openConversation(qid)
  } else if (conversations.value[0]) {
    await openConversation(conversations.value[0].id)
  }
})

watch(sidebarQuery, () => {
  void loadList()
})

watch(
  () => route.query.id,
  async (id) => {
    if (typeof id === 'string' && id && id !== activeId.value) {
      await openConversation(id)
    }
  },
)
</script>

<template>
  <div class="flex h-full min-h-0">
    <aside class="flex w-64 shrink-0 flex-col border-e bg-card/40">
      <div class="flex items-center justify-between gap-2 border-b px-3 py-3">
        <p class="text-sm font-medium">
          <IconLabel :icon="MessageSquare">{{ t('chats') }}</IconLabel>
        </p>
        <Button size="sm" @click="onNewChat">
          <IconLabel :icon="Plus">{{ t('newChat') }}</IconLabel>
        </Button>
      </div>
      <div class="border-b px-3 py-2">
        <input
          v-model="sidebarQuery"
          class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
          :placeholder="t('searchChats')"
        />
      </div>
      <div class="min-h-0 flex-1 overflow-auto">
        <div
          v-for="c in conversations"
          :key="c.id"
          class="flex items-stretch hover:bg-muted"
          :class="c.id === activeId ? 'bg-muted font-medium' : 'text-muted-foreground'"
        >
          <button class="min-w-0 flex-1 truncate px-3 py-2 text-start text-sm" @click="openConversation(c.id)">
            {{ c.title }}
          </button>
          <button
            class="shrink-0 px-2 text-xs text-muted-foreground hover:text-red-600"
            type="button"
            @click.stop="onDeleteChat(c.id)"
          >
            <IconLabel :icon="Trash2">{{ t('delete') }}</IconLabel>
          </button>
        </div>
        <p v-if="conversations.length === 0" class="px-3 py-6 text-sm text-muted-foreground">{{ t('noChatsYet') }}</p>
      </div>
    </aside>
    <section class="flex min-w-0 flex-1 flex-col">
      <div ref="listEl" class="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4" :dir="threadDir">
        <div
          v-for="m in messages"
          :key="m.id"
          class="flex"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm"
            :class="m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
            :dir="textDirection(m.body)"
          >
            {{ m.body }}
          </div>
        </div>
        <div v-if="streamText" class="flex justify-start">
          <div
            class="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-2 text-sm"
            :dir="textDirection(streamText)"
          >
            {{ streamText }}
          </div>
        </div>
        <div v-else-if="sending" class="flex justify-start">
          <div class="max-w-[80%] rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
            {{ t('waitingForReply') }}
          </div>
        </div>
        <p
          v-if="!chatReady && isAdmin"
          class="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
        >
          {{ t('noApiKey') }}
          <RouterLink class="underline" to="/admin/settings">{{ t('openSettings') }}</RouterLink>
          {{ t('pasteGatewayKey') }}
        </p>
        <p v-if="!messages.length && !streamText" class="pt-16 text-center text-sm text-muted-foreground">
          {{ t('emptyChatHint') }}
        </p>
      </div>
      <form class="border-t p-3" :dir="composerDir" @submit.prevent="onSend">
        <p v-if="errorMessage" class="mb-2 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        <div class="flex gap-2">
          <textarea
            v-model="draft"
            rows="2"
            class="min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            :dir="composerDir"
            :placeholder="t('messagePlaceholder')"
            @keydown.enter.exact.prevent="onSend"
          />
          <Button v-if="sending" type="button" variant="outline" @click="onStop">
            <IconLabel :icon="Square">{{ t('stop') }}</IconLabel>
          </Button>
          <Button v-else type="submit">
            <IconLabel :icon="Send" mirror-rtl>{{ t('send') }}</IconLabel>
          </Button>
        </div>
      </form>
    </section>
  </div>
</template>
