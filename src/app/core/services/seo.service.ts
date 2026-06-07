import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SeoMetadata, SaveSeoMetadata } from '../models/seo';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seo`;

  findByEntity(entityType: string, entityId: string): Observable<SeoMetadata | null> {
    return this.http.get<SeoMetadata | null>(`${this.baseUrl}/${entityType}/${encodeURIComponent(entityId)}`);
  }

  findAllByType(entityType: string): Observable<SeoMetadata[]> {
    return this.http.get<SeoMetadata[]>(`${this.baseUrl}/${entityType}`);
  }

  upsert(data: SaveSeoMetadata): Observable<SeoMetadata> {
    return this.http.put<SeoMetadata>(this.baseUrl, data);
  }

  delete(entityType: string, entityId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${entityType}/${encodeURIComponent(entityId)}`);
  }
}
