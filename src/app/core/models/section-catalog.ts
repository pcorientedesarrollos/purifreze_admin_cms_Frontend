import { VideoPlacement } from './video';

export type SectionEditorKind = 'comparison' | 'faq' | 'use-cards' | 'videos' | 'testimonials';

export interface SectionCatalogItem {
  key: string;
  label: string;
  title: string;
  description: string;
  icon: string;
  editor: SectionEditorKind;
  videoPlacement?: VideoPlacement;
}

export const sectionCatalog: SectionCatalogItem[] = [
  {
    key: 'testimonials',
    label: 'Testimonios',
    title: 'Lo que dicen nuestros clientes',
    description: 'Familias y empresas en Mérida que confían en Purifreze.',
    icon: 'fa-quote-left',
    editor: 'testimonials',
  },
  {
    key: 'uses',
    title: 'Usos del purificador de agua',
    label: 'Usos',
    description: 'Tarjetas dinámicas de texto, imagen y video para la sección Usos.',
    icon: 'fa-screwdriver-wrench',
    editor: 'use-cards',
  },
  {
    key: 'videos',
    label: 'Videos',
    title: 'La hidratación comienza desde el agua',
    description: 'Galería de videos de la landing.',
    icon: 'fa-circle-play',
    editor: 'videos',
    videoPlacement: 'gallery',
  },
  {
    key: 'comparison',
    label: 'Comparación detallada',
    title: 'Comparación detallada',
    description: 'Filas editables de Purifreze contra garrafones.',
    icon: 'fa-table-columns',
    editor: 'comparison',
  },
  {
    key: 'faq',
    label: 'Preguntas frecuentes',
    title: '¿Tienes preguntas?',
    description: 'Resuelve las dudas más comunes de tus clientes.',
    icon: 'fa-circle-question',
    editor: 'faq',
  },
];

export function sectionByKey(key: string): SectionCatalogItem | undefined {
  return sectionCatalog.find((section) => section.key === key);
}
