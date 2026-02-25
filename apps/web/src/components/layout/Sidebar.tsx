import { NavLink } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Settings, PanelLeftClose, PanelLeft } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <aside
      className={`flex flex-col h-screen bg-zinc-950 text-zinc-400 border-r border-zinc-800 shrink-0 overflow-hidden transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-60"
      }`}
    >
      <div className="px-2 pt-4 pb-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-10 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>


      <nav className="flex-1 flex flex-col gap-1 px-2">
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
      </nav>

      <div className="px-2 pb-4">
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
      </div>
    </aside>
  );
};

export default Sidebar;
