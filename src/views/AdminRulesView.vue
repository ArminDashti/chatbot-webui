<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchGlobalRule, putGlobalRule } from '@/lib/auth'

const body = ref('')
const errorMessage = ref<string | null>(null)
const saved = ref(false)

onMounted(async () => {
  const data = await fetchGlobalRule()
  body.value = data.body
})

async function onSave() {
  errorMessage.value = null
  saved.value = false
  try {
    await putGlobalRule(body.value)
    saved.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Save failed'
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <Card>
      <CardHeader>
        <CardTitle>Global chat rule</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <textarea v-model="body" rows="12" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-if="saved" class="text-sm text-green-600">Saved.</p>
        <Button @click="onSave">Save</Button>
      </CardContent>
    </Card>
  </div>
</template>
