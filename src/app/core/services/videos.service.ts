import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CmsVideo, VideoPlacement } from '../models/video';

export type CreateVideo = Omit<CmsVideo, 'id' | 'sortOrder'> & { sortOrder?: number };
export type UpdateVideo = Partial<Omit<CmsVideo, 'id'>>;

@Injectable({ providedIn: 'root' })
export class VideosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/videos`;

  list(placement?: VideoPlacement): Observable<CmsVideo[]> {
    const options = placement ? { params: { placement } } : undefined;
    return this.http.get<CmsVideo[]>(this.endpoint, options);
  }

  create(dto: CreateVideo): Observable<CmsVideo> {
    return this.http.post<CmsVideo>(this.endpoint, dto, { withCredentials: true });
  }

  update(id: number, dto: UpdateVideo): Observable<CmsVideo> {
    return this.http.patch<CmsVideo>(`${this.endpoint}/${id}`, dto, { withCredentials: true });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, { withCredentials: true });
  }

  reorder(ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/reorder`, { ids }, { withCredentials: true });
  }
}
