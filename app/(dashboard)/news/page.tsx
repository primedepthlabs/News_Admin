"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Trash,
  Eye,
  Share,
  TrendUp,
  Plus,
  X,
  CheckCircle, // ADD
  XCircle, // ADD
  Clock,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type News = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  category_id: number | null;
  location: string | null;
  author_name: string | null;
  author_bio: string | null;
  is_breaking: boolean;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  view_count: number;
  share_count: number;
  status: "pending" | "approved" | "rejected";
};

type Category = {
  id: number;
  name: string;
};

function NewsTableSkeleton() {
  return (
    <div className="hidden lg:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Article
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Category
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Author
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Stats
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Date
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
                <div className="h-3 w-48 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-4 w-20 bg-gray-100 animate-pulse rounded-full" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-24 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-16 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-20 bg-gray-100 animate-pulse rounded" />
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

function NewsMobileSkeleton() {
  return (
    <div className="lg:hidden space-y-2 p-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded-full" />
            <div className="h-2 w-20 bg-gray-200 animate-pulse rounded" />
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

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNews, setTotalNews] = useState(0);
  const itemsPerPage = 10;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const router = useRouter();
  const [editForm, setEditForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    image: "",
    category_id: "0",
    location: "",
    author_name: "",
    author_bio: "",
    is_breaking: false,
  });
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, [router]);
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
    } else {
      setCategories(data || []);
    }
  };

  const fetchNews = async (page: number) => {
    setLoading(true);
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from("news")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching news:", error);
    } else {
      setNews(data || []);
      setTotalNews(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews(currentPage);
  }, [currentPage]);

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" weight="fill" />
          Approved
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">
          <XCircle className="h-3 w-3" weight="fill" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-700">
        <Clock className="h-3 w-3" weight="fill" />
        Pending
      </span>
    );
  };
  const resetForm = () => {
    setEditForm({
      title: "",
      excerpt: "",
      content: "",
      image: "",
      category_id: "0",
      location: "",
      author_name: "",
      author_bio: "",
      is_breaking: false,
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (newsItem: News) => {
    setSelectedNews(newsItem);
    setEditForm({
      title: newsItem.title,
      excerpt: newsItem.excerpt || "",
      content: newsItem.content,
      image: newsItem.image || "",
      category_id: newsItem.category_id?.toString() || "0",
      location: newsItem.location || "",
      author_name: newsItem.author_name || "",
      author_bio: newsItem.author_bio || "",
      is_breaking: newsItem.is_breaking,
    });
    setIsEditDialogOpen(true);
  };

  const handleAddNews = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { error } = await supabase.from("news").insert([
      {
        title: editForm.title,
        excerpt: editForm.excerpt || null,
        content: editForm.content,
        image: editForm.image || null,
        category_id: editForm.category_id
          ? parseInt(editForm.category_id)
          : null,
        location: editForm.location || null,
        author_name: editForm.author_name || null,
        author_bio: editForm.author_bio || null,
        is_breaking: editForm.is_breaking,

        author_id: session?.user.id || null,
      },
    ]);

    if (error) {
      console.error("Error adding news:", error);
    } else {
      fetchNews(currentPage);
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateNews = async () => {
    if (!selectedNews) return;

    const { error } = await supabase
      .from("news")
      .update({
        title: editForm.title,
        excerpt: editForm.excerpt || null,
        content: editForm.content,
        image: editForm.image || null,
        category_id: editForm.category_id
          ? parseInt(editForm.category_id)
          : null,
        location: editForm.location || null,
        author_name: editForm.author_name || null,
        author_bio: editForm.author_bio || null,
        is_breaking: editForm.is_breaking,
      })
      .eq("id", selectedNews.id);

    if (error) {
      console.error("Error updating news:", error);
    } else {
      fetchNews(currentPage);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteNews = async () => {
    if (!selectedNews) return;

    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", selectedNews.id);

    if (error) {
      console.error("Error deleting news:", error);
    } else {
      fetchNews(currentPage);
      setIsDeleteDialogOpen(false);
    }
  };

  const totalPages = Math.ceil(totalNews / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-0.5">
              News Articles
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" weight="bold" />
            Add Article
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <>
              <NewsTableSkeleton />
              <NewsMobileSkeleton />
            </>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Article
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Category
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Author
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Stats
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Date
                      </th>
                      <th className="text-right py-2 px-3 font-semibold text-xs text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {news.map((newsItem) => (
                      <tr
                        key={newsItem.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-900 line-clamp-1">
                                {newsItem.title}
                              </span>
                              {newsItem.is_breaking && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-0.5 whitespace-nowrap">
                                  <TrendUp
                                    className="h-2.5 w-2.5"
                                    weight="bold"
                                  />
                                  Breaking
                                </span>
                              )}
                              {getStatusBadge(newsItem.status)}
                            </div>
                            {newsItem.location && (
                              <span className="text-[10px] text-gray-500">
                                📍 {newsItem.location}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-700">
                            {getCategoryName(newsItem.category_id)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-700">
                          {newsItem.author_name || "Anonymous"}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2 text-[10px] text-gray-600">
                            <div className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" weight="duotone" />
                              <span>{newsItem.view_count}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Share className="h-3 w-3" weight="duotone" />
                              <span>{newsItem.share_count}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[10px] text-gray-600">
                          {new Date(newsItem.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              onClick={() => handleEdit(newsItem)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-gray-700" />
                            </button>
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-red-50 rounded transition-colors cursor-pointer"
                              onClick={() => handleDelete(newsItem)}
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

              {/* Mobile Card View - 3 Cards Grid */}
              <div className="lg:hidden p-3">
                <div className="grid grid-cols-3 gap-2">
                  {news.map((newsItem) => (
                    <div
                      key={newsItem.id}
                      className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-shadow"
                    >
                      {/* Image */}
                      {newsItem.image && (
                        <img
                          src={newsItem.image}
                          alt={newsItem.title}
                          className="w-full h-12 object-cover rounded mb-1.5"
                        />
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mb-1">
                        {newsItem.is_breaking && (
                          <span className="px-1 py-0.5 text-[7px] font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                            <TrendUp className="h-1.5 w-1.5" weight="bold" />
                            Breaking
                          </span>
                        )}
                        <div className="scale-75 origin-left">
                          {getStatusBadge(newsItem.status)}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-[9px] font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
                        {newsItem.title}
                      </h3>

                      {/* Category */}
                      <span className="inline-block px-1 py-0.5 text-[7px] font-medium rounded-full bg-gray-100 text-gray-700 mb-1">
                        {getCategoryName(newsItem.category_id)}
                      </span>

                      {/* Stats */}
                      <div className="flex items-center gap-1.5 text-[7px] text-gray-600 mb-1.5">
                        <div className="flex items-center gap-0.5">
                          <Eye className="h-2 w-2" weight="duotone" />
                          <span>{newsItem.view_count}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Share className="h-2 w-2" weight="duotone" />
                          <span>{newsItem.share_count}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          className="flex-1 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          onClick={() => handleEdit(newsItem)}
                        >
                          <Pencil className="h-2.5 w-2.5 text-gray-700" />
                        </button>
                        <button
                          className="flex-1 h-5 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded transition-colors"
                          onClick={() => handleDelete(newsItem)}
                        >
                          <Trash className="h-2.5 w-2.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                    {Math.min(currentPage * itemsPerPage, totalNews)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">{totalNews}</span>{" "}
                  articles
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

      {/* Add/Edit Dialog */}
      {(isAddDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isAddDialogOpen ? "Add News Article" : "Edit Article"}
                </h2>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {isAddDialogOpen
                    ? "Create a new news article"
                    : "Update article information"}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="overflow-y-auto p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Enter article title"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Excerpt
                </label>
                <textarea
                  value={editForm.excerpt}
                  onChange={(e) =>
                    setEditForm({ ...editForm, excerpt: e.target.value })
                  }
                  placeholder="Brief summary of the article"
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent resize-none transition-shadow"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.content}
                  onChange={(e) =>
                    setEditForm({ ...editForm, content: e.target.value })
                  }
                  placeholder="Full article content"
                  rows={5}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent resize-none transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Category
                  </label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category_id: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                  >
                    <option value="0">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    placeholder="e.g., New York, USA"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Image URL
                </label>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) =>
                    setEditForm({ ...editForm, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={editForm.author_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, author_name: e.target.value })
                    }
                    placeholder="Enter author name"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Author Bio
                  </label>
                  <input
                    type="text"
                    value={editForm.author_bio}
                    onChange={(e) =>
                      setEditForm({ ...editForm, author_bio: e.target.value })
                    }
                    placeholder="Brief author bio"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="is_breaking"
                  checked={editForm.is_breaking}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_breaking: e.target.checked })
                  }
                  className="w-3 h-3 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <label
                  htmlFor="is_breaking"
                  className="text-[10px] font-medium text-gray-900 cursor-pointer select-none"
                >
                  Mark as Breaking News
                </label>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={isAddDialogOpen ? handleAddNews : handleUpdateNews}
                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors cursor-pointer font-medium"
              >
                {isAddDialogOpen ? "Add Article" : "Save Changes"}
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
              Delete Article?
            </h2>
            <p className="text-[10px] text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{selectedNews?.title}"
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
                onClick={handleDeleteNews}
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
