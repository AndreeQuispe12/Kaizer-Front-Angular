import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  email = '';
  password = '';
  error = signal<string | null>(null);
  submitting = signal(false);
  showEmailError = signal(false);
  showPasswordError = signal(false);

  async onSubmit() {
    this.showEmailError.set(!this.email);
    this.showPasswordError.set(this.password.length < 8);
    if (!this.email || this.password.length < 8) return;

    this.error.set(null);
    this.submitting.set(true);
    try {
      await this.auth.register(this.email, this.password);
      void this.router.navigate(['/'], { replaceUrl: true });
    } catch {
      this.error.set('No se pudo registrar el usuario');
    } finally {
      this.submitting.set(false);
    }
  }
}
