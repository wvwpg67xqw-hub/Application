import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, useLogout, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, FileText, Settings, LogOut, Shield, Users, ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";
import serverLogo from "@assets/server-logo.webp";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Apply", href: "/apply", icon: <FileText size={18} /> },
  { label: "Admin Panel", href: "/admin", icon: <Shield size={18} />, adminOnly: true },
  { label: "Applications", href: "/admin/applications", icon: <Users size={18} />, adminOnly: true },
  { label: "Positions", href: "/admin/positions", icon: <FileText size={18} />, adminOnly: true },
  { label: "Settings", href: "/admin/settings", icon: <Settings size={18} />, adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user && ["admin", "developer", "owner"].includes(user.role);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        navigate("/");
      },
    });
  };

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user?.discordId || "0") % 5}.png`;

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Server header */}
      <div className="px-4 py-4 border-b border-[#202225]">
        <div className="flex items-center gap-3">
          <img src={serverLogo} alt="Server" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-white text-sm leading-tight">Staff Applications</p>
            <p className="text-xs text-[#B9BBBE]">Discord Server</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => { navigate(item.href); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "bg-[#5865F2] text-white"
                  : "text-[#B9BBBE] hover:bg-[#40444B] hover:text-white"
              }`}
            >
              <span className={isActive ? "text-white" : "text-[#72767D] group-hover:text-[#B9BBBE]"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-3 py-3 bg-[#292B2F] border-t border-[#202225]">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={user?.displayName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.displayName}</p>
            <p className="text-xs text-[#B9BBBE] truncate">
              {user?.role === "owner" ? "Owner" : user?.role === "developer" ? "Developer" : user?.role === "admin" ? "Admin" : "Member"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#72767D] hover:text-[#ED4245] transition-colors p-1 rounded"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#36393F] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-[#2F3136] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-[#2F3136] flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center px-4 py-3 bg-[#2F3136] border-b border-[#202225]">
          <button onClick={() => setMobileOpen(true)} className="text-[#B9BBBE] mr-3">
            <Menu size={20} />
          </button>
          <img src={serverLogo} alt="Server" className="w-6 h-6 rounded-full mr-2" />
          <span className="text-white font-semibold text-sm">Staff Applications</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
