import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import projectsRouter from './routes/projects.route.js';
import databasesRouter from './routes/databases.route.js';
import propertiesRouter from './routes/properties.route.js';
import rowsRouter from './routes/rows.route.js';
import cellsRouter from './routes/cells.route.js';
import documentsRouter from './routes/documents.route.js';

const app = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Auth routes (no auth middleware)
app.use('/api/auth', authRouter);

// Protected routes
app.use(authMiddleware);
app.use('/api/projects', projectsRouter);
app.use('/api/databases', databasesRouter);
app.use('/api/databases/:databaseId/properties', propertiesRouter);
app.use('/api/databases/:databaseId/rows', rowsRouter);
app.use('/api/rows/:rowId/cells', cellsRouter);
app.use('/api/documents', documentsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
