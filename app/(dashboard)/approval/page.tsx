"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  MapPin,
  Calendar,
  Tag,
  TrendUp,
  X,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";
type MediaItem = {
  type: "image" | "video";
  url: string;
  order: number;
};
type Reporter = {
  full_name: string;
  email: string;
};
type News = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  media: MediaItem[] | null; // ADD THIS LINE
  category_id: number | null;
  location: string | null;
  author_name: string | null;
  author_bio: string | null;
  is_breaking: boolean;
  created_at: string;
  author_id: string | null;
  status: "pending" | "approved" | "rejected" | "processing"; // ADD processing
  links: Array<{ url: string; label: string }> | null;
};

type Category = {
  id: number;
  name: string;
};

function ApprovalSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-3">
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NewsApprovalPage() {
  const [pendingNews, setPendingNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [reporters, setReporters] = useState<Map<string, Reporter>>(new Map());

  const [filters, setFilters] = useState({
    search: "",
    status: "all", // all, pending, processing
    category: "all",
    reporter: "all",
    breaking: "all", // all, breaking, regular
    dateFrom: "",
    dateTo: "",
    location: "all",
    sortBy: "newest", // newest, oldest, titleAZ, titleZA
    hasMedia: "all", // all, with, without
    hasLinks: "all", // all, with, without
  });

  const [showFilters, setShowFilters] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        setCurrentUserId(session.user.id);

        const { data: userData } = await supabase
          .from("dashboardUsers")
          .select("role, permissions")
          .eq("id", session.user.id)
          .single();

        setUserRole(userData?.role || null);
        setUserPermissions(userData?.permissions || []);
        setAuthChecked(true);

        // Check if user has permission to access this page
        const hasPermission =
          userData?.role === "admin" ||
          (userData?.permissions && userData.permissions.includes("/approval"));

        if (!hasPermission) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setAuthChecked(true);
        router.push("/dashboard");
      }
    };

    initAuth();
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
  const fetchPendingNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .in("status", ["pending", "processing"]) // SHOW BOTH pending AND processing
      .order("created_at", { ascending: false });

    console.log("🔍 Fetched articles:", data); // ADD THIS
    console.log("📊 Total count:", data?.length); // ADD THIS
    console.log(
      "🔄 Processing count:",
      data?.filter((n) => n.status === "processing").length,
    ); // ADD THIS

    if (error) {
      console.error("Error fetching pending news:", error);
    } else {
      setPendingNews(data || []);
      if (data) {
        await fetchReporters(data);
      }
    }
    setLoading(false);
  };
  const fetchReporters = async (newsData: News[]) => {
    const authorIds = newsData
      .map((n) => n.author_id)
      .filter((id): id is string => id !== null);

    if (authorIds.length === 0) return;

    const { data, error } = await supabase
      .from("dashboardUsers")
      .select("id, full_name, email")
      .in("id", authorIds);

    if (error) {
      console.error("Error fetching reporters:", error);
    } else if (data) {
      const reporterMap = new Map<string, Reporter>();
      data.forEach((reporter: any) => {
        reporterMap.set(reporter.id, {
          full_name: reporter.full_name,
          email: reporter.email,
        });
      });
      setReporters(reporterMap);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (
      authChecked &&
      (userRole === "superadmin" || // ✅ ADD THIS LINE
        userRole === "admin" ||
        (userRole === "reporter" && userPermissions.includes("/approval")))
    ) {
      fetchPendingNews();
    } else if (authChecked) {
      setLoading(false);
    }
  }, [authChecked, userRole, userPermissions]);
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || "Unknown";
  };
  const getStatusBadge = (status: string) => {
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-yellow-100 text-yellow-700">
          <Clock className="h-3 w-3" weight="fill" />
          Pending Review
        </span>
      );
    } else if (status === "processing") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
          <Clock className="h-3 w-3" weight="fill" />
          Processing
        </span>
      );
    }
    return null;
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
  const handleApprove = async (newsId: number) => {
    setActionLoading(newsId);
    const { error } = await supabase
      .from("news")
      .update({
        status: "approved",
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", newsId);

    if (error) {
      console.error("Error approving news:", error);
    } else {
      fetchPendingNews();
    }
    setActionLoading(null);
  };

  const handleReject = async (newsId: number) => {
    setActionLoading(newsId);
    const { error } = await supabase
      .from("news")
      .update({
        status: "rejected",
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", newsId);

    if (error) {
      console.error("Error rejecting news:", error);
    } else {
      fetchPendingNews();
    }
    setActionLoading(null);
  };
  const handleProcessing = async (newsId: number) => {
    setActionLoading(newsId);
    const { error } = await supabase
      .from("news")
      .update({
        status: "processing",
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", newsId);

    if (error) {
      console.error("Error setting to processing:", error);
    } else {
      fetchPendingNews();
    }
    setActionLoading(null);
  };
  const openPreview = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsPreviewOpen(true);
  };
  const getReporterInfo = (authorId: string | null) => {
    if (!authorId) return null;
    return reporters.get(authorId);
  };

  const filteredNews = pendingNews.filter((news) => {
    if (filters.status !== "all" && news.status !== filters.status)
      return false;
    if (
      filters.category !== "all" &&
      news.category_id?.toString() !== filters.category
    )
      return false;
    if (filters.reporter !== "all" && news.author_id !== filters.reporter)
      return false;
    if (filters.breaking === "breaking" && !news.is_breaking) return false;
    if (filters.breaking === "regular" && news.is_breaking) return false;
    if (
      filters.search &&
      !news.title.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    return true;
  });
  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Approval</h1>
          <p className="text-xs text-gray-600 mt-1">
            Review and approve pending news articles
          </p>
        </div>
        <ApprovalSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Approval</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve pending news articles
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
          <Clock className="h-4 w-4 text-gray-600" weight="fill" />
          <span className="text-sm font-medium text-gray-700">
            {pendingNews.filter((n) => n.status === "pending").length} Pending /{" "}
            {pendingNews.filter((n) => n.status === "processing").length}{" "}
            Processing
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search articles..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
          </select>

          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Reporter */}
          <select
            value={filters.reporter}
            onChange={(e) =>
              setFilters({ ...filters, reporter: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All Reporters</option>
            {Array.from(reporters.entries()).map(([id, reporter]) => (
              <option key={id} value={id}>
                {reporter.full_name}
              </option>
            ))}
          </select>

          {/* Breaking */}
          <select
            value={filters.breaking}
            onChange={(e) =>
              setFilters({ ...filters, breaking: e.target.value })
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">All News</option>
            <option value="breaking">Breaking Only</option>
            <option value="regular">Regular Only</option>
          </select>
        </div>

        {/* Filter Summary */}
        {(filters.status !== "all" ||
          filters.category !== "all" ||
          filters.reporter !== "all" ||
          filters.breaking !== "all" ||
          filters.search) && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredNews.length} of {pendingNews.length} articles
            </p>
            <button
              onClick={() =>
                setFilters({
                  search: "",
                  status: "all",
                  category: "all",
                  reporter: "all",
                  breaking: "all",
                  dateFrom: "",
                  dateTo: "",
                  location: "all",
                  sortBy: "newest",
                  hasMedia: "all",
                  hasLinks: "all",
                })
              }
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {filteredNews.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <CheckCircle
            className="h-12 w-12 text-gray-400 mx-auto mb-3"
            weight="duotone"
          />
          <p className="text-sm font-medium text-gray-900 mb-1">
            No articles found
          </p>
          <p className="text-sm text-gray-600">
            {pendingNews.length === 0
              ? "No pending news articles to review"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-600">
              <div className="col-span-4">Article</div>
              <div className="col-span-2">Reporter</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {filteredNews.map((newsItem) => {
              const reporter = getReporterInfo(newsItem.author_id);
              return (
                <div
                  key={newsItem.id}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Article */}
                    <div className="col-span-4">
                      <div className="flex items-start gap-2">
                        {newsItem.is_breaking && (
                          <TrendUp
                            className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5"
                            weight="bold"
                          />
                        )}
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                            {newsItem.title}
                          </h3>
                          {newsItem.excerpt && (
                            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                              {newsItem.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reporter */}
                    <div className="col-span-2">
                      {reporter ? (
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {reporter.full_name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {reporter.email}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Unknown</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-700">
                        {getCategoryName(newsItem.category_id)}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="col-span-1">
                      <p className="text-xs text-gray-600">
                        {new Date(newsItem.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      {getStatusBadge(newsItem.status)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={() => openPreview(newsItem)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                        title="Preview"
                      >
                        <Eye
                          className="h-4 w-4 text-gray-600"
                          weight="duotone"
                        />
                      </button>

                      {newsItem.status === "pending" &&
                        userRole !== "reporter" && (
                          <button
                            onClick={() => handleProcessing(newsItem.id)}
                            disabled={actionLoading === newsItem.id}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors disabled:opacity-50"
                            title="Processing"
                          >
                            <Clock className="h-4 w-4" weight="fill" />
                          </button>
                        )}

                      {userRole === "superadmin" &&
                        newsItem.status === "processing" && (
                          <button
                            onClick={() => handleApprove(newsItem.id)}
                            disabled={actionLoading === newsItem.id}
                            className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" weight="fill" />
                          </button>
                        )}

                      <button
                        onClick={() => handleReject(newsItem.id)}
                        disabled={actionLoading === newsItem.id}
                        className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="h-4 w-4" weight="fill" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Keep existing Preview Dialog - don't change it */}
      {isPreviewOpen && selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Article Preview
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Review before approval
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="h-8 w-8 flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              {/* Reporter Info */}
              {selectedNews.author_id &&
                getReporterInfo(selectedNews.author_id) && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-2">
                      Submitted By
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User
                          className="h-5 w-5 text-gray-600"
                          weight="duotone"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getReporterInfo(selectedNews.author_id)?.full_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getReporterInfo(selectedNews.author_id)?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Keep all existing preview content exactly as is */}
              {selectedNews.image && (
                <img
                  src={selectedNews.image}
                  alt={selectedNews.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

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
                            <div className="relative aspect-square rounded overflow-hidden border border-gray-200">
                              <img
                                src={item.url}
                                alt={`#${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                                #{index + 1}
                              </div>
                            </div>
                          ) : (
                            <div className="relative aspect-square rounded overflow-hidden border border-gray-200">
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
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <span className="text-xs text-gray-500">
                                    Invalid Video
                                  </span>
                                </div>
                              )}
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                                #{index + 1}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                  {getCategoryName(selectedNews.category_id)}
                </span>
                {selectedNews.is_breaking && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">
                    <TrendUp className="h-3.5 w-3.5" weight="bold" />
                    Breaking News
                  </span>
                )}
                {getStatusBadge(selectedNews.status)}
              </div>

              <h1 className="text-3xl font-bold text-gray-900">
                {selectedNews.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-4 border-b border-gray-200">
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

              {selectedNews.excerpt && (
                <p className="text-lg text-gray-700 italic">
                  {selectedNews.excerpt}
                </p>
              )}

              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedNews.content}
                </p>
              </div>

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

              {selectedNews.links && selectedNews.links.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    Related Links
                  </p>
                  <div className="flex gap-2">
                    {selectedNews.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        {link.label || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>

              {selectedNews.status === "pending" && userRole !== "reporter" && (
                <button
                  onClick={() => {
                    handleProcessing(selectedNews.id);
                    setIsPreviewOpen(false);
                  }}
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" weight="fill" />
                  Processing
                </button>
              )}

              {userRole === "superadmin" &&
                selectedNews.status === "processing" && (
                  <button
                    onClick={() => {
                      handleApprove(selectedNews.id);
                      setIsPreviewOpen(false);
                    }}
                    className="px-3 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                    Approve
                  </button>
                )}

              <button
                onClick={() => {
                  handleReject(selectedNews.id);
                  setIsPreviewOpen(false);
                }}
                className="px-3 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" weight="fill" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
