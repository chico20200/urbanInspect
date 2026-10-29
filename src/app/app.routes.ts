import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Las 3 pestañas comparten la barra inferior
    path: 'tabs',
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
    loadComponent: () => import('./pages/detalle/detalle.page').then((m) => m.DetallePage),
  },
  {
    path: 'nueva',
    loadComponent: () => import('./pages/nueva/nueva.page').then((m) => m.NuevaPage),
  },
  { path: '', redirectTo: 'tabs/inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/inicio' },
];
