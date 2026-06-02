import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComparisonBadge } from '../models/comparison';

export type CreateComparisonRow = Omit<ComparisonBadge, 'id' | 'sortOrder'> & { sortOrder?: number };
export type UpdateComparisonRow = Partial<Omit<ComparisonBadge, 'id'>>;

@Injectable({ providedIn: 'root' })
export class ComparisonRowsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/comparison-rows`;

  list(): Observable<ComparisonBadge[]> {
    return this.http.get<ComparisonBadge[]>(this.endpoint);
  }

  create(dto: CreateComparisonRow): Observable<ComparisonBadge> {
    return this.http.post<ComparisonBadge>(this.endpoint, dto, { withCredentials: true });
  }

  update(id: number, dto: UpdateComparisonRow): Observable<ComparisonBadge> {
    return this.http.patch<ComparisonBadge>(`${this.endpoint}/${id}`, dto, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, { withCredentials: true });
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/reorder`, { ids }, { withCredentials: true });
  }
}
