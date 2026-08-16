<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import {
  BarChart3,
  History,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquare,
  MessagesSquare,
  Moon,
  Scale,
  Settings,
  Shield,
  Sun,
  User,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { IconLabel } from '@/components/ui/icon-label'
import LocaleSwitcher from '@/components/LocaleSwitcher.vue'
import { useAuth } from '@/lib/useAuth'
import { t } from '@/lib/locale'
import { getTheme, toggleTheme, type Theme } from '@/lib/theme'

const router = useRouter()
const { isAuthenticated, isAdmin, logout } = useAuth()
const theme = ref<Theme>(getTheme())

const navLinkClass =
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
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
      <nav class="flex min-w-0 flex-wrap items-center gap-1" :aria-label="t('navMain')">
        <RouterLink to="/chat" class="me-2 flex items-center" aria-label="Chatbot">
          <img src="/pwa-192.png" alt="" width="32" height="32" class="h-8 w-8 rounded-md" />
        </RouterLink>
        <template v-if="isAuthenticated">
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/chat">
            <IconLabel :icon="MessageSquare">{{ t('navChat') }}</IconLabel>
          </RouterLink>
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/chats/history">
            <IconLabel :icon="History">{{ t('navHistory') }}</IconLabel>
          </RouterLink>
          <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/chat/users/profile">
            <IconLabel :icon="User">{{ t('navProfile') }}</IconLabel>
          </RouterLink>
          <template v-if="isAdmin">
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin">
              <IconLabel :icon="LayoutDashboard">{{ t('navAdmin') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/users">
              <IconLabel :icon="Users">{{ t('navUsers') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/settings">
              <IconLabel :icon="Settings">{{ t('navSettings') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chats/history">
              <IconLabel :icon="MessagesSquare">{{ t('navAllChats') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chats/stats">
              <IconLabel :icon="BarChart3">{{ t('navStats') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chat/rules">
              <IconLabel :icon="Scale">{{ t('navRules') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chat/group/rules">
              <IconLabel :icon="Shield">{{ t('navGroupRules') }}</IconLabel>
            </RouterLink>
            <RouterLink :class="navLinkClass" :active-class="navLinkActiveClass" to="/admin/chat/group/create">
              <IconLabel :icon="UserPlus">{{ t('navCreateGroup') }}</IconLabel>
            </RouterLink>
          </template>
        </template>
      </nav>
      <div class="flex shrink-0 items-center gap-2">
        <LocaleSwitcher />
        <Button variant="outline" size="sm" @click="theme = toggleTheme()">
          <IconLabel v-if="theme === 'dark'" :icon="Sun">{{ t('themeLight') }}</IconLabel>
          <IconLabel v-else :icon="Moon">{{ t('themeDark') }}</IconLabel>
        </Button>
        <Button v-if="isAuthenticated" variant="ghost" size="sm" @click="onLogout">
          <IconLabel :icon="LogOut" mirror-rtl>{{ t('logOut') }}</IconLabel>
        </Button>
        <RouterLink v-else to="/login">
          <Button variant="outline" size="sm">
            <IconLabel :icon="LogIn" mirror-rtl>{{ t('logIn') }}</IconLabel>
          </Button>
        </RouterLink>
      </div>
    </header>
    <main class="min-h-0 flex-1 overflow-hidden">
      <RouterView />
    </main>
  </div>
</template>
