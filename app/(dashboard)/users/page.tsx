"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash, X } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

function UsersTableSkeleton() {
  return (
    <div className="hidden lg:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Name
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Email
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Created
            </th>
            <th className="text-right py-2 px-3 font-semibold text-xs text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 px-3">
                <div className="h-3 w-32 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-48 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="flex items-center justify-end gap-1">
                  <div className="h-7 w-7 bg-gray-100 animate-pulse rounded" />
                  <div className="h-7 w-7 bg-gray-100 animate-pulse rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersMobileSkeleton() {
  return (
    <div className="lg:hidden space-y-2 p-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-2 w-24 bg-gray-200 animate-pulse rounded" />
            <div className="flex gap-1 mt-2">
              <div className="h-7 w-7 bg-gray-200 animate-pulse rounded" />
              <div className="h-7 w-7 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  const fetchUsers = async (page: number) => {
    setLoading(true);
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
      setTotalUsers(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from("users")
      .update({ name: editForm.name, email: editForm.email })
      .eq("id", selectedUser.id);

    if (error) {
      console.error("Error updating user:", error);
    } else {
      fetchUsers(currentPage);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", selectedUser.id);

    if (error) {
      console.error("Error deleting user:", error);
    } else {
      fetchUsers(currentPage);
      setIsDeleteDialogOpen(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-0.5">
              Users
            </h1>
            <p className="text-xs text-gray-600">
              Manage your users and their permissions
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <>
              <UsersTableSkeleton />
              <UsersMobileSkeleton />
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 border-t border-gray-200 gap-2">
                <div className="h-3 w-48 bg-gray-100 animate-pulse rounded" />
                <div className="flex gap-1.5">
                  <div className="h-7 w-16 bg-gray-100 animate-pulse rounded" />
                  <div className="h-7 w-12 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Name
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Email
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Created
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-xs text-gray-900">
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
                        <td className="py-2 px-3 text-xs font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-700">
                          {user.email}
                        </td>
                        <td className="py-2 px-3 text-[10px] text-gray-600">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              onClick={() => handleEdit(user)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-gray-700" />
                            </button>
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-red-50 rounded transition-colors cursor-pointer"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-2 space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-gray-900 truncate mb-1">
                          {user.name}
                        </h3>
                        <p className="text-[10px] text-gray-600 truncate mb-0.5">
                          {user.email}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="h-7 w-7 flex items-center justify-center hover:bg-white rounded transition-colors cursor-pointer"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-700" />
                        </button>
                        <button
                          className="h-7 w-7 flex items-center justify-center hover:bg-red-100 rounded transition-colors cursor-pointer"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 border-t border-gray-200 gap-2">
                <p className="text-[10px] text-gray-600">
                  Showing{" "}
                  <span className="font-medium text-gray-900">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-gray-900">
                    {Math.min(currentPage * itemsPerPage, totalUsers)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">
                    {totalUsers}
                  </span>{" "}
                  users
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-gray-300 rounded text-[10px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white cursor-pointer font-medium transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 border border-gray-300 rounded text-[10px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white cursor-pointer font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Edit User</h2>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Update user information
                </p>
              </div>
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Enter name"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="Enter email"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors cursor-pointer font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mb-3">
              <Trash className="h-5 w-5 text-red-600" weight="duotone" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Delete User?
            </h2>
            <p className="text-[10px] text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{selectedUser?.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer font-medium"
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
