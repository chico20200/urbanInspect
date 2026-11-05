import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ToastController,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/angular';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonText,
    IonSpinner,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toasts = inject(ToastController);

  /** false = iniciar sesión, true = crear cuenta */
  modoRegistro = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);

  form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  cambiarModo(): void {
    this.modoRegistro.update((v) => !v);
    this.error.set(null);
  }

  async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.cargando.set(true);
    this.error.set(null);
    try {
      if (this.modoRegistro()) {
        await this.auth.registrar(email, password);
      } else {
        await this.auth.entrar(email, password);
      }
      this.form.reset();
      // replaceUrl: el botón "atrás" no vuelve al login
      await this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    } catch (e) {
      this.error.set(this.auth.mensajeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  async recuperar(): Promise<void> {
    const email = this.form.controls.email;
    if (email.invalid) {
      email.markAsTouched();
      this.error.set('Escribe tu correo para enviarte el enlace de recuperación.');
      return;
    }
    try {
      await this.auth.recuperar(email.value);
      const t = await this.toasts.create({
        message: 'Te enviamos un correo para restablecer la contraseña.',
        duration: 3000,
        color: 'success',
      });
      await t.present();
    } catch (e) {
      this.error.set(this.auth.mensajeError(e));
    }
  }
}
