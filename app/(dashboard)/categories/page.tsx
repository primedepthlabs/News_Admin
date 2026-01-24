"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash, X, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  created_at: string;
};

// Toast Component - Updated
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "error" | "success" | "warning";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "error"
      ? "bg-red-100 border-red-300"
      : type === "success"
        ? "bg-green-100 border-green-300"
        : "bg-yellow-100 border-yellow-300";

  const textColor =
    type === "error"
      ? "text-red-800"
      : type === "success"
        ? "text-green-800"
        : "text-yellow-800";

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} border ${textColor} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md transition-all duration-300 ease-out`}
      style={{
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success" | "warning";
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
    fetchCategories();
  }, [router]);

  const showToast = (
    message: string,
    type: "error" | "success" | "warning",
  ) => {
    setToast({ message, type });
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setCategoryName("");
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    if (selectedCategory) {
      // Update
      const { error } = await supabase
        .from("categories")
        .update({ name: categoryName.trim() })
        .eq("id", selectedCategory.id);

      if (error) {
        console.error("Error updating category:", error);
        showToast(`Failed to update: ${error.message}`, "error");
        return;
      }
      showToast("Category updated successfully!", "success");
    } else {
      // Add
      const { error } = await supabase
        .from("categories")
        .insert([{ name: categoryName.trim() }]);

      if (error) {
        console.error("Error adding category:", error);
        showToast(`Failed to add: ${error.message}`, "error");
        return;
      }
      showToast("Category added successfully!", "success");
    }

    fetchCategories();
    setIsDialogOpen(false);
    setCategoryName("");
  };

  const handleDelete = async (category: Category) => {
    // Check if category is being used by any news articles
    const { count, error: countError } = await supabase
      .from("news")
      .select("*", { count: "exact", head: true })
      .eq("category_id", category.id);

    if (countError) {
      console.error("Error checking category usage:", countError);
      showToast(`Error: ${countError.message}`, "error");
      return;
    }

    if (count && count > 0) {
      showToast(
        `Cannot delete "${category.name}" - it's being used by ${count} article(s). Please reassign or delete those articles first.`,
        "warning",
      );
      return;
    }

    // If not used, show delete confirmation dialog
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    // Proceed with deletion
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", selectedCategory.id);

    if (error) {
      console.error("Error deleting category:", error);
      showToast(`Failed to delete: ${error.message}`, "error");
      return;
    }

    showToast("Category deleted successfully!", "success");
    fetchCategories();
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Categories
          </h1>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No categories yet. Add your first category!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                    Name
                  </th>
                  <th className="text-right py-2 px-3 font-semibold text-xs text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 text-xs text-gray-900">
                      {category.name}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-700" />
                        </button>
                        <button
                          className="h-7 w-7 flex items-center justify-center hover:bg-red-50 rounded"
                          onClick={() => handleDelete(category)}
                        >
                          <Trash className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">
                {selectedCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-3 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Delete Category?
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to delete "{selectedCategory?.name}"? This
              action cannot be undone.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
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
