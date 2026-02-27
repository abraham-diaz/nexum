import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Database,
  FileText,
  Clock,
  LogOut,
  Search,
} from "lucide-react";
import { useRecentItems } from "@/hooks/use-recent";
import { useAuth } from "@/hooks/use-auth";
import { useDatabases } from "@/hooks/use-databases";
import { useDocuments } from "@/hooks/use-documents";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
];

const RECENT_ICONS = {
  database: Database,
  document: FileText,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onSearchClick?: () => void;
}

const Sidebar = ({ collapsed, onToggle, onSearchClick }: SidebarProps) => {
  const { items: recentItems, keepOnlyExisting } = useRecentItems();
  const { logout } = useAuth();
  const { data: databases } = useDatabases();
  const { data: documents } = useDocuments();

  useEffect(() => {
    if (!databases || !documents) return;

    keepOnlyExisting(
      databases.map((database) => database.id),
      documents.map((document) => document.id)
    );
  }, [databases, documents, keepOnlyExisting]);

  return (
    <aside
      className={`flex flex-col h-screen bg-sidebar text-muted-foreground border-r border-border shrink-0 overflow-hidden transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 px-3 pt-4 pb-1 min-w-0">
        <img
          src="/images/Nexum.png"
          alt="Nexum"
          className="h-7 w-7 shrink-0 object-contain"
        />
        <span className={`text-base font-semibold text-foreground truncate transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
          Nexum
        </span>
      </NavLink>

      {/* Collapse toggle */}
      <div className="px-2 pb-2 pt-1 flex items-center gap-1">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-8 rounded-md text-muted-foreground hover:text-foreground/80 hover:bg-secondary transition-colors"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {!collapsed && (
          <button
            onClick={onSearchClick}
            className="flex flex-1 items-center gap-2 h-8 rounded-md border border-border px-2 text-muted-foreground hover:text-foreground/80 hover:bg-secondary transition-colors text-xs"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="text-[10px] border border-border rounded px-1 py-0.5 text-muted-foreground/50">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={label}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm whitespace-nowrap overflow-hidden transition-colors ${
                isActive
                  ? "bg-secondary text-foreground"
                  : "hover:bg-secondary/50 hover:text-foreground/80"
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Recent items */}
        {recentItems.length > 0 && !collapsed && (
          <div className="mt-4">
            <div className="flex items-center gap-2 px-3 py-1">
              <Clock size={12} className="text-muted-foreground/50 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/50 font-medium">
                Recent
              </span>
            </div>
            {recentItems.map((item) => {
              const Icon = RECENT_ICONS[item.type];
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  title={item.name}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-1.5 rounded-md text-sm whitespace-nowrap overflow-hidden transition-colors ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "hover:bg-secondary/50 hover:text-foreground/80"
                    }`
                  }
                >
                  <Icon size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      <div className="px-2 pb-4 flex flex-col gap-1">
        <NavLink
          to="/settings"
          title="Settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm whitespace-nowrap overflow-hidden transition-colors ${
              isActive
                ? "bg-secondary text-foreground"
                : "hover:bg-secondary/50 hover:text-foreground/80"
            }`
          }
        >
          <Settings size={18} className="shrink-0" />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={logout}
          title="Logout"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm whitespace-nowrap overflow-hidden transition-colors hover:bg-secondary/50 hover:text-foreground/80"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
