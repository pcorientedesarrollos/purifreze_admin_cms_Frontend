export type UseCardType = 'text' | 'image' | 'video';

export interface UseCard {
  id: number;
  type: UseCardType;
  title: string;
  description: string | null;
  icon: string | null;
  mediaUrl: string | null;
  altText: string | null;
  isVisible: boolean;
  sortOrder: number;
}

export const useCardTypes: Array<{ value: UseCardType; label: string }> = [
  { value: 'text', label: 'Texto' },
  { value: 'image', label: 'Imagen' },
  { value: 'video', label: 'Video' },
];

export const useCardIcons = [
  { value: 'fa-home', label: 'Casa' },
  { value: 'fa-building', label: 'Negocio' },
  { value: 'fa-droplet', label: 'Agua' },
  { value: 'fa-faucet-drip', label: 'Purificador' },
  { value: 'fa-screwdriver-wrench', label: 'Instalación' },
  { value: 'fa-circle-play', label: 'Video' },
  { value: 'fa-glass-water', label: 'Vaso de agua' },
  { value: 'fa-kitchen-set', label: 'Cocina' },
  { value: 'fa-briefcase', label: 'Oficina' },
  { value: 'fa-heart-pulse', label: 'Salud' },
] as const;
