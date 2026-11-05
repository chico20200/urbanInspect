import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

// Nota: inject() debe llamarse ANTES del await (después se pierde el contexto de inyección).

/** Solo deja pasar si hay sesión; si no, manda al login. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.listo;
  return auth.usuario() ? true : router.createUrlTree(['/login']);
};

/** Para la pantalla de login: si ya hay sesión, manda directo al inicio. */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.listo;
  return auth.usuario() ? router.createUrlTree(['/tabs/inicio']) : true;
};
