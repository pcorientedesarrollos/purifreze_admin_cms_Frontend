import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CmsTestimonial } from '../models/testimonial';

export type CreateTestimonial = Omit<CmsTestimonial, 'id' | 'sortOrder'> & { sortOrder?: number };
export type UpdateTestimonial = Partial<Omit<CmsTestimonial, 'id'>>;

@Injectable({ providedIn: 'root' })
export class TestimonialsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/testimonials`;

  list(): Observable<CmsTestimonial[]> {
    return this.http.get<CmsTestimonial[]>(this.endpoint);
  }

  create(dto: CreateTestimonial): Observable<CmsTestimonial> {
    return this.http.post<CmsTestimonial>(this.endpoint, dto, { withCredentials: true });
  }

  update(id: number, dto: UpdateTestimonial): Observable<CmsTestimonial> {
    return this.http.patch<CmsTestimonial>(`${this.endpoint}/${id}`, dto, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, { withCredentials: true });
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/reorder`, { ids }, { withCredentials: true });
  }
}
