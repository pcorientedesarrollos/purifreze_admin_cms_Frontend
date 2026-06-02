import { Routes } from '@angular/router';
import { SectionEditorPageComponent } from './sections/section-editor-page.component';
import { LoginPageComponent } from './auth/login-page.component';
import { authGuard } from './auth/auth.guard';
import { BlogEditorPageComponent } from './blog/blog-editor-page.component';
import { BlogListPageComponent } from './blog/blog-list-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: '', pathMatch: 'full', redirectTo: 'sections' },
  { path: 'sections', component: SectionEditorPageComponent, canActivate: [authGuard] },
  { path: 'sections/:key', component: SectionEditorPageComponent, canActivate: [authGuard] },
  { path: 'blog', component: BlogListPageComponent, canActivate: [authGuard] },
  { path: 'blog/:id', component: BlogEditorPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'sections' },
];
