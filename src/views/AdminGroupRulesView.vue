<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Save, Shield } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import { fetchGroups, putGroupRule, type Group } from '@/lib/auth'
import { t } from '@/lib/locale'

const groups = ref<Group[]>([])
const selectedId = ref('')
const body = ref('')
const errorMessage = ref<string | null>(null)
const saved = ref(false)

onMounted(async () => {
  groups.value = await fetchGroups()
  if (groups.value[0]) {
    selectedId.value = groups.value[0].id
    body.value = groups.value[0].rule_body
  }
})

function onSelect() {
  const g = groups.value.find((x) => x.id === selectedId.value)
  body.value = g?.rule_body ?? ''
  saved.value = false
}

async function onSave() {
  if (!selectedId.value) return
  errorMessage.value = null
  saved.value = false
  try {
    await putGroupRule(selectedId.value, body.value)
    const g = groups.value.find((x) => x.id === selectedId.value)
    if (g) g.rule_body = body.value
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('saveFailed')
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card>
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="Shield">{{ t('groupRules') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <select
          v-model="selectedId"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          @change="onSelect"
        >
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <p v-if="!groups.length" class="text-sm text-muted-foreground">{{ t('createGroupFirst') }}</p>
        <textarea v-model="body" rows="12" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-if="saved" class="text-sm text-green-600">{{ t('saved') }}</p>
        <Button :disabled="!selectedId" @click="onSave">
          <IconLabel :icon="Save">{{ t('save') }}</IconLabel>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
