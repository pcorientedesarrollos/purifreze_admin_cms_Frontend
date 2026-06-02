import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminSession { id: number; username: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly session = signal<AdminSession | null>(null);

  login(username: string, password: string): Observable<AdminSession> {
    return this.http.post<AdminSession>(`${environment.apiUrl}/auth/login`, { username, password }, { withCredentials: true })
      .pipe(tap((session) => this.session.set(session)));
  }

  me(): Observable<AdminSession> {
    return this.http.get<AdminSession>(`${environment.apiUrl}/auth/me`, { withCredentials: true })
      .pipe(tap((session) => this.session.set(session)));
  }

  logout(): Observable<{ loggedOut: boolean }> {
    return this.http.post<{ loggedOut: boolean }>(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.session.set(null)));
  }
}
