<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BadgeCheck, Lock, Save, Shield, User as UserIcon } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import { fetchMe, patchMe, type User } from '@/lib/auth'
import { useAuth } from '@/lib/useAuth'
import { t } from '@/lib/locale'

const { applySession, user } = useAuth()
const displayName = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const saved = ref(false)
const me = ref<User | null>(null)

onMounted(async () => {
  me.value = await fetchMe()
  displayName.value = me.value.display_name
})

async function onSave() {
  errorMessage.value = null
  saved.value = false
  try {
    const body: { display_name: string; password?: string } = { display_name: displayName.value }
    if (password.value) body.password = password.value
    const next = await patchMe(body)
    me.value = next
    const token = localStorage.getItem('chatbot-token')
    if (token) applySession(token, next)
    password.value = ''
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('saveFailed')
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card class="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="UserIcon">{{ t('profile') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground">
          <IconLabel :icon="UserIcon" icon-class="text-muted-foreground">{{ t('usernameLabel') }}</IconLabel>:
          {{ me?.username || user?.username }}
        </p>
        <p class="text-sm text-muted-foreground">
          <IconLabel :icon="Shield" icon-class="text-muted-foreground">{{ t('roleLabel') }}</IconLabel>:
          {{ me?.role || user?.role }}
        </p>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="BadgeCheck">{{ t('displayName') }}</IconLabel>
          <input v-model="displayName" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="Lock">{{ t('newPasswordOptional') }}</IconLabel>
          <input v-model="password" type="password" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-if="saved" class="text-sm text-green-600">{{ t('saved') }}</p>
        <Button @click="onSave">
          <IconLabel :icon="Save">{{ t('save') }}</IconLabel>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
