import { NavLink } from "react-router-dom";
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
} from "lucide-react";
import { useRecentItems } from "@/hooks/use-recent";
import { useAuth } from "@/hooks/use-auth";

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
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { items: recentItems } = useRecentItems();
  const { logout } = useAuth();

  return (
    <aside
      className={`flex flex-col h-screen bg-zinc-950 text-zinc-400 border-r border-zinc-800 shrink-0 overflow-hidden transition-[width] duration-200 ${
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
        <span className={`text-base font-semibold text-white truncate transition-opacity duration-200 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
          Nexum
        </span>
      </NavLink>

      {/* Collapse toggle */}
      <div className="px-2 pb-2 pt-1">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-8 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
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
                  ? "bg-zinc-800 text-white"
                  : "hover:bg-zinc-900 hover:text-zinc-200"
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
              <Clock size={12} className="text-zinc-600 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider text-zinc-600 font-medium">
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
                        ? "bg-zinc-800 text-white"
                        : "hover:bg-zinc-900 hover:text-zinc-200"
                    }`
                  }
                >
                  <Icon size={14} className="shrink-0 text-zinc-500" />
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
                ? "bg-zinc-800 text-white"
                : "hover:bg-zinc-900 hover:text-zinc-200"
            }`
          }
        >
          <Settings size={18} className="shrink-0" />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={logout}
          title="Logout"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm whitespace-nowrap overflow-hidden transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
