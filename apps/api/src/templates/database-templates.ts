export interface DatabaseTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultViewType: 'TABLE' | 'BOARD';
  properties: {
    name: string;
    type: 'TEXT' | 'NUMBER' | 'SELECT' | 'DATE' | 'RELATION';
    order: number;
    config?: unknown;
  }[];
}

export const DATABASE_TEMPLATES: DatabaseTemplate[] = [
  {
    id: 'todo-kanban',
    name: 'Todo / Kanban',
    description: 'Gestiona tareas con columnas de estado y prioridad',
    icon: 'kanban',
    defaultViewType: 'BOARD',
    properties: [
      { name: 'Título', type: 'TEXT', order: 0 },
      { name: 'Descripción', type: 'TEXT', order: 1 },
      {
        name: 'Estado',
        type: 'SELECT',
        order: 2,
        config: {
          options: [
            { id: 'pendiente', value: 'Pendiente', color: '#8590a2' },
            { id: 'en-progreso', value: 'En progreso', color: '#579dff' },
            { id: 'hecho', value: 'Hecho', color: '#4bce97' },
          ],
        },
      },
      {
        name: 'Prioridad',
        type: 'SELECT',
        order: 3,
        config: {
          options: [
            { id: 'baja', value: 'Baja', color: '#8590a2' },
            { id: 'media', value: 'Media', color: '#e2b203' },
            { id: 'alta', value: 'Alta', color: '#f87462' },
          ],
        },
      },
      { name: 'Fecha inicio', type: 'DATE', order: 4 },
      { name: 'Fecha fin', type: 'DATE', order: 5 },
    ],
  },
];
