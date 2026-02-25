import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.route.js';
import databasesRouter from './routes/databases.route.js';
import propertiesRouter from './routes/properties.route.js';
import rowsRouter from './routes/rows.route.js';
import cellsRouter from './routes/cells.route.js';
import documentsRouter from './routes/documents.route.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/databases', databasesRouter);
app.use('/api/databases/:databaseId/properties', propertiesRouter);
app.use('/api/databases/:databaseId/rows', rowsRouter);
app.use('/api/rows/:rowId/cells', cellsRouter);
app.use('/api/documents', documentsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
