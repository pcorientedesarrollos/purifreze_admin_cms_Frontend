export interface SeoMetadata {
  id: number;
  entityType: string;
  entityId: string;
  metaTitle: string | null;
  metaDesc: string | null;
  keywords: string | null;
  ogTitle: string | null;
  ogDesc: string | null;
  ogImage: string | null;
  twitterCard: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  noFollow: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SaveSeoMetadata = Pick<
  SeoMetadata,
  'entityType' | 'entityId' | 'metaTitle' | 'metaDesc' | 'keywords' | 'ogTitle' | 'ogDesc' | 'ogImage' | 'twitterCard' | 'canonicalUrl' | 'noIndex' | 'noFollow'
>;
