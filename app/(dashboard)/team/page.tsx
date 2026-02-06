"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactECharts from "echarts-for-react";
import {
  User,
  Eye,
  Heart,
  ChatCircle,
  ShieldCheck,
  PencilLine,
  ChartBar,
  X,
  CheckCircle, // ADD THIS
  XCircle, // ADD THIS
  IdentificationCard, // ADD THIS
  Clock,
} from "@phosphor-icons/react";
import toast, { Toaster } from "react-hot-toast";
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
  monthly_performance: { month: string; articles: number; views: number }[];
  category_breakdown: { category: string; count: number }[];
};
type PendingReporter = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  aadhar_url: string;
  pan_url: string;
  passport_photo_1_url: string;
  passport_photo_2_url: string;
  verification_status: string;
};
export default function StatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "admins" | "reporters" | "pending"
  >("admins"); // CHANGE THIS LINE
  const [pendingReporters, setPendingReporters] = useState<PendingReporter[]>(
    [],
  ); // ADD THIS
  const [selectedPending, setSelectedPending] =
    useState<PendingReporter | null>(null); // ADD THIS
  const [processingId, setProcessingId] = useState<string | null>(null); // ADD THIS
  const [adminStats, setAdminStats] = useState<AdminStats[]>([]);
  const [reporterStats, setReporterStats] = useState<ReporterStats[]>([]);
  const [selectedReporter, setSelectedReporter] =
    useState<ReporterStats | null>(null);
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

      // CHANGE THIS: allow both superadmin AND admin
      if (userData?.role === "superadmin" || userData?.role === "admin") {
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
    await Promise.all([
      fetchAdminStats(),
      fetchReporterStats(),
      fetchPendingReporters(), // ADD THIS LINE
    ]);
    setLoading(false);
  };
  const fetchPendingReporters = async () => {
    try {
      const { data: reporters } = await supabase
        .from("dashboardUsers")
        .select(
          "id, full_name, email, created_at, aadhar_url, pan_url, passport_photo_1_url, passport_photo_2_url, verification_status",
        )
        .eq("role", "reporter")
        .eq("documents_verified", false)
        .order("created_at", { ascending: false });

      if (reporters) {
        setPendingReporters(reporters);
      }
    } catch (err) {
      console.error("Error fetching pending reporters:", err);
    }
  };

  const handleApproveReporter = async (reporterId: string) => {
    setProcessingId(reporterId);
    try {
      const { error } = await supabase
        .from("dashboardUsers")
        .update({
          documents_verified: true,
          verification_status: "approved",
        })
        .eq("id", reporterId);

      if (error) throw error;

      toast.success("Reporter approved successfully!");
      await fetchPendingReporters();
      setSelectedPending(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve reporter");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectReporter = async (reporterId: string) => {
    setProcessingId(reporterId);
    try {
      const { error } = await supabase
        .from("dashboardUsers")
        .update({
          documents_verified: false,
          verification_status: "rejected",
        })
        .eq("id", reporterId);

      if (error) throw error;

      toast.success("Reporter rejected");
      await fetchPendingReporters();
      setSelectedPending(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject reporter");
    } finally {
      setProcessingId(null);
    }
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
        .eq("documents_verified", true) // ADD THIS LINE - only get verified reporters
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

        const monthlyPerformance: {
          month: string;
          articles: number;
          views: number;
        }[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });

          const monthArticles =
            articles?.filter((a) => {
              const aDate = new Date(a.created_at);
              return (
                aDate.getMonth() === date.getMonth() &&
                aDate.getFullYear() === date.getFullYear()
              );
            }) || [];

          const monthViews = monthArticles.reduce(
            (sum, a) => sum + (a.view_count || 0),
            0,
          );

          monthlyPerformance.push({
            month: monthStr,
            articles: monthArticles.length,
            views: monthViews,
          });
        }

        const categoryBreakdown: { category: string; count: number }[] = [];
        categories?.forEach((cat) => {
          const count =
            articles?.filter((a) => a.category_id === cat.id).length || 0;
          if (count > 0) {
            categoryBreakdown.push({ category: cat.name, count });
          }
        });

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
          monthly_performance: monthlyPerformance,
          category_breakdown: categoryBreakdown,
        };
      });

      const stats = await Promise.all(statsPromises);
      setReporterStats(stats);
    } catch (err) {
      console.error("Error fetching reporter stats:", err);
    }
  };

  const getReporterPerformanceChart = (reporter: ReporterStats) => ({
    tooltip: { trigger: "axis" },
    legend: { data: ["Articles", "Views"], textStyle: { fontSize: 10 } },
    grid: { left: "10%", right: "10%", bottom: "15%", top: "20%" },
    xAxis: {
      type: "category",
      data: reporter.monthly_performance.map((m) => m.month.split(" ")[0]),
      axisLabel: { fontSize: 9 },
    },
    yAxis: [
      { type: "value", axisLabel: { fontSize: 9 } },
      { type: "value", axisLabel: { fontSize: 9 } },
    ],
    series: [
      {
        name: "Articles",
        type: "bar",
        data: reporter.monthly_performance.map((m) => m.articles),
        itemStyle: { color: "#3b82f6", borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "Views",
        type: "line",
        yAxisIndex: 1,
        data: reporter.monthly_performance.map((m) => m.views),
        itemStyle: { color: "#8b5cf6" },
        lineStyle: { width: 2 },
      },
    ],
  });

  const getReporterCategoryChart = (reporter: ReporterStats) => ({
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "70%",
        label: { fontSize: 10 },
        data: reporter.category_breakdown.map((c) => ({
          value: c.count,
          name: c.category,
        })),
      },
    ],
  });

  const getReporterEngagementChart = (reporter: ReporterStats) => ({
    tooltip: { trigger: "axis" },
    grid: { left: "20%", right: "10%", bottom: "10%", top: "10%" },
    xAxis: { type: "value", axisLabel: { fontSize: 9 } },
    yAxis: {
      type: "category",
      data: ["Likes", "Comments", "Bookmarks", "Shares"],
      axisLabel: { fontSize: 10 },
    },
    series: [
      {
        type: "bar",
        data: [
          { value: reporter.total_likes, itemStyle: { color: "#f43f5e" } },
          { value: reporter.total_comments, itemStyle: { color: "#3b82f6" } },
          { value: reporter.total_bookmarks, itemStyle: { color: "#f59e0b" } },
          { value: reporter.total_shares, itemStyle: { color: "#10b981" } },
        ],
        itemStyle: { borderRadius: [0, 3, 3, 0] },
      },
    ],
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
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
      <div className="space-y-2 p-4 md:p-0">
        <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {" "}
      <Toaster position="top-right" />
      <div className="space-y-3 p-4 md:p-0">
        {/* Header */}
        <div>
          <h1 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
            <ChartBar
              className="h-4 w-4 md:h-5 md:w-5 text-blue-600"
              weight="duotone"
            />
            Statistics
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab("admins");
              setSelectedReporter(null);
            }}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "admins"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" weight="duotone" />
            <span className="hidden sm:inline">Admins</span> (
            {adminStats.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("reporters");
              setSelectedReporter(null);
            }}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "reporters"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <PencilLine className="h-3.5 w-3.5" weight="duotone" />
            <span className="hidden sm:inline">Reporters</span> (
            {reporterStats.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("pending");
              setSelectedReporter(null);
              setSelectedPending(null);
            }}
            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <Clock className="h-3.5 w-3.5" weight="duotone" />
            <span className="hidden sm:inline">Pending</span> (
            {pendingReporters.length})
          </button>
        </div>

        {/* ADMIN STATISTICS */}
        {activeTab === "admins" && (
          <div className="space-y-2">
            {adminStats.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 py-8 text-center">
                <ShieldCheck
                  className="h-8 w-8 text-gray-400 mx-auto mb-2"
                  weight="duotone"
                />
                <p className="text-xs text-gray-600">No admin activity</p>
              </div>
            ) : (
              adminStats.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                          <ShieldCheck
                            className="h-4 w-4 text-white"
                            weight="bold"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {admin.full_name}
                          </p>
                          <p className="text-[10px] text-gray-600 truncate">
                            {admin.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* REPORTER STATISTICS */}
        {activeTab === "reporters" && (
          <div className="space-y-2">
            {reporterStats.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 py-8 text-center">
                <PencilLine
                  className="h-8 w-8 text-gray-400 mx-auto mb-2"
                  weight="duotone"
                />
                <p className="text-xs text-gray-600">No reporters</p>
              </div>
            ) : (
              reporterStats.map((reporter) => (
                <div
                  key={reporter.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-purple-300 transition-colors"
                  onClick={() => setSelectedReporter(reporter)}
                >
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-white" weight="bold" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {reporter.full_name}
                          </p>
                          <p className="text-[10px] text-gray-600 truncate">
                            {reporter.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:gap-4">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-600">Articles</p>
                          <p className="text-xs sm:text-sm font-bold text-gray-900">
                            {reporter.total_articles}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-600">Views</p>
                          <p className="text-xs sm:text-sm font-bold text-indigo-600">
                            {formatNumber(reporter.total_views)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-600">Likes</p>
                          <p className="text-xs sm:text-sm font-bold text-rose-600">
                            {formatNumber(reporter.total_likes)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-600">Comments</p>
                          <p className="text-xs sm:text-sm font-bold text-blue-600">
                            {formatNumber(reporter.total_comments)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded">
                        ✓ {reporter.approved}
                      </span>
                      {reporter.pending > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-700 rounded">
                          ⏱ {reporter.pending}
                        </span>
                      )}
                      {reporter.rejected > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded">
                          ✕ {reporter.rejected}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* PENDING REPORTERS */}
        {activeTab === "pending" && (
          <div className="space-y-2">
            {pendingReporters.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 py-8 text-center">
                <Clock
                  className="h-8 w-8 text-gray-400 mx-auto mb-2"
                  weight="duotone"
                />
                <p className="text-xs text-gray-600">
                  No pending verifications
                </p>
              </div>
            ) : (
              pendingReporters.map((reporter) => (
                <div
                  key={reporter.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => setSelectedPending(reporter)}
                >
                  <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-white" weight="bold" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {reporter.full_name}
                          </p>
                          <p className="text-[10px] text-gray-600">
                            {reporter.email}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-[10px] font-semibold bg-yellow-100 text-yellow-700 rounded">
                        Pending Review
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* MINIMAL RIGHT SIDEBAR */}
      {selectedReporter && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setSelectedReporter(null)}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
            {/* Minimal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-gray-700" weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {selectedReporter.full_name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedReporter.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReporter(null)}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="h-5 w-5 text-gray-700" weight="bold" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Performance Chart */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-900 mb-2 sm:mb-3">
                  Monthly Performance (6 Months)
                </h3>
                <ReactECharts
                  option={getReporterPerformanceChart(selectedReporter)}
                  style={{ height: "180px" }}
                />
              </div>

              {/* Category Chart */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-900 mb-2 sm:mb-3">
                  Category Distribution
                </h3>
                <ReactECharts
                  option={getReporterCategoryChart(selectedReporter)}
                  style={{ height: "180px" }}
                />
              </div>

              {/* Engagement Chart */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                <h3 className="text-xs font-bold text-gray-900 mb-2 sm:mb-3">
                  Engagement Metrics
                </h3>
                <ReactECharts
                  option={getReporterEngagementChart(selectedReporter)}
                  style={{ height: "160px" }}
                />
              </div>

              {/* Articles List */}
              <div>
                <h3 className="text-xs font-bold text-gray-900 mb-2 sm:mb-3">
                  All Articles ({selectedReporter.articles.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedReporter.articles.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-8">
                      No articles yet
                    </p>
                  ) : (
                    selectedReporter.articles.map((article) => (
                      <div
                        key={article.id}
                        className="p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {article.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${getStatusBadge(
                                  article.status,
                                )}`}
                              >
                                {article.status}
                              </span>
                              <span className="text-[9px] text-gray-600">
                                {article.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3 text-indigo-500" />
                              <span className="text-[9px] font-semibold text-gray-700">
                                {formatNumber(article.view_count)}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Heart
                                className="h-3 w-3 text-rose-500"
                                weight="fill"
                              />
                              <span className="text-[9px] font-semibold text-gray-700">
                                {article.likes}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <ChatCircle
                                className="h-3 w-3 text-blue-500"
                                weight="fill"
                              />
                              <span className="text-[9px] font-semibold text-gray-700">
                                {article.comments}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* PENDING REPORTER MODAL */}
      {selectedPending && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setSelectedPending(null)}
          />

          {/* Modal */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <IdentificationCard
                    className="h-4 w-4 text-orange-700"
                    weight="bold"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {selectedPending.full_name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {selectedPending.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPending(null)}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="h-5 w-5 text-gray-700" weight="bold" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Registration Date */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Registered</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(selectedPending.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </p>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">
                  Verification Documents
                </h3>

                {/* Aadhar */}
                {selectedPending.aadhar_url && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Aadhar Card
                    </p>
                    <img
                      src={selectedPending.aadhar_url}
                      alt="Aadhar"
                      className="w-full max-w-xs rounded border border-gray-200 cursor-pointer hover:opacity-90"
                      onClick={() =>
                        window.open(selectedPending.aadhar_url, "_blank")
                      }
                    />
                  </div>
                )}

                {/* PAN */}
                {selectedPending.pan_url && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      PAN Card
                    </p>
                    <img
                      src={selectedPending.pan_url}
                      alt="PAN"
                      className="w-full max-w-xs rounded border border-gray-200 cursor-pointer hover:opacity-90"
                      onClick={() =>
                        window.open(selectedPending.pan_url, "_blank")
                      }
                    />
                  </div>
                )}

                {/* Passport Photo 1 */}
                {selectedPending.passport_photo_1_url && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Passport Photo 1
                    </p>
                    <img
                      src={selectedPending.passport_photo_1_url}
                      alt="Passport 1"
                      className="w-32 h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90"
                      onClick={() =>
                        window.open(
                          selectedPending.passport_photo_1_url,
                          "_blank",
                        )
                      }
                    />
                  </div>
                )}

                {/* Passport Photo 2 */}
                {selectedPending.passport_photo_2_url && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Passport Photo 2
                    </p>
                    <img
                      src={selectedPending.passport_photo_2_url}
                      alt="Passport 2"
                      className="w-32 h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90"
                      onClick={() =>
                        window.open(
                          selectedPending.passport_photo_2_url,
                          "_blank",
                        )
                      }
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => handleRejectReporter(selectedPending.id)}
                  disabled={processingId === selectedPending.id}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" weight="bold" />
                  {processingId === selectedPending.id
                    ? "Processing..."
                    : "Reject"}
                </button>
                <button
                  onClick={() => handleApproveReporter(selectedPending.id)}
                  disabled={processingId === selectedPending.id}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-5 w-5" weight="bold" />
                  {processingId === selectedPending.id
                    ? "Processing..."
                    : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
