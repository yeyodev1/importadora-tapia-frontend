import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Iniciar sesión' },
  },
  {
    path: '/',
    component: () => import('../layout/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: 'Resumen' },
      },
      {
        path: 'clientes',
        name: 'Clientes',
        component: () => import('../views/ClientesView.vue'),
        meta: { title: 'Clientes' },
      },
      {
        path: 'clientes/:codigo',
        name: 'ClienteDetalle',
        component: () => import('../views/ClienteDetalleView.vue'),
        meta: { title: 'Cliente' },
      },
      {
        path: 'vendedores',
        name: 'Vendedores',
        component: () => import('../views/VendedoresView.vue'),
        meta: { title: 'Vendedores', adminOnly: true },
      },
      {
        path: 'inventario',
        name: 'Inventario',
        component: () => import('../views/InventarioView.vue'),
        meta: { title: 'Inventario' },
      },
      {
        path: 'cartera/facturas',
        name: 'CarteraFacturas',
        component: () => import('../views/CarteraFacturasView.vue'),
        meta: { title: 'Cartera · Facturas' },
      },
      {
        path: 'cartera/consolidada',
        name: 'CarteraConsolidada',
        component: () => import('../views/CarteraConsolidadaView.vue'),
        meta: { title: 'Cartera · Consolidada' },
      },
      {
        path: 'pedidos',
        name: 'Pedidos',
        component: () => import('../views/PedidosView.vue'),
        meta: { title: 'Pedidos' },
      },
      {
        path: 'cobros',
        name: 'Cobros',
        component: () => import('../views/CobrosView.vue'),
        meta: { title: 'Cobros' },
      },
      {
        path: 'me',
        name: 'Perfil',
        component: () => import('../views/PerfilView.vue'),
        meta: { title: 'Mi perfil' },
      },
      {
        path: 'equipo',
        name: 'Equipo',
        component: () => import('../views/EquipoView.vue'),
        meta: { title: 'Equipo', adminOnly: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('access_token')
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)

  if (requiresAuth && !hasToken) {
    return next({ path: '/login', replace: true })
  }

  if (to.path === '/login' && hasToken) {
    return next({ path: '/', replace: true })
  }

  const adminOnly = to.matched.some((record) => record.meta?.adminOnly)
  if (adminOnly && localStorage.getItem('user_role') !== 'admin') {
    return next({ path: '/', replace: true })
  }

  next()
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || 'Panel'
  document.title = `${title} · Importadora Tapia CRM`
})

export default router
