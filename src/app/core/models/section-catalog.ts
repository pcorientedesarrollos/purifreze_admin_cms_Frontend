import { CreateSection } from './content-section';

export type SectionEditorKind = 'generic' | 'comparison' | 'faq' | 'videos' | 'testimonials';

export interface SectionCatalogItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  editor: SectionEditorKind;
  createSection: () => CreateSection;
}

export const sectionCatalog: SectionCatalogItem[] = [
  {
    key: 'faq',
    label: 'Preguntas frecuentes',
    description: 'Resuelve las dudas más comunes de tus clientes.',
    icon: 'fa-circle-question',
    editor: 'faq',
    createSection: () => ({
      key: 'faq',
      label: 'Preguntas frecuentes',
      title: '¿Tienes preguntas?',
      description: 'Nos comprometemos a hacer que su experiencia sea lo más fácil y sencilla posible.',
      content: {
        faqs: [
          {
            id: 'safer-than-jug',
            question: '¿Es más seguro que el garrafón?',
            answer:
              'El sistema ósmosis brinda la garantía de inocuidad, seguridad que es producida en el hogar, mantenimiento oportuno del sistema y todas su piezas, diferenciador del descalcificador que permite el sarro no se adhiere al sistema, al organismo ni a equipo y utensilios.',
            isVisible: true,
          },
          {
            id: 'monthly-cost',
            question: '¿Es costoso?',
            answer: 'La inversión es pago mensual y la mayoría de las veces menor al gasto se realiza en garrafones.',
            isVisible: true,
          },
          {
            id: 'installation-maintenance-cost',
            question: '¿Cuánto cuesta la instalación y mantenimientos?',
            answer: 'Está incluido en el pago de la mensualidad, no genera ningún pago adicional.',
            isVisible: true,
          },
          {
            id: 'installation',
            question: '¿Es complicada la instalación?',
            answer: 'No, solo requerimos toma agua, drenaje, contacto eléctrico. La instalación tiene duración aproximada de 2 a 3 hrs.',
            isVisible: true,
          },
          {
            id: 'contract',
            question: '¿Se firma contrato?',
            answer: 'Si, se firma contrato por 12 meses sin penalización siempre y cuando el equipo se entregue sin mal uso.',
            isVisible: true,
          },
        ],
      },
      isVisible: true,
    }),
  },
  {
    key: 'videos',
    label: 'Videos',
    description: 'Administra los videos que aparecen en la landing.',
    icon: 'fa-circle-play',
    editor: 'videos',
    createSection: () => ({
      key: 'videos',
      label: 'Videos',
      title: 'La hidratación comienza desde el agua',
      description: 'Galería de videos de la landing',
      content: { videos: [] },
      isVisible: true,
    }),
  },
  {
    key: 'testimonials',
    label: 'Testimonios',
    description: 'Administra testimonios en video de clientes.',
    icon: 'fa-quote-left',
    editor: 'testimonials',
    createSection: () => ({
      key: 'testimonials',
      label: 'Testimonios',
      title: 'Lo que dicen nuestros clientes',
      description: 'Familias y empresas en Mérida que confían en Purifreze',
      content: {
        testimonials: [
          {
            id: 'maracuyla-owner',
            name: 'MARIA DOLORES LICEA SOLIS',
            label: 'Dueña de Maracuyá',
            url: '/assets/testimonio2.mp4',
            featured: false,
            isVisible: true,
          },
          {
            id: 'benelica-owner',
            name: 'LEYLA FERNANDA CHAVEZ DEL PINO',
            label: 'Dueña de Benélica Cafetería-Wellness & Coffee',
            url: '/assets/testimonio.mp4',
            featured: true,
            isVisible: true,
          },
          {
            id: 'casa-flauta-owner',
            name: 'ERICK HERNANDEZ',
            label: 'Dueño de casa Flauta',
            url: '/assets/testimonio3.mp4',
            featured: false,
            isVisible: true,
          },
        ],
      },
      isVisible: true,
    }),
  },
  {
    key: 'comparison',
    label: 'Comparación',
    description: 'Edita la tabla que compara Purifreze con garrafones.',
    icon: 'fa-table-columns',
    editor: 'comparison',
    createSection: () => ({
      key: 'comparison',
      label: 'Comparación detallada',
      title: 'Comparación detallada',
      description: 'Filas editables de Purifreze contra garrafones',
      content: { badges: [] },
      isVisible: true,
    }),
  },
];

export function editorForSection(key: string): SectionEditorKind {
  return sectionCatalog.find((section) => section.key === key)?.editor ?? 'generic';
}
