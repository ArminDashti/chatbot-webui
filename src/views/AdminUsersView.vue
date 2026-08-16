<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BadgeCheck, Lock, Pencil, Plus, Save, Shield, Trash2, User as UserIcon, UserPlus, Users, X } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import { createUser, deleteUser, fetchUsers, patchUser, type User } from '@/lib/auth'
import { roleLabel, t } from '@/lib/locale'

const users = ref<User[]>([])
const errorMessage = ref<string | null>(null)
const username = ref('')
const password = ref('')
const displayName = ref('')
const role = ref<'user' | 'admin'>('user')
const editingId = ref<string | null>(null)
const editUsername = ref('')
const editDisplayName = ref('')
const editRole = ref<'user' | 'admin'>('user')
const editPassword = ref('')

async function loadUsers() {
  users.value = await fetchUsers()
}

onMounted(async () => {
  try {
    await loadUsers()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('loadFailed')
  }
})

async function onCreate() {
  errorMessage.value = null
  try {
    await createUser({
      username: username.value.trim(),
      password: password.value,
      display_name: displayName.value.trim(),
      role: role.value,
    })
    username.value = ''
    password.value = ''
    displayName.value = ''
    role.value = 'user'
    await loadUsers()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('createFailed')
  }
}

function startEdit(user: User) {
  editingId.value = user.id
  editUsername.value = user.username
  editDisplayName.value = user.display_name
  editRole.value = user.role === 'admin' ? 'admin' : 'user'
  editPassword.value = ''
}

async function onSaveEdit() {
  if (!editingId.value) return
  errorMessage.value = null
  try {
    const body: { username: string; display_name: string; role: string; password?: string } = {
      username: editUsername.value.trim(),
      display_name: editDisplayName.value.trim(),
      role: editRole.value,
    }
    if (editPassword.value) body.password = editPassword.value
    await patchUser(editingId.value, body)
    editingId.value = null
    await loadUsers()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('updateFailed')
  }
}

async function onDelete(id: string) {
  if (!window.confirm(t('deleteThisUser'))) return
  errorMessage.value = null
  try {
    await deleteUser(id)
    if (editingId.value === id) editingId.value = null
    await loadUsers()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('deleteFailed')
  }
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <h1 class="mb-4 text-xl font-semibold">
      <IconLabel :icon="Users">{{ t('users') }}</IconLabel>
    </h1>
    <p v-if="errorMessage" class="mb-3 text-sm text-red-600">{{ errorMessage }}</p>
    <Card class="mb-4">
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="UserPlus">{{ t('createUser') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="grid gap-3 sm:grid-cols-2">
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="UserIcon">{{ t('username') }}</IconLabel>
          <input v-model="username" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="Lock">{{ t('password') }}</IconLabel>
          <input v-model="password" type="password" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="BadgeCheck">{{ t('displayName') }}</IconLabel>
          <input v-model="displayName" class="w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label class="block space-y-1 text-sm">
          <IconLabel :icon="Shield">{{ t('role') }}</IconLabel>
          <select v-model="role" class="w-full rounded-md border border-input bg-background px-3 py-2">
            <option value="user">{{ t('roleUser') }}</option>
            <option value="admin">{{ t('roleAdmin') }}</option>
          </select>
        </label>
        <div class="sm:col-span-2">
          <Button :disabled="!username.trim() || !password" @click="onCreate">
            <IconLabel :icon="Plus">{{ t('create') }}</IconLabel>
          </Button>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>
          <IconLabel :icon="Users">{{ t('allUsers') }}</IconLabel>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-for="u in users" :key="u.id" class="rounded-md border p-3 text-sm">
          <template v-if="editingId === u.id">
            <div class="grid gap-2 sm:grid-cols-2">
              <input v-model="editUsername" class="rounded-md border border-input bg-background px-3 py-2" />
              <input v-model="editDisplayName" class="rounded-md border border-input bg-background px-3 py-2" />
              <select v-model="editRole" class="rounded-md border border-input bg-background px-3 py-2">
                <option value="user">{{ t('roleUser') }}</option>
                <option value="admin">{{ t('roleAdmin') }}</option>
              </select>
              <input
                v-model="editPassword"
                type="password"
                class="rounded-md border border-input bg-background px-3 py-2"
                :placeholder="t('newPasswordOptional')"
              />
            </div>
            <div class="mt-2 flex gap-2">
              <Button size="sm" @click="onSaveEdit">
                <IconLabel :icon="Save">{{ t('save') }}</IconLabel>
              </Button>
              <Button size="sm" variant="outline" @click="editingId = null">
                <IconLabel :icon="X">{{ t('cancel') }}</IconLabel>
              </Button>
            </div>
          </template>
          <template v-else>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p>
                <span class="font-medium">{{ u.username }}</span>
                <span class="text-muted-foreground"> — {{ u.display_name || '—' }} ({{ roleLabel(u.role) }})</span>
              </p>
              <div class="flex gap-2">
                <Button size="sm" variant="outline" @click="startEdit(u)">
                  <IconLabel :icon="Pencil">{{ t('edit') }}</IconLabel>
                </Button>
                <Button size="sm" variant="outline" @click="onDelete(u.id)">
                  <IconLabel :icon="Trash2">{{ t('delete') }}</IconLabel>
                </Button>
              </div>
            </div>
          </template>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
