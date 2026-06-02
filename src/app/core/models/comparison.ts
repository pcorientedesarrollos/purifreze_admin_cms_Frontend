export interface ComparisonBadge {
  id: string;
  feature: string;
  category: string;
  purifrezeText: string;
  garrafonesText: string;
  isVisible: boolean;
}

export const comparisonCategories = [
  { value: 'Costo', icon: 'fa-tag' },
  { value: 'Calidad', icon: 'fa-droplet' },
  { value: 'Comodidad', icon: 'fa-hand-sparkles' },
  { value: 'Salud', icon: 'fa-flask' },
  { value: 'Impacto', icon: 'fa-recycle' },
] as const;
