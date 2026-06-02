import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FaqItem } from '../models/faq';

export type CreateFaqItem = Omit<FaqItem, 'id' | 'sortOrder'> & { sortOrder?: number };
export type UpdateFaqItem = Partial<Omit<FaqItem, 'id'>>;

@Injectable({ providedIn: 'root' })
export class FaqItemsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/faq-items`;

  list(): Observable<FaqItem[]> {
    return this.http.get<FaqItem[]>(this.endpoint);
  }

  create(dto: CreateFaqItem): Observable<FaqItem> {
    return this.http.post<FaqItem>(this.endpoint, dto, { withCredentials: true });
  }

  update(id: number, dto: UpdateFaqItem): Observable<FaqItem> {
    return this.http.patch<FaqItem>(`${this.endpoint}/${id}`, dto, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, { withCredentials: true });
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/reorder`, { ids }, { withCredentials: true });
  }
}
