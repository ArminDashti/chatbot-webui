<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  createConversation,
  fetchConversation,
  fetchConversations,
  sendMessageStream,
  type ChatMessage,
  type Conversation,
} from '@/lib/auth'

const route = useRoute()
const router = useRouter()

const conversations = ref<Conversation[]>([])
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
  conversations.value = await fetchConversations()
}

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
  try {
    await sendMessageStream(
      id,
      text,
      (ev) => {
      if (ev.type === 'user' && ev.message) {
        messages.value = [...messages.value, ev.message]
      }
      if (ev.type === 'delta' && ev.text) {
        streamText.value += ev.text
        void nextTick().then(scrollBottom)
      }
      if (ev.type === 'done' && ev.message) {
        messages.value = [...messages.value, ev.message]
        streamText.value = ''
      }
      if (ev.type === 'error') {
        errorMessage.value = ev.error ?? 'Chat failed'
      }
    }, abortStream.signal)
    await loadList()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      errorMessage.value = null
    } else {
      errorMessage.value = err instanceof Error ? err.message : 'Send failed'
    }
  } finally {
    abortStream = null
    sending.value = false
    await nextTick()
    scrollBottom()
  }
}

onMounted(async () => {
  await loadList()
  const qid = typeof route.query.id === 'string' ? route.query.id : ''
  if (qid) {
    await openConversation(qid)
  } else if (conversations.value[0]) {
    await openConversation(conversations.value[0].id)
  }
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
    <aside class="flex w-64 shrink-0 flex-col border-r bg-card/40">
      <div class="flex items-center justify-between gap-2 border-b px-3 py-3">
        <p class="text-sm font-medium">Chats</p>
        <Button size="sm" @click="onNewChat">New</Button>
      </div>
      <div class="min-h-0 flex-1 overflow-auto">
        <button
          v-for="c in conversations"
          :key="c.id"
          class="block w-full truncate px-3 py-2 text-left text-sm hover:bg-muted"
          :class="c.id === activeId ? 'bg-muted font-medium' : 'text-muted-foreground'"
          @click="openConversation(c.id)"
        >
          {{ c.title }}
        </button>
        <p v-if="conversations.length === 0" class="px-3 py-6 text-sm text-muted-foreground">No chats yet.</p>
      </div>
    </aside>
    <section class="flex min-w-0 flex-1 flex-col">
      <div ref="listEl" class="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        <div
          v-for="m in messages"
          :key="m.id"
          class="flex"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm"
            :class="m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
          >
            {{ m.body }}
          </div>
        </div>
        <div v-if="streamText" class="flex justify-start">
          <div class="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-2 text-sm">
            {{ streamText }}
          </div>
        </div>
        <p v-if="!messages.length && !streamText" class="pt-16 text-center text-sm text-muted-foreground">
          Ask anything. Company rules apply to every reply.
        </p>
      </div>
      <form class="border-t p-3" @submit.prevent="onSend">
        <p v-if="errorMessage" class="mb-2 text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        <div class="flex gap-2">
          <textarea
            v-model="draft"
            rows="2"
            class="min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Message"
            @keydown.enter.exact.prevent="onSend"
          />
          <Button v-if="sending" type="button" variant="outline" @click="onStop">Stop</Button>
          <Button v-else type="submit">Send</Button>
        </div>
      </form>
    </section>
  </div>
</template>
