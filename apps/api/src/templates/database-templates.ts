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
        config: { options: ['Pendiente', 'En progreso', 'Hecho'] },
      },
      {
        name: 'Prioridad',
        type: 'SELECT',
        order: 3,
        config: { options: ['Baja', 'Media', 'Alta'] },
      },
      { name: 'Fecha inicio', type: 'DATE', order: 4 },
      { name: 'Fecha fin', type: 'DATE', order: 5 },
    ],
  },
];
