"use client";

import { useState, useEffect } from "react";
import { Pencil } from "@phosphor-icons/react";
import {
  Trash,
  Eye,
  Share,
  TrendUp,
  X,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  Tag,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SocialIcon } from "react-social-icons";
type MediaItem = {
  type: "image" | "video";
  url: string;
  order: number;
};
type News = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  media: MediaItem[] | null;
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
  links: Array<{ url: string; label: string }> | null;
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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    image: "",
    category_id: "",
    location: "",
    author_name: "",
    author_bio: "",
    is_breaking: false,
    status: "pending",
    media: [] as MediaItem[],
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
  const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };
  const handlePreview = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsPreviewOpen(true);
  };

  const handleDelete = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteDialogOpen(true);
  };
  const handleEdit = (newsItem: News) => {
    setSelectedNews(newsItem);
    setEditFormData({
      title: newsItem.title || "",
      excerpt: newsItem.excerpt || "",
      content: newsItem.content || "",
      image: newsItem.image || "",
      category_id: newsItem.category_id?.toString() || "",
      location: newsItem.location || "",
      author_name: newsItem.author_name || "",
      author_bio: newsItem.author_bio || "",
      is_breaking: newsItem.is_breaking || false,
      status: newsItem.status || "pending",
      media: newsItem.media || [], // ADD THIS
    });
    setIsEditDialogOpen(true);
  };
  const addMediaItem = () => {
    const newItem: MediaItem = {
      type: "image",
      url: "",
      order: editFormData.media.length,
    };
    setEditFormData({
      ...editFormData,
      media: [...editFormData.media, newItem],
    });
  };

  const removeMediaItem = (index: number) => {
    const newMedia = editFormData.media.filter((_, i) => i !== index);
    // Reorder after removal
    const reorderedMedia = newMedia.map((item, i) => ({ ...item, order: i }));
    setEditFormData({ ...editFormData, media: reorderedMedia });
  };

  const updateMediaItem = (
    index: number,
    field: keyof MediaItem,
    value: any,
  ) => {
    const newMedia = [...editFormData.media];
    newMedia[index] = { ...newMedia[index], [field]: value };
    setEditFormData({ ...editFormData, media: newMedia });
  };

  const moveMediaItem = (index: number, direction: "up" | "down") => {
    const newMedia = [...editFormData.media];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newMedia.length) return;

    // Swap items
    [newMedia[index], newMedia[newIndex]] = [
      newMedia[newIndex],
      newMedia[index],
    ];

    // Update order
    newMedia[index].order = index;
    newMedia[newIndex].order = newIndex;

    setEditFormData({ ...editFormData, media: newMedia });
  };
  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNews) return;

    const { error } = await supabase
      .from("news")
      .update({
        ...editFormData,
        category_id: editFormData.category_id
          ? parseInt(editFormData.category_id)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedNews.id);

    if (error) {
      console.error("Error updating news:", error);
    } else {
      fetchNews(currentPage);
      setIsEditDialogOpen(false);
    }
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
            <p className="text-xs text-gray-600">
              View and manage all published articles
            </p>
          </div>
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
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handlePreview(newsItem)}
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
                              className="h-7 w-7 flex items-center justify-center hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(newsItem);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 text-blue-600" />
                            </button>
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-red-50 rounded transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(newsItem);
                              }}
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
              <div className="lg:hidden p-3">
                <div className="grid grid-cols-3 gap-2">
                  {news.map((newsItem) => (
                    <div
                      key={newsItem.id}
                      className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handlePreview(newsItem)}
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

                      <div className="flex gap-1">
                        <button
                          className="flex-1 h-5 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(newsItem);
                          }}
                        >
                          <Pencil className="h-2.5 w-2.5 text-blue-600" />
                        </button>
                        <button
                          className="flex-1 h-5 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(newsItem);
                          }}
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

      {/* Preview Dialog */}
      {isPreviewOpen && selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Article Details
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Full article preview
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="overflow-y-auto p-6 space-y-4">
              {/* Cover Image */}
              {selectedNews.image && (
                <img
                  src={selectedNews.image}
                  alt={selectedNews.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              {/* Media Gallery - Compact Inline */}
              {selectedNews.media && selectedNews.media.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Gallery ({selectedNews.media.length})
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {selectedNews.media
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => (
                        <div key={index} className="relative group">
                          {item.type === "image" ? (
                            <div className="relative aspect-square rounded overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                              <img
                                src={item.url}
                                alt={`#${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                                #{index + 1}
                              </div>
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded">
                                IMG
                              </div>
                            </div>
                          ) : (
                            <div className="relative aspect-square rounded overflow-hidden border-2 border-dashed border-purple-300 bg-purple-50 hover:border-purple-400 transition-colors">
                              {getYouTubeVideoId(item.url) ? (
                                <iframe
                                  className="w-full h-full"
                                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(item.url)}`}
                                  title={`Video ${index + 1}`}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                  <svg
                                    className="h-8 w-8 text-purple-400 mb-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                  </svg>
                                  <span className="text-[8px] text-purple-600 font-bold text-center">
                                    ERROR
                                  </span>
                                </div>
                              )}
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                                #{index + 1}
                              </div>
                              <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-purple-500 text-white text-[9px] font-bold rounded">
                                VID
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                  {getCategoryName(selectedNews.category_id)}
                </span>
                {selectedNews.is_breaking && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                    <TrendUp className="h-3.5 w-3.5" weight="bold" />
                    Breaking News
                  </span>
                )}
                {getStatusBadge(selectedNews.status)}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedNews.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" weight="duotone" />
                  <span>By {selectedNews.author_name || "Anonymous"}</span>
                </div>
                {selectedNews.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" weight="duotone" />
                    <span>{selectedNews.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" weight="duotone" />
                  <span>
                    {new Date(selectedNews.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>

              {/* Excerpt */}
              {selectedNews.excerpt && (
                <p className="text-lg text-gray-700 italic">
                  {selectedNews.excerpt}
                </p>
              )}

              {/* Content */}
              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedNews.content}
                </p>
              </div>

              {/* Social Links */}
              {selectedNews.links && selectedNews.links.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Related Links
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.links.map((link, idx) => (
                      <SocialIcon
                        key={idx}
                        url={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link.label || link.url}
                        style={{ height: 32, width: 32 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Author Bio */}
              {selectedNews.author_bio && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-900 mb-1">
                    About the Author
                  </p>
                  <p className="text-xs text-gray-700">
                    {selectedNews.author_bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-gray-400" weight="duotone" />
                  <div>
                    <p className="text-xs text-gray-500">Views</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedNews.view_count}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Share className="h-5 w-5 text-gray-400" weight="duotone" />
                  <div>
                    <p className="text-xs text-gray-500">Shares</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedNews.share_count}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
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
      {/* Edit Dialog */}
      {isEditDialogOpen && selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Article
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Update article details
                </p>
              </div>
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateNews}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={editFormData.image}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, image: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="https://example.com/image.jpg"
                />
                {editFormData.image && (
                  <img
                    src={editFormData.image}
                    alt="Cover preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Media Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Media Gallery ({editFormData.media.length})
                  </label>
                  <button
                    type="button"
                    onClick={addMediaItem}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    + Add Media
                  </button>
                </div>

                {editFormData.media.length > 0 && (
                  <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {editFormData.media.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-300 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded">
                            #{index + 1}
                          </span>
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateMediaItem(index, "type", e.target.value)
                            }
                            className="px-2 py-1 text-xs border border-gray-300 rounded"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                          <div className="flex gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => moveMediaItem(index, "up")}
                              disabled={index === 0}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMediaItem(index, "down")}
                              disabled={index === editFormData.media.length - 1}
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMediaItem(index)}
                              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <input
                          type="url"
                          value={item.url}
                          onChange={(e) =>
                            updateMediaItem(index, "url", e.target.value)
                          }
                          placeholder={
                            item.type === "image"
                              ? "https://example.com/image.jpg"
                              : "https://youtube.com/watch?v=..."
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {item.url && item.type === "image" && (
                          <img
                            src={item.url}
                            alt={`Media ${index + 1}`}
                            className="mt-2 w-full h-24 object-cover rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={editFormData.excerpt}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      excerpt: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Content *
                </label>
                <textarea
                  value={editFormData.content}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      content: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category
                  </label>
                  <select
                    value={editFormData.category_id}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        category_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Author & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.author_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        author_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Breaking News */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-breaking"
                  checked={editFormData.is_breaking}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      is_breaking: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="edit-breaking"
                  className="text-sm font-medium text-gray-900"
                >
                  Mark as Breaking News
                </label>
              </div>
            </form>
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNews}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" weight="fill" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
