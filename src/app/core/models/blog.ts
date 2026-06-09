export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';
export type BlogBlock =
  | { id: string; type: 'paragraph'; data: { text: string } }
  | { id: string; type: 'heading'; data: { text: string; level: 2 | 3 } }
  | { id: string; type: 'list'; data: { items: string[] } }
  | { id: string; type: 'link'; data: { text: string; url: string } }
  | { id: string; type: 'image'; data: { url: string; alt: string } }
  | { id: string; type: 'quote'; data: { text: string } }
  | { id: string; type: 'callout'; data: { text: string } };

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  coverColor: string | null;
  coverIcon: string | null;
  coverSize: 'small' | 'medium' | 'large' | null;
  category: string | null;
  authorName: string | null;
  authorInitials: string | null;
  views: number;
  readMin: number | null;
  blocks: BlogBlock[];
  status: BlogPostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SaveBlogPost = Pick<BlogPost, 'title' | 'excerpt' | 'coverImageUrl' | 'coverColor' | 'coverIcon' | 'coverSize' | 'category' | 'authorName' | 'authorInitials' | 'blocks'>;
