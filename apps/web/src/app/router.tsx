import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectView from "@/pages/ProjectView";
import DatabaseView from "@/pages/DatabaseView";
import DocumentView from "@/pages/DocumentView";
import Login from "@/pages/Login";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "projects",
        element: <Projects />,
      },
      {
        path: "projects/:id",
        element: <ProjectView />,
      },
      {
        path: "databases/:id",
        element: <DatabaseView />,
      },
      {
        path: "documents/:id",
        element: <DocumentView />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
