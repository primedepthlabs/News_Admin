"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  Users,
  Gear,
  List,
  X,
  Newspaper,
  SignOut,
  CheckCircle,
  MegaphoneIcon,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { id: "/dashboard", label: "Dashboard", icon: ChartBar },

    { id: "/approval", label: "News Approval", icon: CheckCircle },
    { id: "/acl", label: "Access Control", icon: ShieldCheck },
    {
      id: "advertisements",
      label: "Advertisement Management",
      icon: MegaphoneIcon,
    },
    { id: "/reporters", label: "Reporter Panel", icon: ChartBar },
    { id: "/users", label: "Users", icon: Users },
    { id: "/news", label: "News", icon: Newspaper },
    { id: "/settings", label: "Settings", icon: Gear },
  ];

  useEffect(() => {
    fetchUserRoleAndPermissions();
  }, []);

  const fetchUserRoleAndPermissions = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData, error } = await supabase
        .from("dashboardUsers")
        .select("role, permissions")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        return;
      }

      setUserRole(userData?.role || null);
      setUserPermissions(userData?.permissions || []);
      setLoading(false);
    } catch (err) {
      console.error("Error in fetchUserRoleAndPermissions:", err);
      setLoading(false);
    }
  };

  // Filter menu items based on role and permissions
  const visibleMenuItems = menuItems.filter((item) => {
    // Admins see everything
    if (userRole === "admin") return true;

    // Reporters only see items they have permission for
    return userPermissions.includes(item.id);
  });

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="h-9 w-9 flex items-center justify-center bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <List className="h-4 w-4" weight="bold" />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-40 
          border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out
          ${
            isMobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          ${isCollapsed ? "lg:w-16" : "w-64"}
        `}
      >
        <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2
            className={`text-base font-bold text-gray-900 transition-opacity duration-300 ${
              isCollapsed
                ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                : "opacity-100"
            }`}
          >
            {userRole === "admin" ? "Admin" : "Reporter"}
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer hidden lg:flex"
          >
            {isCollapsed ? (
              <List className="h-4 w-4" weight="bold" />
            ) : (
              <X className="h-4 w-4" weight="bold" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="h-8 w-8 shrink-0 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors cursor-pointer lg:hidden"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {loading ? (
            // Loading skeleton
            <div className="space-y-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : (
            // Render filtered menu items
            visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  title={isCollapsed ? item.label : ""}
                  className={`
                    w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer
                    ${
                      isCollapsed
                        ? "lg:justify-center lg:px-0"
                        : "justify-start"
                    }
                    ${
                      isActive
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isCollapsed ? "lg:mr-0" : "mr-2"
                    }`}
                    weight={isActive ? "fill" : "regular"}
                  />
                  <span
                    className={`transition-all duration-300 ${
                      isCollapsed
                        ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                        : "opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={isCollapsed ? "Logout" : ""}
            className={`
              w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer
              ${isCollapsed ? "lg:justify-center lg:px-0" : "justify-start"}
              text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <SignOut
              className={`h-4 w-4 shrink-0 ${isCollapsed ? "lg:mr-0" : "mr-2"}`}
              weight="bold"
            />
            <span
              className={`transition-all duration-300 ${
                isCollapsed
                  ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                  : "opacity-100"
              }`}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4 lg:p-4 pt-14 lg:pt-4 max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
