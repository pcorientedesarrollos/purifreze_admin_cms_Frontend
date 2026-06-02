import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <main class="grid min-h-screen place-items-center bg-[#eef5fb] p-5">
      <section class="w-full max-w-md rounded-[2rem] border border-blue-100 bg-[#fbfdff] p-8 shadow-2xl shadow-blue-950/10">
        <p class="eyebrow">Purifreze content studio</p>
        <h1 class="mt-3 font-display text-4xl font-bold tracking-tight text-blue-950">Bienvenido de vuelta</h1>
        <p class="mt-3 text-sm leading-relaxed text-blue-950/55">Inicia sesión para editar la landing y publicar artículos.</p>
        <form class="mt-8 grid gap-4" (ngSubmit)="login()">
          <label class="field"><span>Usuario</span><input name="username" [(ngModel)]="username" autocomplete="username" required /></label>
          <label class="field"><span>Contraseña</span><input name="password" [(ngModel)]="password" type="password" autocomplete="current-password" required /></label>
          @if (error()) { <p class="text-sm font-bold text-red-600">{{ error() }}</p> }
          <button class="primary-button mt-2" type="submit" [disabled]="loading()">{{ loading() ? 'Entrando...' : 'Entrar' }}</button>
        </form>
      </section>
    </main>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  login(): void {
    if (!this.username || !this.password || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => void this.router.navigate(['/sections']),
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'No se pudo iniciar sesión.');
      },
    });
  }
}
