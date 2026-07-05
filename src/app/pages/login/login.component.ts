import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BackendService } from '../../services/backend.service';

type Tab = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router  = inject(Router);
  private auth    = inject(AuthService);
  private backend = inject(BackendService);

  tab = signal<Tab>('login');

  // Login fields
  loginEmail    = '';
  loginPassword = '';

  // Register fields
  regDni      = '';
  regNombre   = '';
  regApellidos = '';
  regEmail    = '';
  regPassword = '';

  // State
  error      = signal<string | null>(null);
  submitting = signal(false);
  dniLoading = signal(false);
  dniFound   = signal(false);
  errors     = signal<Record<string, string>>({});

  setTab(t: Tab) {
    this.tab.set(t);
    this.error.set(null);
    this.errors.set({});
    this.dniFound.set(false);
    this.regDni = ''; this.regNombre = ''; this.regApellidos = '';
  }

  async onDniInput() {
    const dni = this.regDni.replace(/\D/g, '').slice(0, 8);
    this.regDni = dni;
    this.dniFound.set(false);
    if (dni.length === 8) {
      this.dniLoading.set(true);
      try {
        const res = await this.backend.lookupDocument(dni);
        const parts = res.nombre.split(' ');
        this.regNombre   = parts.slice(2).join(' ');
        this.regApellidos = parts.slice(0, 2).join(' ');
        this.dniFound.set(true);
        const e = { ...this.errors() }; delete e['dni']; this.errors.set(e);
      } catch {
        this.errors.set({ ...this.errors(), dni: 'DNI no encontrado' });
      } finally {
        this.dniLoading.set(false);
      }
    } else {
      if (!this.dniFound()) { this.regNombre = ''; this.regApellidos = ''; }
    }
  }

  async onLogin() {
    const e: Record<string, string> = {};
    if (!this.loginEmail)              e['email']    = 'Email requerido';
    if (this.loginPassword.length < 8) e['password'] = 'Mínimo 8 caracteres';
    if (Object.keys(e).length) { this.errors.set(e); return; }

    this.errors.set({});
    this.error.set(null);
    this.submitting.set(true);
    try {
      await this.auth.login(this.loginEmail, this.loginPassword);
      void this.router.navigate(['/'], { replaceUrl: true });
    } catch {
      this.error.set('Email o contraseña incorrectos');
    } finally {
      this.submitting.set(false);
    }
  }

  async onRegister() {
    const e: Record<string, string> = {};
    if (!this.regNombre.trim())      e['nombre']    = 'Nombre requerido';
    if (!this.regApellidos.trim())   e['apellidos'] = 'Apellidos requeridos';
    if (!this.regEmail)              e['email']     = 'Email requerido';
    if (this.regPassword.length < 8) e['password']  = 'Mínimo 8 caracteres';
    if (Object.keys(e).length) { this.errors.set(e); return; }

    this.errors.set({});
    this.error.set(null);
    this.submitting.set(true);
    try {
      await this.auth.register(this.regEmail, this.regPassword);
      const nombreCompleto = `${this.regNombre.trim()} ${this.regApellidos.trim()}`;
      try {
        await this.backend.updateProfile({ nombre: nombreCompleto });
        this.auth.setNombre(nombreCompleto);
      } catch { /* non-fatal */ }
      void this.router.navigate(['/'], { replaceUrl: true });
    } catch {
      this.error.set('No se pudo crear la cuenta. Intenta con otro email.');
    } finally {
      this.submitting.set(false);
    }
  }
}
