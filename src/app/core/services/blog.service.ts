import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BlogPost, SaveBlogPost } from '../models/blog';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/blog/admin/posts`;
  private readonly options = { withCredentials: true };

  list(): Observable<BlogPost[]> { return this.http.get<BlogPost[]>(this.endpoint, this.options); }
  find(id: number): Observable<BlogPost> { return this.http.get<BlogPost>(`${this.endpoint}/${id}`, this.options); }
  create(post: SaveBlogPost): Observable<BlogPost> { return this.http.post<BlogPost>(this.endpoint, post, this.options); }
  update(id: number, post: SaveBlogPost): Observable<BlogPost> { return this.http.patch<BlogPost>(`${this.endpoint}/${id}`, post, this.options); }
  publish(id: number): Observable<BlogPost> { return this.http.post<BlogPost>(`${this.endpoint}/${id}/publish`, {}, this.options); }
  unpublish(id: number): Observable<BlogPost> { return this.http.post<BlogPost>(`${this.endpoint}/${id}/unpublish`, {}, this.options); }
}
