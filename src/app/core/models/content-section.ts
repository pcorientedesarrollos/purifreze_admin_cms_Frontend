export interface ContentSection {
  id: number;
  key: string;
  label: string;
  title: string | null;
  description: string | null;
  content: Record<string, unknown> | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SectionDraft = ContentSection;

export type UpdateSection = Pick<
  ContentSection,
  'label' | 'title' | 'description' | 'content' | 'sortOrder' | 'isVisible'
>;

export interface CreateSection {
  key: string;
  label: string;
  title?: string;
  description?: string;
  content?: Record<string, unknown>;
  sortOrder?: number;
  isVisible?: boolean;
}
