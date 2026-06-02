export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';
export type BlogBlock =
  | { id: string; type: 'paragraph'; data: { text: string } }
  | { id: string; type: 'heading'; data: { text: string; level: 2 | 3 } }
  | { id: string; type: 'list'; data: { items: string[] } }
  | { id: string; type: 'link'; data: { text: string; url: string } }
  | { id: string; type: 'image'; data: { url: string; alt: string } };

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  blocks: BlogBlock[];
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SaveBlogPost = Pick<BlogPost, 'title' | 'excerpt' | 'coverImageUrl' | 'blocks'>;
