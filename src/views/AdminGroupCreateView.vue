<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Tag, UserPlus, Users } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import { createGroup, fetchUsers, type User } from '@/lib/auth'
import { t } from '@/lib/locale'

const router = useRouter()
const name = ref('')
const users = ref<User[]>([])
const selected = ref<Record<string, boolean>>({})
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  users.value = await fetchUsers()
})

async function onCreate() {
  errorMessage.value = null
  const member_ids = Object.entries(selected.value)
    .filter(([, v]) => v)
    .map(([id]) => id)
  try {
    await createGroup(name.value.trim(), member_ids)
    await router.push('/admin/chat/group/rules')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('createFailed')
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card class="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="UserPlus">{{ t('createGroup') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="Tag">{{ t('name') }}</IconLabel>
          <input v-model="name" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <p class="text-sm font-medium">
          <IconLabel :icon="Users">{{ t('members') }}</IconLabel>
        </p>
        <label v-for="u in users" :key="u.id" class="flex items-center gap-2 text-sm">
          <input v-model="selected[u.id]" type="checkbox" />
          {{ u.username }} ({{ u.display_name || u.role }})
        </label>
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <Button :disabled="!name.trim()" @click="onCreate">
          <IconLabel :icon="Plus">{{ t('create') }}</IconLabel>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
