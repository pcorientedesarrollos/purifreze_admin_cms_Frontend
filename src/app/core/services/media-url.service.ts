import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaUrlService {
  resolve(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const origin = path.startsWith('/uploads') ? environment.apiUrl : environment.landingUrl;
  
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  uploadedFilename(path: string): string | null {
    const match = path.match(/^\/uploads\/videos\/([^/]+\.mp4)$/i);
    return match?.[1] ?? null;
  }
}
