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
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

const AVAILABLE_ROUTES = [
  { id: "/dashboard", label: "Dashboard", icon: ChartBar },
  { id: "/approval", label: "News Approval", icon: ShieldCheck },
  { id: "/users", label: "Users", icon: Users },
  { id: "/news", label: "News", icon: Newspaper },
  { id: "/settings", label: "Settings", icon: Gear },
];

type DashboardUser = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "reporter";
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

        if (userData?.role !== "admin") {
          setError("Access denied. Only admins can manage permissions.");
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
    if (authChecked && currentUserRole === "admin") {
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
        .eq("role", "reporter") // Only fetch reporters
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
          u.id === userId ? { ...u, permissions: updatedPermissions } : u
        )
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

  if (currentUserRole !== "admin") {
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
              Only admins can manage permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Control</h1>
          <p className="text-xs text-gray-600 mt-1">
            Manage page access permissions for reporters
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-blue-600" weight="fill" />
          <span className="text-xs font-medium text-blue-700">
            {users.length} Reporters
          </span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      <div className="space-y-3">
        {users.map((user) => {
          return (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <User className="h-3 w-3" weight="fill" />
                    Reporter
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
                  {AVAILABLE_ROUTES.map((route) => {
                    const RouteIcon = route.icon;
                    const hasPermission = user.permissions.includes(route.id);
                    const isDisabled = saving === user.id;

                    return (
                      <button
                        key={route.id}
                        onClick={() =>
                          !isDisabled && togglePermission(user.id, route.id)
                        }
                        disabled={isDisabled}
                        className={`
                          relative px-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-left
                          ${
                            hasPermission
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }
                          ${
                            isDisabled
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <RouteIcon
                            className={`h-4 w-4 ${
                              hasPermission ? "text-green-600" : "text-gray-400"
                            }`}
                            weight={hasPermission ? "fill" : "regular"}
                          />
                          <span
                            className={`text-xs font-medium ${
                              hasPermission ? "text-green-700" : "text-gray-600"
                            }`}
                          >
                            {route.label}
                          </span>
                        </div>
                        {hasPermission && (
                          <div className="absolute top-1 right-1">
                            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
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

      {users.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <ShieldCheck
            className="h-12 w-12 text-gray-400 mx-auto mb-3"
            weight="duotone"
          />
          <p className="text-sm text-gray-600">No reporters found</p>
        </div>
      )}
    </div>
  );
}
