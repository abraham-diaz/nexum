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
    description: 'Track tasks with status columns and priority levels',
    icon: 'kanban',
    defaultViewType: 'BOARD',
    properties: [
      { name: 'Title', type: 'TEXT', order: 0 },
      {
        name: 'Status',
        type: 'SELECT',
        order: 1,
        config: { options: ['Todo', 'In Progress', 'Done'] },
      },
      {
        name: 'Priority',
        type: 'SELECT',
        order: 2,
        config: { options: ['Low', 'Medium', 'High'] },
      },
      { name: 'Start Date', type: 'DATE', order: 3 },
      { name: 'End Date', type: 'DATE', order: 4 },
    ],
  },
];
