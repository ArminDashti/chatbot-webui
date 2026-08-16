import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import ChatView from '@/views/ChatView.vue'
import HistoryView from '@/views/HistoryView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import AdminHistoryView from '@/views/AdminHistoryView.vue'
import AdminStatsView from '@/views/AdminStatsView.vue'
import AdminRulesView from '@/views/AdminRulesView.vue'
import AdminGroupRulesView from '@/views/AdminGroupRulesView.vue'
import AdminGroupCreateView from '@/views/AdminGroupCreateView.vue'
import AdminSettingsView from '@/views/AdminSettingsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { getToken, getStoredUser } from '@/lib/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/chat' },
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/chat', name: 'chat', component: ChatView, meta: { requiresAuth: true } },
    { path: '/chats/history', name: 'history', component: HistoryView, meta: { requiresAuth: true } },
    { path: '/chat/users/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminDashboardView, meta: { requiresAuth: true, admin: true } },
    {
      path: '/admin/chats/history',
      name: 'admin-history',
      component: AdminHistoryView,
      meta: { requiresAuth: true, admin: true },
    },
    {
      path: '/admin/chats/stats',
      name: 'admin-stats',
      component: AdminStatsView,
      meta: { requiresAuth: true, admin: true },
    },
    {
      path: '/admin/chat/rules',
      name: 'admin-rules',
      component: AdminRulesView,
      meta: { requiresAuth: true, admin: true },
    },
    {
      path: '/admin/chat/group/rules',
      name: 'admin-group-rules',
      component: AdminGroupRulesView,
      meta: { requiresAuth: true, admin: true },
    },
    {
      path: '/admin/chat/group/create',
      name: 'admin-group-create',
      component: AdminGroupCreateView,
      meta: { requiresAuth: true, admin: true },
    },
    {
      path: '/admin/settings',
      name: 'admin-settings',
      component: AdminSettingsView,
      meta: { requiresAuth: true, admin: true },
    },
  ],
})

router.beforeEach((to) => {
  const token = getToken()
  const user = getStoredUser()
  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.admin && user?.role !== 'admin') {
    return { name: 'chat' }
  }
  if (to.meta.guest && token) {
    return { name: 'chat' }
  }
  return true
})

export default router
