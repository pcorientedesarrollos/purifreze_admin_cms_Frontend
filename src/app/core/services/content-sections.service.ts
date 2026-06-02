import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContentSection, CreateSection, UpdateSection } from '../models/content-section';

@Injectable({ providedIn: 'root' })
export class ContentSectionsService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/content-sections`;

  list(): Observable<ContentSection[]> {
    return this.http.get<ContentSection[]>(this.endpoint);
  }

  create(section: CreateSection): Observable<ContentSection> {
    return this.http.post<ContentSection>(this.endpoint, section, { withCredentials: true });
  }

  update(key: string, section: UpdateSection): Observable<ContentSection> {
    return this.http.patch<ContentSection>(`${this.endpoint}/${encodeURIComponent(key)}`, section, { withCredentials: true });
  }
}
