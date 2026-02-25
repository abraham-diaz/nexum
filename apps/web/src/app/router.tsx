import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import DatabaseView from "@/pages/DatabaseView";

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
        path: "databases/:id",
        element: <DatabaseView />,
      },
    ],
  },
]);