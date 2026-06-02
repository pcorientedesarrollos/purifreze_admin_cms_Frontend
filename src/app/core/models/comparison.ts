export interface ComparisonBadge {
  id: number;
  feature: string;
  category: string;
  purifrezeText: string;
  garrafonesText: string;
  isVisible: boolean;
  sortOrder: number;
}

export const comparisonCategories = [
  { value: 'Costo', icon: 'fa-tag' },
  { value: 'Calidad', icon: 'fa-droplet' },
  { value: 'Comodidad', icon: 'fa-hand-sparkles' },
  { value: 'Salud', icon: 'fa-flask' },
  { value: 'Impacto', icon: 'fa-recycle' },
] as const;
