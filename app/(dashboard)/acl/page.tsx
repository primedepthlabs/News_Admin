"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  ChartBar,
  Users,
  Gear,
  Newspaper,
  ShieldCheck,
  Check,
  X,
  Crown,
  MagnifyingGlass,
  FunnelSimple,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

const AVAILABLE_ROUTES = [
  { id: "/dashboard", label: "Dashboard", icon: ChartBar },
  { id: "/my-panel", label: "My Panel", icon: User },
  { id: "/approval", label: "News Approval", icon: ShieldCheck },
  { id: "/team", label: "Team", icon: ChartBar },
  { id: "/users", label: "Users", icon: Users },
  { id: "/news", label: "News", icon: Newspaper },
];

type DashboardUser = {
  id: string;
  email: string;
  full_name: string;
  role: "superadmin" | "admin" | "reporter";
  permissions: string[];
};
function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}

export default function ACLPermissionsManager() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"admin" | "reporter">("admin");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [reporterSearchQuery, setReporterSearchQuery] = useState("");
  const [adminFilterStatus, setAdminFilterStatus] = useState<
    "all" | "with" | "without"
  >("all");
  const [reporterFilterStatus, setReporterFilterStatus] = useState<
    "all" | "with" | "without"
  >("all");

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        const { data: userData } = await supabase
          .from("dashboardUsers")
          .select("role")
          .eq("id", session.user.id)
          .single();

        setCurrentUserRole(userData?.role || null);
        setAuthChecked(true);
        if (userData?.role !== "superadmin" && userData?.role !== "admin") {
          setError(
            "Access denied. Only superadmin and admin can manage permissions.",
          );
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);
  useEffect(() => {
    if (
      authChecked &&
      (currentUserRole === "superadmin" || currentUserRole === "admin")
    ) {
      fetchUsers();
    } else if (authChecked) {
      setLoading(false);
    }
  }, [currentUserRole, authChecked]);
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dashboardUsers")
        .select("id, email, full_name, role, permissions")
        .in("role", ["reporter", "admin"]) // Fetch BOTH reporters and admins
        .order("created_at", { ascending: false });

      if (error) throw error;

      const usersWithPermissions = (data || []).map((user) => ({
        ...user,
        permissions: user.permissions || [],
      }));

      setUsers(usersWithPermissions);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Get current tab's filters
  const currentSearchQuery =
    activeTab === "admin" ? adminSearchQuery : reporterSearchQuery;
  const currentFilterStatus =
    activeTab === "admin" ? adminFilterStatus : reporterFilterStatus;

  const filteredUsers = users.filter((user) => {
    // Tab filter
    if (activeTab === "admin" && user.role !== "admin") return false;
    if (activeTab === "reporter" && user.role !== "reporter") return false;

    // Search filter
    const searchLower = currentSearchQuery.toLowerCase();
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;

    // Permission status filter
    if (currentFilterStatus === "with" && user.permissions.length === 0)
      return false;
    if (currentFilterStatus === "without" && user.permissions.length > 0)
      return false;

    return true;
  });

  const stats = {
    totalAdmins: users.filter((u) => u.role === "admin").length,
    totalReporters: users.filter((u) => u.role === "reporter").length,
    adminsWithPerms: users.filter(
      (u) => u.role === "admin" && u.permissions.length > 0,
    ).length,
    reportersWithPerms: users.filter(
      (u) => u.role === "reporter" && u.permissions.length > 0,
    ).length,
    totalWithPerms: users.filter((u) => u.permissions.length > 0).length,
    totalWithoutPerms: users.filter((u) => u.permissions.length === 0).length,
  };
  const togglePermission = async (userId: string, route: string) => {
    setSaving(userId);
    setError("");
    setSuccess("");

    try {
      const user = users.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");

      const hasPermission = user.permissions.includes(route);
      const updatedPermissions = hasPermission
        ? user.permissions.filter((p) => p !== route)
        : [...user.permissions, route];

      const { error } = await supabase
        .from("dashboardUsers")
        .update({ permissions: updatedPermissions })
        .eq("id", userId);

      if (error) throw error;

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, permissions: updatedPermissions } : u,
        ),
      );

      setSuccess(`Updated permissions for ${user.full_name}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating permissions:", err);
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <UsersSkeleton />;
  if (currentUserRole !== "superadmin" && currentUserRole !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto">
            <X className="h-8 w-8 text-red-600" weight="bold" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Access Denied
            </h2>
            <p className="text-sm text-gray-600">
              Only superadmin and admin can manage permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
        <p className="text-xs text-gray-600 mt-1">
          Manage page access permissions for admins and reporters
        </p>
      </div>

      {/* Stats Cards with Smooth Transitions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Admins */}
        <div className="relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">
              Total Admins
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600 transition-all duration-300">
            {stats.totalAdmins}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {stats.adminsWithPerms} with permissions
          </p>
        </div>

        <div className="relative bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">
              Total Reporters
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 transition-all duration-300">
            {stats.totalReporters}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {stats.reportersWithPerms} with permissions
          </p>
        </div>

        {/* With Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">
              With Permissions
            </span>
            <Check className="h-3.5 w-3.5 text-green-500" weight="bold" />
          </div>
          <p className="text-2xl font-bold text-green-600 transition-all duration-300">
            {stats.totalWithPerms}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Active access granted
          </p>
        </div>

        {/* Without Permissions */}
        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-lg hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 font-medium">
              No Permissions
            </span>
            <X className="h-3.5 w-3.5 text-gray-400" weight="bold" />
          </div>
          <p className="text-2xl font-bold text-gray-400 transition-all duration-300">
            {stats.totalWithoutPerms}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Needs configuration
          </p>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Tabs with Smooth Transition */}
        <div className="flex items-center border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 relative ${
              activeTab === "admin"
                ? "text-purple-700 bg-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Crown
                className={`h-4 w-4 transition-all duration-300 ${activeTab === "admin" ? "text-purple-600" : "text-gray-400"}`}
                weight={activeTab === "admin" ? "fill" : "regular"}
              />
              Admins ({users.filter((u) => u.role === "admin").length})
            </span>
            {activeTab === "admin" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-t-full animate-slideIn" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("reporter")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-300 relative ${
              activeTab === "reporter"
                ? "text-blue-700 bg-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <User
                className={`h-4 w-4 transition-all duration-300 ${activeTab === "reporter" ? "text-blue-600" : "text-gray-400"}`}
                weight={activeTab === "reporter" ? "fill" : "regular"}
              />
              Reporters ({users.filter((u) => u.role === "reporter").length})
            </span>
            {activeTab === "reporter" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full animate-slideIn" />
            )}
          </button>
        </div>

        {/* Search + Filter Bar with Animation */}
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          {/* Search */}
          <div className="flex-1 relative group">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-300"
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={
                activeTab === "admin" ? adminSearchQuery : reporterSearchQuery
              }
              onChange={(e) =>
                activeTab === "admin"
                  ? setAdminSearchQuery(e.target.value)
                  : setReporterSearchQuery(e.target.value)
              }
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400"
            />
            {currentSearchQuery && (
              <button
                onClick={() =>
                  activeTab === "admin"
                    ? setAdminSearchQuery("")
                    : setReporterSearchQuery("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="h-3 w-3 text-gray-500" weight="bold" />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 sm:w-auto w-full">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <FunnelSimple className="h-4 w-4 text-gray-500" weight="bold" />
              <select
                value={
                  activeTab === "admin"
                    ? adminFilterStatus
                    : reporterFilterStatus
                }
                onChange={(e) =>
                  activeTab === "admin"
                    ? setAdminFilterStatus(e.target.value as any)
                    : setReporterFilterStatus(e.target.value as any)
                }
                className="flex-1 sm:w-auto px-3 py-2.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all duration-300 hover:border-gray-400 bg-white"
              >
                <option value="all">All Users ({filteredUsers.length})</option>
                <option value="with">With Permissions</option>
                <option value="without">No Permissions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info Bar */}
        {(currentSearchQuery || currentFilterStatus !== "all") && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between animate-slideDown">
            <p className="text-xs text-blue-700">
              Showing <span className="font-bold">{filteredUsers.length}</span>{" "}
              of{" "}
              <span className="font-bold">
                {
                  users.filter((u) =>
                    activeTab === "admin"
                      ? u.role === "admin"
                      : u.role === "reporter",
                  ).length
                }
              </span>{" "}
              {activeTab === "admin" ? "admins" : "reporters"}
            </p>
            <button
              onClick={() => {
                if (activeTab === "admin") {
                  setAdminSearchQuery("");
                  setAdminFilterStatus("all");
                } else {
                  setReporterSearchQuery("");
                  setReporterFilterStatus("all");
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline transition-colors duration-200"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* User List with Staggered Animation */}
        <div className="p-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-3 animate-slideDown">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-3 animate-slideDown">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredUsers.map((user, index) => {
              // Calculate max routes for this user
              const maxRoutes =
                user.role === "admin"
                  ? AVAILABLE_ROUTES.filter((r) => r.id !== "/my-panel").length
                  : AVAILABLE_ROUTES.filter((r) => r.id !== "/team").length;

              const userPermCount = user.permissions.length;
              const percentage = (userPermCount / maxRoutes) * 100;

              // Determine color
              let barColor = "bg-green-400";
              if (userPermCount === 0) {
                barColor = "bg-red-400";
              } else if (userPermCount < maxRoutes) {
                barColor = "bg-yellow-400";
              }

              return (
                <div
                  key={user.id}
                  className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-300 animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* User Header */}
                  <div className="px-4 py-3 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          user.role === "admin"
                            ? "bg-purple-100 group-hover:bg-purple-200"
                            : "bg-blue-100 group-hover:bg-blue-200"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Crown
                            className="h-5 w-5 text-purple-600"
                            weight="duotone"
                          />
                        ) : (
                          <User
                            className="h-5 w-5 text-blue-600"
                            weight="duotone"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        {user.role === "admin" ? (
                          <Crown className="h-3 w-3" weight="fill" />
                        ) : (
                          <User className="h-3 w-3" weight="fill" />
                        )}
                        {user.role === "admin" ? "Admin" : "Reporter"}
                      </span>
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="p-4 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-700">
                        Page Permissions ({userPermCount}/{maxRoutes})
                      </p>
                      <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                      {AVAILABLE_ROUTES.filter((route) => {
                        if (route.id === "/my-panel" && user.role === "admin") {
                          return false;
                        } // Hide /team from reporters - ADD THIS
                        if (route.id === "/team" && user.role === "reporter") {
                          return false;
                        }

                        return true;
                      }).map((route) => {
                        const RouteIcon = route.icon;
                        const hasPermission = user.permissions.includes(
                          route.id,
                        );
                        const isDisabled = saving === user.id;

                        return (
                          <button
                            key={route.id}
                            onClick={() =>
                              !isDisabled && togglePermission(user.id, route.id)
                            }
                            disabled={isDisabled}
                            className={`
                  group relative px-3 py-2.5 rounded-lg border-2 transition-all duration-300 text-left
                  ${
                    hasPermission
                      ? "border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600 shadow-sm"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                  }
                  ${
                    isDisabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer transform hover:scale-105"
                  }
                `}
                          >
                            <div className="flex items-center gap-2">
                              <RouteIcon
                                className={`h-4 w-4 transition-all duration-300 ${
                                  hasPermission
                                    ? "text-green-600"
                                    : "text-gray-400 group-hover:text-blue-500"
                                }`}
                                weight={hasPermission ? "fill" : "regular"}
                              />
                              <span
                                className={`text-xs font-medium transition-colors duration-300 ${
                                  hasPermission
                                    ? "text-green-700"
                                    : "text-gray-600 group-hover:text-blue-600"
                                }`}
                              >
                                {route.label}
                              </span>
                            </div>
                            {hasPermission && (
                              <div className="absolute top-1 right-1 animate-scaleIn">
                                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                  <Check
                                    className="h-3 w-3 text-white"
                                    weight="bold"
                                  />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State with Animation */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                {currentSearchQuery ? (
                  <MagnifyingGlass
                    className="h-8 w-8 text-gray-400"
                    weight="duotone"
                  />
                ) : (
                  <ShieldCheck
                    className="h-8 w-8 text-gray-400"
                    weight="duotone"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {currentSearchQuery
                  ? "No users found"
                  : `No ${activeTab === "admin" ? "admins" : "reporters"} found`}
              </p>
              <p className="text-xs text-gray-500">
                {currentSearchQuery
                  ? "Try adjusting your search or filters"
                  : `There are no ${activeTab === "admin" ? "admins" : "reporters"} matching the selected filters`}
              </p>
              {(currentSearchQuery || currentFilterStatus !== "all") && (
                <button
                  onClick={() => {
                    if (activeTab === "admin") {
                      setAdminSearchQuery("");
                      setAdminFilterStatus("all");
                    } else {
                      setReporterSearchQuery("");
                      setReporterFilterStatus("all");
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium underline transition-colors duration-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add custom animations in a style tag */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
