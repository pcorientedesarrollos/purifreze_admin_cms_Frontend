import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UploadedVideo } from '../models/video';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  upload(file: File): Observable<UploadedVideo> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<UploadedVideo>(`${environment.apiUrl}/media/videos`, body, { withCredentials: true });
  }

  remove(filename: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${environment.apiUrl}/media/videos/${encodeURIComponent(filename)}`,
      { withCredentials: true },
    );
  }

  uploadImage(file: File): Observable<UploadedVideo> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<UploadedVideo>(`${environment.apiUrl}/media/images`, body, { withCredentials: true });
  }
}
