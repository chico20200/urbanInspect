import type { Routes } from '@angular/router';
import { authGuard, invitadoGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Login: primera pantalla al abrir la app (si ya hay sesión, salta al inicio)
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    // Las 3 pestañas comparten la barra inferior
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'incidencias',
        loadComponent: () =>
          import('./pages/incidencias/incidencias.page').then((m) => m.IncidenciasPage),
      },
      {
        path: 'seguimiento',
        loadComponent: () =>
          import('./pages/seguimiento/seguimiento.page').then((m) => m.SeguimientoPage),
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  // Pantallas fuera de las pestañas (se abren encima, con botón atrás)
  {
    path: 'incidencia/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/detalle/detalle.page').then((m) => m.DetallePage),
  },
  {
    path: 'nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/nueva/nueva.page').then((m) => m.NuevaPage),
  },
  { path: '', redirectTo: 'tabs/inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/inicio' },
];
