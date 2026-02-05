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
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

 useEffect(() => {
  if (
    authChecked &&
    (userRole === "superadmin" ||  // ✅ ADD THIS LINE
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
          <p className="text-xs text-gray-600 mt-1">
            Review and approve pending news articles
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Clock className="h-4 w-4 text-yellow-600" weight="fill" />
          <span className="text-xs font-medium text-yellow-700">
            {pendingNews.filter((n) => n.status === "pending").length} Pending /{" "}
            {pendingNews.filter((n) => n.status === "processing").length}{" "}
            Processing
          </span>
        </div>
      </div>

      {/* Pending News List */}
      {pendingNews.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 text-center py-12">
          <CheckCircle
            className="h-12 w-12 text-gray-400 mx-auto mb-3"
            weight="duotone"
          />
          <p className="text-sm font-medium text-gray-900 mb-1">
            All caught up!
          </p>
          <p className="text-xs text-gray-600">
            No pending news articles to review
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingNews.map((newsItem) => (
            <div
              key={newsItem.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {newsItem.is_breaking && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700">
                          <TrendUp className="h-3 w-3" weight="bold" />
                          Breaking News
                        </span>
                      )}
                      {getStatusBadge(newsItem.status)}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      {newsItem.title}
                    </h2>
                    {newsItem.excerpt && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {newsItem.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta Information */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" weight="duotone" />
                    <div>
                      <p className="text-[10px] text-gray-500">Author</p>
                      <p className="text-xs font-medium text-gray-900">
                        {newsItem.author_name || "Anonymous"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" weight="duotone" />
                    <div>
                      <p className="text-[10px] text-gray-500">Category</p>
                      <p className="text-xs font-medium text-gray-900">
                        {getCategoryName(newsItem.category_id)}
                      </p>
                    </div>
                  </div>

                  {newsItem.location && (
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="h-4 w-4 text-gray-400"
                        weight="duotone"
                      />
                      <div>
                        <p className="text-[10px] text-gray-500">Location</p>
                        <p className="text-xs font-medium text-gray-900">
                          {newsItem.location}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar
                      className="h-4 w-4 text-gray-400"
                      weight="duotone"
                    />
                    <div>
                      <p className="text-[10px] text-gray-500">Submitted</p>
                      <p className="text-xs font-medium text-gray-900">
                        {new Date(newsItem.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPreview(newsItem)}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
                  >
                    <Eye className="h-3.5 w-3.5" weight="duotone" />
                    Preview
                  </button>

                  {/* Processing Button - Show only if status is pending */}
                  {newsItem.status === "pending" && userRole !== "reporter" && (
                    <button
                      onClick={() => handleProcessing(newsItem.id)}
                      disabled={actionLoading === newsItem.id}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="h-3.5 w-3.5" weight="fill" />
                      Processing
                    </button>
                  )}

                  {/* Approve Button - Show only for superadmin AND if status is processing */}
                  {userRole === "superadmin" &&
                    newsItem.status === "processing" && (
                      <button
                        onClick={() => handleApprove(newsItem.id)}
                        disabled={actionLoading === newsItem.id}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="h-3.5 w-3.5" weight="fill" />
                        Approve
                      </button>
                    )}

                  {/* Reject Button - Always visible */}
                  <button
                    onClick={() => handleReject(newsItem.id)}
                    disabled={actionLoading === newsItem.id}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-3.5 w-3.5" weight="fill" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      {isPreviewOpen && selectedNews && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Dialog Header */}
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
              {/* Add this after the Author Bio section */}
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

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>

              {/* Processing Button - Show only if status is pending */}
              {selectedNews.status === "pending" && (
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

              {/* Approve Button - Show only for superadmin AND if status is processing */}
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

              {/* Reject Button - Always visible */}
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
