<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchSettings, putSettings } from '@/lib/auth'

const baseUrl = ref('')
const model = ref('auto')
const apiKey = ref('')
const hint = ref('')
const keySet = ref(false)
const errorMessage = ref<string | null>(null)
const saved = ref(false)

onMounted(async () => {
  const data = await fetchSettings()
  baseUrl.value = data.chat_base_url
  model.value = data.chat_model
  hint.value = data.chat_api_key_hint
  keySet.value = data.chat_api_key_set
})

async function onSave() {
  errorMessage.value = null
  saved.value = false
  try {
    const body: {
      chat_base_url: string
      chat_model: string
      chat_api_key?: string
      clear_chat_api_key?: boolean
    } = {
      chat_base_url: baseUrl.value.trim(),
      chat_model: model.value.trim() || 'auto',
    }
    if (apiKey.value.trim()) {
      body.chat_api_key = apiKey.value.trim()
    }
    const data = await putSettings(body)
    hint.value = data.chat_api_key_hint
    keySet.value = data.chat_api_key_set
    apiKey.value = ''
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Save failed'
  }
}

async function onClearKey() {
  errorMessage.value = null
  saved.value = false
  try {
    const data = await putSettings({
      chat_base_url: baseUrl.value.trim(),
      chat_model: model.value.trim() || 'auto',
      clear_chat_api_key: true,
    })
    hint.value = data.chat_api_key_hint
    keySet.value = data.chat_api_key_set
    apiKey.value = ''
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Clear failed'
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card class="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Company chat gateway. Paste a cursor-api gateway key (<code class="text-xs">ck_…</code>). The full key is never shown again.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <label class="block space-y-1 text-sm">
          <span>Chat base URL</span>
          <input v-model="baseUrl" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <span>Model</span>
          <input v-model="model" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <p class="text-sm text-muted-foreground">
          Current key:
          <span v-if="keySet">{{ hint }}</span>
          <span v-else>not set</span>
        </p>
        <label class="block space-y-1 text-sm">
          <span>API key (leave blank to keep the current key)</span>
          <input
            v-model="apiKey"
            type="password"
            autocomplete="off"
            class="w-full rounded-md border border-input bg-background px-3 py-2"
            placeholder="ck_…"
          />
        </label>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-if="saved" class="text-sm text-green-600">Saved.</p>
        <div class="flex gap-2">
          <Button @click="onSave">Save</Button>
          <Button variant="outline" :disabled="!keySet" @click="onClearKey">Clear key</Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
