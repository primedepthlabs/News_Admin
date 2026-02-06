"use client";
import { useState, useEffect, useMemo } from "react"; // Add useMemo
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
  UserCircle,
  FolderOpen,
  Lifebuoy,
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
  const [ticketCount, setTicketCount] = useState(0);
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>("");
  const router = useRouter();
  const menuItems = [
    { id: "/dashboard", label: "Dashboard", icon: ChartBar },
    {
      id: "/my-panel",
      label: "My Panel",
      icon: UserCircle,
    },
    { id: "/approval", label: "News Approval", icon: CheckCircle },
    { id: "/acl", label: "Access Control", icon: ShieldCheck },
    {
      id: "/categories",
      label: "Categories",
      icon: FolderOpen,
    },
    {
      id: "advertisements",
      label: "Advertisement Management",
      icon: MegaphoneIcon,
    },
    { id: "/team", label: "Team", icon: ChartBar },
    { id: "/users", label: "Users", icon: Users },
    { id: "/news", label: "News", icon: Newspaper },
    {
      id: "/support",
      label: "Support",
      icon: Lifebuoy,
      isSupport: true,
      showBadge: true,
    },
  ];

  useEffect(() => {
    fetchUserRoleAndPermissions();
  }, []);
  // Real-time permissions check for sidebar
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      console.log(
        "🔴 Setting up real-time subscription for user:",
        session.user.id,
      );

      // Subscribe to changes in the dashboardUsers table for current user
      const channel = supabase
        .channel("sidebar-permissions-realtime")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "dashboardUsers",
            filter: `id=eq.${session.user.id}`,
          },
          (payload) => {
            console.log("🟢 Real-time update received:", payload);

            const newRole = payload.new.role;
            const newPermissions = payload.new.permissions || [];

            console.log("🔄 Updating sidebar with new permissions:", {
              oldRole: userRole,
              newRole,
              oldPermissions: userPermissions,
              newPermissions,
            });

            setUserRole(newRole);
            setUserPermissions(newPermissions);
          },
        )
        .subscribe((status) => {
          console.log("📡 Subscription status:", status);
        });

      // Cleanup subscription on unmount
      return () => {
        console.log("🔵 Cleaning up real-time subscription");
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []); // Empty dependency - set up once on mount
  // Fetch ticket count for admins/superadmins
  useEffect(() => {
    const fetchTicketCount = async () => {
      if (!userRole || userRole === "reporter") return;

      try {
        const { count } = await supabase
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]);

        setTicketCount(count || 0);
      } catch (err) {
        console.error("Error fetching ticket count:", err);
      }
    };

    fetchTicketCount();

    // Real-time subscription for ticket count
    if (userRole && userRole !== "reporter") {
      const channel = supabase
        .channel("ticket-count-updates")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_tickets",
          },
          () => {
            fetchTicketCount();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userRole]);
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
        .select("role, permissions, full_name") // ✅ Add full_name here
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        return;
      }

      setUserRole(userData?.role || null);
      setUserPermissions(userData?.permissions || []);
      setUserName(userData?.full_name || "User"); // ✅ Add this line
      setLoading(false);
    } catch (err) {
      console.error("Error in fetchUserRoleAndPermissions:", err);
      setLoading(false);
    }
  };
  const visibleMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Support is ALWAYS visible for everyone
      if (item.isSupport) {
        return true;
      }

      // SuperAdmin sees everything
      if (userRole === "superadmin") {
        return true;
      }

      // My Panel requires BOTH reporter role AND permission
      if (item.id === "/my-panel") {
        return userRole === "reporter" && userPermissions.includes("/my-panel");
      }

      // All other items require permission
      return userPermissions.includes(item.id);
    });
  }, [userRole, userPermissions]);
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
            Dashboard
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
            visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isSupport = item.isSupport;
              const isActive = !isSupport && pathname === item.id; // ✅ Support never active

              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  title={isCollapsed ? item.label : ""}
                  className={`
        w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 cursor-pointer
        ${isCollapsed ? "lg:justify-center lg:px-0" : "justify-start"}
        ${
          isActive
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }
      `}
                >
                  {" "}
                  <div className="relative">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isCollapsed ? "lg:mr-0" : "mr-2"
                      }`}
                      weight={isActive ? "fill" : "regular"}
                    />
                    {item.showBadge &&
                      ticketCount > 0 &&
                      (userRole === "admin" || userRole === "superadmin") && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                          {ticketCount > 9 ? "9+" : ticketCount}
                        </span>
                      )}
                  </div>
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

        {/* User Info and Logout Section */}
        <div className="p-2 border-t border-gray-200 space-y-1">
          {/* User Info Display (Not Clickable) */}
          <div
            className={`
      w-full flex items-center px-3 py-2 text-xs font-medium rounded-lg
      ${isCollapsed ? "lg:justify-center lg:px-0" : "justify-start"}
      bg-gray-50 border border-gray-200
    `}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                className={`flex-1 text-left transition-all duration-300 ${
                  isCollapsed
                    ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                    : "opacity-100"
                }`}
              >
                {loading ? (
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-200 animate-pulse rounded w-20" />
                    <div className="h-2 bg-gray-200 animate-pulse rounded w-16" />
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-gray-900 capitalize truncate">
                      {userName || "User"}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate capitalize">
                      {userRole || "Role"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
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
