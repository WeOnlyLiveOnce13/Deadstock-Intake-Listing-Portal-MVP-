import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  isLogin = signal(true);
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  toggleMode() {
    this.isLogin.update(v => !v);
    this.error.set('');
    this.clearForm();
  }

  private clearForm() {
    this.email = '';
    this.password = '';
  }

  submit() {
    this.loading.set(true);
    this.error.set('');

    const action = this.isLogin()
      ? this.auth.signin(this.email, this.password)
      : this.auth.signup(this.email, this.password);

    action.subscribe({
      next: () => {
        this.clearForm();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.password = ''; // Clear password on error for security
        this.error.set(err.error?.message || err.error?.errors?.join(', ') || 'An error occurred');
      },
    });
  }
}
