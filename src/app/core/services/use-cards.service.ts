import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UseCard } from '../models/use-card';

export type CreateUseCard = Omit<UseCard, 'id' | 'sortOrder'> & { sortOrder?: number };
export type UpdateUseCard = Partial<Omit<UseCard, 'id'>>;

@Injectable({ providedIn: 'root' })
export class UseCardsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/use-cards`;
  private readonly options = { withCredentials: true };

  list(): Observable<UseCard[]> {
    return this.http.get<UseCard[]>(`${this.endpoint}/admin`, this.options);
  }

  create(dto: CreateUseCard): Observable<UseCard> {
    return this.http.post<UseCard>(this.endpoint, dto, this.options);
  }

  update(id: number, dto: UpdateUseCard): Observable<UseCard> {
    return this.http.patch<UseCard>(`${this.endpoint}/${id}`, dto, this.options);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, this.options);
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/reorder`, { ids }, this.options);
  }
}
