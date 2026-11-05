import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { FIREBASE_CONFIG } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth: Auth;

  /** Usuario con sesión iniciada (null si nadie ha entrado). */
  readonly usuario = signal<User | null>(null);

  /** Se resuelve cuando Firebase ya sabe si hay sesión o no (lo usan los guards). */
  readonly listo: Promise<void>;

  constructor() {
    const app = initializeApp(FIREBASE_CONFIG);
    // inMemoryPersistence: la sesión NO se guarda, así que cada vez que se abre la app
    // se pide iniciar sesión. Para recordar la sesión, cámbialo por indexedDBLocalPersistence.
    this.auth = initializeAuth(app, { persistence: inMemoryPersistence });

    this.listo = new Promise((resolve) => {
      onAuthStateChanged(this.auth, (u) => {
        this.usuario.set(u);
        resolve();
      });
    });
  }

  async entrar(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async registrar(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email.trim(), password);
  }

  async recuperar(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email.trim());
  }

  async salir(): Promise<void> {
    await signOut(this.auth);
  }

  /** Traduce los códigos de error de Firebase a mensajes para el usuario. */
  mensajeError(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    const mensajes: Record<string, string> = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos.',
      'auth/wrong-password': 'Correo o contraseña incorrectos.',
      'auth/user-not-found': 'No existe una cuenta con ese correo.',
      'auth/invalid-email': 'El correo no es válido.',
      'auth/missing-password': 'Escribe tu contraseña.',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a intentar.',
      'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
      'auth/operation-not-allowed': 'Activa "Correo/contraseña" en Firebase → Authentication.',
      'auth/invalid-api-key': 'Falta configurar Firebase (src/app/firebase.config.ts).',
      'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Falta configurar Firebase (src/app/firebase.config.ts).',
    };
    return mensajes[code] ?? 'No se pudo completar la operación. Intenta de nuevo.';
  }
}
