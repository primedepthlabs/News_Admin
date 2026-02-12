"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, FileText } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";
import TiptapEditor from "@/components/TiptapEditor";

type Page = {
  id: number;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
};

export default function PagesManager() {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageForm, setPageForm] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
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

      if (userData?.role !== "admin" && userData?.role !== "superadmin") {
        router.push("/dashboard");
        return;
      }

      await fetchPages();
      setLoading(false);
    } catch (err) {
      console.error("Auth error:", err);
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("slug", { ascending: true });

    if (error) console.error("Error fetching pages:", error);
    else setPages(data || []);
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setPageForm({ title: page.title, content: page.content });
  };

  const handleSave = async () => {
    if (!editingPage) return;
    setSaving(true);

    const { error } = await supabase
      .from("pages")
      .update({
        title: pageForm.title,
        content: pageForm.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingPage.id);

    setSaving(false);

    if (error) {
    } else {
      setEditingPage(null);
      fetchPages();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="h-4 w-1/3 bg-gray-100 animate-pulse rounded mb-3" />
            <div className="h-3 w-1/4 bg-gray-100 animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Page Management</h1>
        <p className="text-xs text-gray-600 mt-1">
          Edit Support & Privacy Policy content
        </p>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {pages.length === 0 ? (
          <div className="p-12 text-center">
            <FileText
              className="h-12 w-12 text-gray-300 mx-auto mb-3"
              weight="duotone"
            />
            <p className="text-sm text-gray-600">No pages found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pages.map((page) => (
              <div
                key={page.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText
                      className="h-5 w-5 text-gray-500"
                      weight="duotone"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {page.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
                        /{page.slug}
                      </span>
                      <span>
                        Updated{" "}
                        {new Date(page.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(page)}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingPage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingPage.title}
                </h2>
                <span className="text-xs text-gray-500">
                  /{editingPage.slug}
                </span>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Page Title
                </label>
                <input
                  type="text"
                  value={pageForm.title}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Content
                </label>
                <TiptapEditor
                  value={pageForm.content}
                  onChange={(value: string) =>
                    setPageForm({ ...pageForm, content: value })
                  }
                  style={{ minHeight: "350px" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !pageForm.title.trim()}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
