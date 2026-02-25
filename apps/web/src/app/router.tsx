import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectView from "@/pages/ProjectView";
import DatabaseView from "@/pages/DatabaseView";
import DocumentView from "@/pages/DocumentView";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
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
]);