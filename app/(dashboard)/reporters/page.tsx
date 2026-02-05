"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Newspaper,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ShareNetwork,
  Heart,
  ChatCircle,
  BookmarkSimple,
  ShieldCheck,
  PencilLine,
  ChartBar,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

type AdminStats = {
  id: string;
  full_name: string;
  email: string;
  total_reviewed: number;
  approved: number;
  rejected: number;
  processing: number;
  approval_rate: number;
};

type Article = {
  id: number;
  title: string;
  status: string;
  created_at: string;
  view_count: number;
  share_count: number;
  likes: number;
  comments: number;
  bookmarks: number;
  category: string;
};

type ReporterStats = {
  id: string;
  full_name: string;
  email: string;
  total_articles: number;
  approved: number;
  rejected: number;
  pending: number;
  processing: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_bookmarks: number;
  total_shares: number;
  articles: Article[];
};

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"admins" | "reporters">("admins");
  const [adminStats, setAdminStats] = useState<AdminStats[]>([]);
  const [reporterStats, setReporterStats] = useState<ReporterStats[]>([]);
  const [selectedReporter, setSelectedReporter] = useState<string | null>(null);
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

      if (userData?.role === "superadmin") {
        await fetchAllStats();
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err);
      router.push("/login");
    }
  };

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([fetchAdminStats(), fetchReporterStats()]);
    setLoading(false);
  };

  const fetchAdminStats = async () => {
    try {
      const { data: admins } = await supabase
        .from("dashboardUsers")
        .select("id, full_name, email")
        .in("role", ["admin", "superadmin"])
        .order("full_name");

      if (!admins) return;

      const statsPromises = admins.map(async (admin) => {
        const { data: reviewed } = await supabase
          .from("news")
          .select("status")
          .eq("reviewed_by", admin.id);

        const approved =
          reviewed?.filter((r) => r.status === "approved").length || 0;
        const rejected =
          reviewed?.filter((r) => r.status === "rejected").length || 0;
        const processing =
          reviewed?.filter((r) => r.status === "processing").length || 0;
        const total = reviewed?.length || 0;

        return {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          total_reviewed: total,
          approved,
          rejected,
          processing,
          approval_rate: total > 0 ? (approved / total) * 100 : 0,
        };
      });

      const stats = await Promise.all(statsPromises);
      setAdminStats(stats.sort((a, b) => b.total_reviewed - a.total_reviewed));
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    }
  };

  const fetchReporterStats = async () => {
    try {
      const { data: reporters } = await supabase
        .from("dashboardUsers")
        .select("id, full_name, email")
        .eq("role", "reporter")
        .order("full_name");

      if (!reporters) return;

      const { data: categories } = await supabase
        .from("categories")
        .select("id, name");

      const statsPromises = reporters.map(async (reporter) => {
        const { data: articles } = await supabase
          .from("news")
          .select(
            "id, title, status, created_at, view_count, share_count, category_id",
          )
          .eq("author_id", reporter.id)
          .order("created_at", { ascending: false });

        const articleIds = articles?.map((a) => a.id) || [];

        const { data: likes } = await supabase
          .from("likes")
          .select("news_id")
          .in("news_id", articleIds);

        const { data: comments } = await supabase
          .from("comments")
          .select("news_id")
          .in("news_id", articleIds);

        const { data: bookmarks } = await supabase
          .from("bookmarks")
          .select("news_id")
          .in("news_id", articleIds);

        const articlesWithStats: Article[] =
          articles?.map((article) => {
            const articleLikes =
              likes?.filter((l) => l.news_id === article.id).length || 0;
            const articleComments =
              comments?.filter((c) => c.news_id === article.id).length || 0;
            const articleBookmarks =
              bookmarks?.filter((b) => b.news_id === article.id).length || 0;
            const category = categories?.find(
              (c) => c.id === article.category_id,
            );

            return {
              id: article.id,
              title: article.title,
              status: article.status,
              created_at: article.created_at,
              view_count: article.view_count || 0,
              share_count: article.share_count || 0,
              likes: articleLikes,
              comments: articleComments,
              bookmarks: articleBookmarks,
              category: category?.name || "Uncategorized",
            };
          }) || [];

        const totalArticles = articles?.length || 0;
        const approved =
          articles?.filter((a) => a.status === "approved").length || 0;
        const rejected =
          articles?.filter((a) => a.status === "rejected").length || 0;
        const pending =
          articles?.filter((a) => a.status === "pending").length || 0;
        const processing =
          articles?.filter((a) => a.status === "processing").length || 0;

        const totalViews = articlesWithStats.reduce(
          (sum, a) => sum + a.view_count,
          0,
        );
        const totalLikes = articlesWithStats.reduce(
          (sum, a) => sum + a.likes,
          0,
        );
        const totalComments = articlesWithStats.reduce(
          (sum, a) => sum + a.comments,
          0,
        );
        const totalBookmarks = articlesWithStats.reduce(
          (sum, a) => sum + a.bookmarks,
          0,
        );
        const totalShares = articlesWithStats.reduce(
          (sum, a) => sum + a.share_count,
          0,
        );

        return {
          id: reporter.id,
          full_name: reporter.full_name,
          email: reporter.email,
          total_articles: totalArticles,
          approved,
          rejected,
          pending,
          processing,
          total_views: totalViews,
          total_likes: totalLikes,
          total_comments: totalComments,
          total_bookmarks: totalBookmarks,
          total_shares: totalShares,
          articles: articlesWithStats,
        };
      });

      const stats = await Promise.all(statsPromises);
      setReporterStats(stats);
    } catch (err) {
      console.error("Error fetching reporter stats:", err);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      pending: "bg-yellow-100 text-yellow-700",
      processing: "bg-blue-100 text-blue-700",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChartBar className="h-6 w-6 text-blue-600" weight="duotone" />
          Statistics
        </h1>
        <p className="text-xs text-gray-600 mt-0.5">
          Admin and reporter performance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === "admins"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <ShieldCheck className="h-4 w-4" weight="duotone" />
          Admins ({adminStats.length})
        </button>
        <button
          onClick={() => setActiveTab("reporters")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            activeTab === "reporters"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <PencilLine className="h-4 w-4" weight="duotone" />
          Reporters ({reporterStats.length})
        </button>
      </div>

      {/* Admin Statistics */}
      {activeTab === "admins" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">
                    Admin
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">
                    Total Reviewed
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">
                    <CheckCircle
                      className="h-3.5 w-3.5 inline text-green-600"
                      weight="fill"
                    />{" "}
                    Approved
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">
                    <Clock
                      className="h-3.5 w-3.5 inline text-yellow-600"
                      weight="fill"
                    />{" "}
                    Processing
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">
                    <XCircle
                      className="h-3.5 w-3.5 inline text-red-600"
                      weight="fill"
                    />{" "}
                    Rejected
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">
                    Approval Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <ShieldCheck
                        className="h-12 w-12 text-gray-400 mx-auto mb-3"
                        weight="duotone"
                      />
                      <p className="text-sm text-gray-600">
                        No admin activity yet
                      </p>
                    </td>
                  </tr>
                ) : (
                  adminStats.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShieldCheck
                              className="h-4 w-4 text-blue-600"
                              weight="duotone"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {admin.full_name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                        {admin.total_reviewed}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-green-600">
                        {admin.approved}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-yellow-600">
                        {admin.processing}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-bold text-red-600">
                        {admin.rejected}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                admin.approval_rate > 80
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                              style={{ width: `${admin.approval_rate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                            {admin.approval_rate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reporter Statistics */}
      {activeTab === "reporters" && (
        <div className="space-y-3">
          {reporterStats.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 py-12 text-center">
              <PencilLine
                className="h-12 w-12 text-gray-400 mx-auto mb-3"
                weight="duotone"
              />
              <p className="text-sm text-gray-600">No reporters yet</p>
            </div>
          ) : (
            reporterStats.map((reporter) => (
              <div
                key={reporter.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Reporter Header */}
                <div
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors"
                  onClick={() =>
                    setSelectedReporter(
                      selectedReporter === reporter.id ? null : reporter.id,
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-white" weight="bold" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900">
                          {reporter.full_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {reporter.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-0.5">Articles</p>
                        <p className="text-xl font-bold text-gray-900">
                          {reporter.total_articles}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-0.5">Views</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {formatNumber(reporter.total_views)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-0.5">Likes</p>
                        <p className="text-xl font-bold text-rose-600">
                          {formatNumber(reporter.total_likes)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-0.5">Comments</p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatNumber(reporter.total_comments)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 rounded text-xs font-semibold text-green-700">
                      <CheckCircle className="h-3 w-3" weight="fill" />
                      {reporter.approved} Approved
                    </div>
                    {reporter.pending > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-100 rounded text-xs font-semibold text-yellow-700">
                        <Clock className="h-3 w-3" weight="fill" />
                        {reporter.pending} Pending
                      </div>
                    )}
                    {reporter.processing > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 rounded text-xs font-semibold text-blue-700">
                        <Clock className="h-3 w-3" weight="fill" />
                        {reporter.processing} Processing
                      </div>
                    )}
                    {reporter.rejected > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-100 rounded text-xs font-semibold text-red-700">
                        <XCircle className="h-3 w-3" weight="fill" />
                        {reporter.rejected} Rejected
                      </div>
                    )}
                  </div>
                </div>

                {/* Reporter Articles (Expandable) */}
                {selectedReporter === reporter.id && (
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Newspaper
                        className="h-4 w-4 text-blue-600"
                        weight="duotone"
                      />
                      Articles ({reporter.articles.length})
                    </h3>
                    <div className="space-y-2">
                      {reporter.articles.length === 0 ? (
                        <p className="text-sm text-gray-600 text-center py-8">
                          No articles yet
                        </p>
                      ) : (
                        reporter.articles.map((article) => (
                          <div
                            key={article.id}
                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 mb-1 truncate">
                                  {article.title}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusBadge(
                                      article.status,
                                    )}`}
                                  >
                                    {article.status}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {article.category}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {new Date(
                                      article.created_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5 text-indigo-500" />
                                  <span className="text-xs font-semibold text-gray-700">
                                    {formatNumber(article.view_count)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart
                                    className="h-3.5 w-3.5 text-rose-500"
                                    weight="fill"
                                  />
                                  <span className="text-xs font-semibold text-gray-700">
                                    {article.likes}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ChatCircle
                                    className="h-3.5 w-3.5 text-blue-500"
                                    weight="fill"
                                  />
                                  <span className="text-xs font-semibold text-gray-700">
                                    {article.comments}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <BookmarkSimple
                                    className="h-3.5 w-3.5 text-amber-500"
                                    weight="fill"
                                  />
                                  <span className="text-xs font-semibold text-gray-700">
                                    {article.bookmarks}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ShareNetwork
                                    className="h-3.5 w-3.5 text-green-500"
                                    weight="fill"
                                  />
                                  <span className="text-xs font-semibold text-gray-700">
                                    {article.share_count}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
