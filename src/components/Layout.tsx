import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Building2, ChevronDown, FolderKanban, LayoutDashboard, Scale, Star } from "lucide-react";
import { useState, useEffect } from "react";
import logoEquimmox from "@/assets/logo-equimmox.png";

const navGroups = [
  {
    label: "Patrimoine",
    items: [
      { name: "Dashboard", to: "/", icon: LayoutDashboard },
      { name: "Parc", to: "/assets", icon: Building2 },
      { name: "Arbitrage", to: "/arbitrage", icon: Scale },
    ],
  },
  {
    label: "Deal Flow",
    items: [
      { name: "Pipeline", to: "/deals", icon: FolderKanban },
      { name: "Opportunités", to: "/opportunities", icon: Star },
    ],
  },
];

const Layout = () => {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-open the group containing the active route
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      const hasActive = group.items.some(
        (item) => item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
      );
      initial[group.label] = hasActive;
    });
    setOpenGroups(initial);
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[125px] flex-col bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center justify-center px-2 py-5 border-b border-sidebar-border">
          <img src={logoEquimmox} alt="EquimmoX" style={{ width: '105px' }} />
        </div>

        <nav className="flex-1 px-2 py-4 space-y-2">
          {navGroups.map((group) => (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-colors"
                style={{ color: 'hsl(var(--sidebar-muted))' }}
              >
                {group.label}
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${openGroups[group.label] ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>

              {openGroups[group.label] && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium transition-all duration-150 ${isActive
                          ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]'
                          : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
                        }`
                      }
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-sidebar-border">
          <div className="flex flex-col items-center gap-1">
            <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center text-[10px] font-semibold text-sidebar-primary">AD</div>
            <p className="text-[9px] font-medium text-sidebar-accent-foreground text-center">A. Durand</p>
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
