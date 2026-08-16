<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/useAuth'
import { getTheme, toggleTheme, type Theme } from '@/lib/theme'

const router = useRouter()
const { isAuthenticated, isAdmin, logout } = useAuth()
const theme = ref<Theme>(getTheme())

const navLinkClass =
  'rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
const navLinkActiveClass = 'bg-muted text-foreground'

function syncTheme() {
  theme.value = getTheme()
}

function onLogout() {
  logout()
  void router.push('/login')
}

let themeObserver: MutationObserver | null = null

onMounted(() => {
  themeObserver = new MutationObserver(syncTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
})
</script>

<template>
  <div class="flex h-full w-full flex-col bg-background text-foreground">
    <header
      class="sticky top-0 z-40 flex shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur"
    >
      <nav class="flex min-w-0 flex-wrap items-center gap-1" aria-label="Main">
        <RouterLink to="/chat" class="mr-2 text-base font-semibold tracking-tight">Chatbot</RouterLink>
        <template v-if="isAuthenticated">
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/chat">Chat</RouterLink>
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/chats/history">History</RouterLink>
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/chat/users/profile">Profile</RouterLink>
          <template v-if="isAdmin">
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin">Admin</RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chats/history">All chats</RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chats/stats">Stats</RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chat/rules">Rules</RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chat/group/rules">Group rules</RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chat/group/create">Create group</RouterLink>
          </template>
        </template>
      </nav>
      <div class="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" @click="theme = toggleTheme()">
          {{ theme === 'dark' ? 'Light' : 'Dark' }}
        </Button>
        <Button v-if="isAuthenticated" variant="ghost" size="sm" @click="onLogout">Log out</Button>
        <RouterLink v-else to="/login">
          <Button variant="outline" size="sm">Log in</Button>
        </RouterLink>
      </div>
    </header>
    <main class="min-h-0 flex-1 overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
