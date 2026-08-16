<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Cpu, FolderOpen, Key, KeyRound, Link as LinkIcon, Save, Settings } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import { fetchSettings, putSettings } from '@/lib/auth'
import { t } from '@/lib/locale'

const baseUrl = ref('')
const model = ref('auto')
const apiKey = ref('')
const hint = ref('')
const keySet = ref(false)
const keySource = ref('')
const guidePathsText = ref('')
const errorMessage = ref<string | null>(null)
const saved = ref(false)

const keyStatus = computed(() => {
  if (!keySet.value) return t('settingsKeyNotSet')
  if (keySource.value === 'settings') return t('settingsUsingSettingsKey', { hint: hint.value })
  if (keySource.value === 'env') {
    return t('settingsUsingEnvKey', { hint: hint.value })
  }
  return t('settingsKeyOnFile', { hint: hint.value })
})

function parseGuidePaths(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

function applySettings(data: Awaited<ReturnType<typeof fetchSettings>>) {
  baseUrl.value = data.chat_base_url
  model.value = data.chat_model
  hint.value = data.chat_api_key_hint
  keySet.value = data.chat_api_key_set
  keySource.value = data.chat_api_key_source ?? ''
  guidePathsText.value = (data.allowed_folders ?? []).join('\n')
}

onMounted(async () => {
  try {
    applySettings(await fetchSettings())
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('couldNotLoadSettings')
  }
})

async function onSave() {
  errorMessage.value = null
  saved.value = false
  try {
    const body: {
      chat_base_url: string
      chat_model: string
      chat_api_key?: string
      allowed_folders: string[]
    } = {
      chat_base_url: baseUrl.value.trim(),
      chat_model: model.value.trim() || 'auto',
      allowed_folders: parseGuidePaths(guidePathsText.value),
    }
    if (apiKey.value.trim()) {
      body.chat_api_key = apiKey.value.trim()
    }
    const data = await putSettings(body)
    applySettings(data)
    apiKey.value = ''
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('saveFailed')
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
      allowed_folders: parseGuidePaths(guidePathsText.value),
    })
    applySettings(data)
    apiKey.value = ''
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('clearFailed')
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card class="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="Settings">{{ t('settings') }}</IconLabel>
        </CardTitle>
        <CardDescription>
          {{ t('settingsHelp') }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm" :class="keySet ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400'">
          {{ keyStatus }}
        </p>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="Key">{{ t('apiKey') }}</IconLabel>
          <input
            v-model="apiKey"
            type="password"
            autocomplete="off"
            class="w-full rounded-md border border-input bg-background px-3 py-2"
            :placeholder="t('apiKeyPlaceholder')"
          />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="LinkIcon">{{ t('chatBaseUrl') }}</IconLabel>
          <input v-model="baseUrl" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="Cpu">{{ t('model') }}</IconLabel>
          <input v-model="model" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="FolderOpen">{{ t('guidePaths') }}</IconLabel>
          <p class="text-muted-foreground">{{ t('guidePathsHelp') }}</p>
          <textarea
            v-model="guidePathsText"
            rows="6"
            class="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            :placeholder="t('guidePathsPlaceholder')"
          />
        </label>
        <p v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
        <p v-if="saved" class="text-sm text-green-600">{{ t('settingsSaved') }}</p>
        <div class="flex gap-2">
          <Button @click="onSave">
            <IconLabel :icon="Save">{{ t('save') }}</IconLabel>
          </Button>
          <Button variant="outline" :disabled="keySource !== 'settings'" @click="onClearKey">
            <IconLabel :icon="KeyRound">{{ t('clearSettingsKey') }}</IconLabel>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
