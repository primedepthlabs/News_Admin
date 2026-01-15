"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Trash, Plus, X, Newspaper } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

type DashboardUser = {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "reporter";
  created_at: string;
};

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
              <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardUsersTable() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [error, setError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });
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

        // Fetch current user's role
        const { data: userData, error } = await supabase
          .from("dashboardUsers")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          setAuthChecked(true);
          setLoading(false);
          return;
        }

        setCurrentUserRole(userData?.role || null);
        setAuthChecked(true);

        // If not admin, show error
        if (userData?.role !== "admin") {
          setError("Access denied. Only admins can manage reporters.");
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dashboardUsers")
        .select("*")
        .eq("role", "reporter")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecked && currentUserRole === "admin") {
      fetchUsers();
    } else if (authChecked) {
      setLoading(false);
    }
  }, [currentUserRole, authChecked]);

  const handleAddUser = async () => {
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const { error: insertError } = await supabase
        .from("dashboardUsers")
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            role: "reporter",
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      fetchUsers();
      setIsAddDialogOpen(false);
      setFormData({ email: "", password: "", full_name: "" });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("dashboardUsers")
        .delete()
        .eq("id", selectedUser.id);

      if (error) throw error;

      fetchUsers();
      setIsDeleteDialogOpen(false);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.message);
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
              Only admins can manage reporters.
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
          <h1 className="text-2xl font-bold text-gray-900">Reporters</h1>
          <p className="text-xs text-gray-600 mt-1">Manage reporter accounts</p>
        </div>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-sm font-medium"
        >
          <Plus className="h-4 w-4" weight="bold" />
          Add Reporter
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-xs text-gray-900">
                  Reporter
                </th>
                <th className="text-left py-3 px-4 font-semibold text-xs text-gray-900">
                  Joined
                </th>
                <th className="text-right py-3 px-4 font-semibold text-xs text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Newspaper
                          className="h-5 w-5 text-blue-600"
                          weight="duotone"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 flex items-center justify-center hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Newspaper
              className="h-12 w-12 text-gray-400 mx-auto mb-3"
              weight="duotone"
            />
            <p className="text-sm text-gray-600">No reporters yet</p>
          </div>
        )}
      </div>

      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-900">
                Add New Reporter
              </h2>
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setError("");
                }}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-900">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter password"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setError("");
                }}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors font-medium"
              >
                Add Reporter
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mb-3">
              <Trash className="h-5 w-5 text-red-600" weight="duotone" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Delete Reporter?
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {selectedUser?.full_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
