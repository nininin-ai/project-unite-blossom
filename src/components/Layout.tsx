import { NavLink, Outlet } from "react-router-dom";
import { Building2, FolderKanban, LayoutDashboard, Scale, Star } from "lucide-react";
import logoEquimmox from "@/assets/logo-equimmox.png";

const navigation = [
  { name: "Dashboard Parc", to: "/", icon: LayoutDashboard },
  { name: "Parc Immobilier", to: "/assets", icon: Building2 },
  { name: "Arbitrage Parc", to: "/arbitrage", icon: Scale },
  { name: "Deal Flow", to: "/deals", icon: FolderKanban },
  { name: "Nouvelle Opportunité", to: "/opportunities", icon: Star },
];

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[125px] flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center justify-center px-2 py-5 border-b border-sidebar-border">
          <img src={logoEquimmox} alt="EquimmoX" style={{ width: '105px' }} />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-primary">AD</div>
            <div className="text-xs">
              <p className="font-medium text-sidebar-accent-foreground">Antoine Durand</p>
              <p className="text-sidebar-muted">Directeur Acquisitions</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
