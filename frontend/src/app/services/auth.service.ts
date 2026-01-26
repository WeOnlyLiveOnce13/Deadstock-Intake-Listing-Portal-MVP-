import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import type { AuthResponse, User } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'pcrd_token';
  
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(this.getStoredToken());
  
  user = this._user.asReadonly();
  token = this._token.asReadonly();
  isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) {
    if (this._token()) {
      this.loadUserFromToken();
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromToken() {
    const token = this._token();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this._user.set({ id: payload.sub, email: payload.email });
    } catch {
      this.logout();
    }
  }

  signup(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/signup`, { email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  signin(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/signin`, { email, password }).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  private handleAuth(res: AuthResponse) {
    if (res.success) {
      localStorage.setItem(this.TOKEN_KEY, res.data.token);
      this._token.set(res.data.token);
      this._user.set(res.data.user);
    }
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
