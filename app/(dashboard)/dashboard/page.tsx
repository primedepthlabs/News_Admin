"use client";
import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Newspaper,
  Fire,
  Eye,
  Heart,
  ChatCircle,
  TrendUp,
  TrendDown,
  Calendar,
  UserCircle,
  ShareNetwork,
} from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Type definitions
type NewsItem = {
  id: number;
  title: string;
  view_count: number;
  created_at: string;
  category_id: number | null;
  author_id?: string;
};

type Author = {
  id: string;
  name: string;
  email: string;
  article_count: number;
};

type CategoryStat = {
  name: string;
  count: number;
};

type ViewData = {
  day: string;
  views: number;
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 w-full bg-gray-200 animate-pulse rounded-lg"
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 w-full bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-80 w-full bg-gray-200 animate-pulse rounded-lg" />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNews: 0,
    breakingNews: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
  });
  const [viewsData, setViewsData] = useState<ViewData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);
  const [recentArticles, setRecentArticles] = useState<NewsItem[]>([]);
  const [topAuthors, setTopAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Get user role
      const { data: userData, error: userError } = await supabase
        .from("dashboardUsers")
        .select("role, permissions")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user data:", userError);
        router.push("/login");
        return;
      }

      setUserRole(userData.role);

      // Only superadmin and admin can access dashboard
      // Only superadmin OR users with /dashboard permission
      if (userData.role !== "superadmin") {
        // Check if user has permission
        if (
          !userData.permissions ||
          !userData.permissions.includes("/dashboard")
        ) {
          router.push("/my-panel"); // Redirect if no permission
          return;
        }
      }

      setAuthChecked(true);
    };

    checkAuth();
  }, [router]);
  useEffect(() => {
    if (!authChecked) return; // Don't fetch stats until auth is checked

    const fetchAllStats = async () => {
      setLoading(true);

      try {
        // Fetch basic counts
        const [
          usersCount,
          newsCount,
          breakingCount,
          likesCount,
          commentsCount,
          newsData,
          categoriesData,
          recentNews,
        ] = await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("news").select("*", { count: "exact", head: true }),
          supabase
            .from("news")
            .select("*", { count: "exact", head: true })
            .eq("is_breaking", true),
          supabase.from("likes").select("*", { count: "exact", head: true }),
          supabase.from("comments").select("*", { count: "exact", head: true }),
          supabase.from("news").select("view_count, share_count"),
          supabase.from("categories").select("id, name"),
          supabase
            .from("news")
            .select("id, title, view_count, created_at, category_id, author_id")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        // Calculate total views and shares
        const totalViewCount =
          newsData.data?.reduce(
            (sum, item) => sum + (item.view_count || 0),
            0,
          ) || 0;

        const totalShareCount =
          newsData.data?.reduce(
            (sum, item) => sum + (item.share_count || 0),
            0,
          ) || 0;

        setStats({
          totalUsers: usersCount.count || 0,
          totalNews: newsCount.count || 0,
          breakingNews: breakingCount.count || 0,
          totalViews: totalViewCount,
          totalLikes: likesCount.count || 0,
          totalComments: commentsCount.count || 0,
          totalShares: totalShareCount,
        });

        // Fetch real daily views from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentNewsData } = await supabase
          .from("news")
          .select("created_at, view_count")
          .gte("created_at", sevenDaysAgo.toISOString());

        // Group by day
        const viewsByDay: { [key: string]: number } = {};
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Initialize last 7 days with 0 views
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = dayNames[date.getDay()];
          viewsByDay[dayName] = 0;
        }

        // Aggregate views by day
        recentNewsData?.forEach((item) => {
          const date = new Date(item.created_at);
          const dayName = dayNames[date.getDay()];
          viewsByDay[dayName] =
            (viewsByDay[dayName] || 0) + (item.view_count || 0);
        });

        const viewsChartData = Object.keys(viewsByDay).map((day) => ({
          day,
          views: viewsByDay[day],
        }));

        setViewsData(viewsChartData);

        // Get category distribution
        const categoryStats = await Promise.all(
          (categoriesData.data || []).map(async (cat) => {
            const { count } = await supabase
              .from("news")
              .select("*", { count: "exact", head: true })
              .eq("category_id", cat.id);

            return {
              name: cat.name,
              count: count || 0,
            };
          }),
        );

        setCategoryData(
          categoryStats
            .filter((c) => c.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
        );

        setRecentArticles(recentNews.data || []);

        // Fetch real top authors
        const { data: allNews } = await supabase
          .from("news")
          .select("author_id");

        // Count articles per author
        const authorCounts: { [key: string]: number } = {};
        allNews?.forEach((article) => {
          if (article.author_id) {
            authorCounts[article.author_id] =
              (authorCounts[article.author_id] || 0) + 1;
          }
        });

        // Get top 5 author IDs
        const topAuthorIds = Object.entries(authorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id]) => id);

        if (topAuthorIds.length > 0) {
          const { data: authorsData } = await supabase
            .from("users")
            .select("id, name, email")
            .in("id", topAuthorIds);

          const authorsWithCounts: Author[] =
            authorsData?.map((author) => ({
              id: author.id,
              name: author.name,
              email: author.email,
              article_count: authorCounts[author.id] || 0,
            })) || [];

          // Sort by article count
          authorsWithCounts.sort((a, b) => b.article_count - a.article_count);
          setTopAuthors(authorsWithCounts);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllStats();
  }, [authChecked]);

  if (loading || !authChecked) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-900 text-white">
              {userRole === "superadmin" ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
        {/* Total Users */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-blue-100 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-blue-600" weight="duotone" />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              12%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Users</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalUsers.toLocaleString()}
          </p>
        </div>

        {/* Total Articles */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-purple-100 flex items-center justify-center">
              <Newspaper
                className="h-3.5 w-3.5 text-purple-600"
                weight="duotone"
              />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              8%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Articles</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalNews.toLocaleString()}
          </p>
        </div>

        {/* Breaking News */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-red-100 flex items-center justify-center">
              <Fire className="h-3.5 w-3.5 text-red-600" weight="duotone" />
            </div>
            <span className="text-[9px] text-red-600 font-medium flex items-center gap-0.5">
              <TrendDown className="h-2.5 w-2.5" weight="bold" />
              3%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Breaking</p>
          <p className="text-base font-bold text-gray-900">
            {stats.breakingNews.toLocaleString()}
          </p>
        </div>

        {/* Total Views */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-green-100 flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 text-green-600" weight="duotone" />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              24%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Views</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalViews.toLocaleString()}
          </p>
        </div>

        {/* Total Likes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-pink-100 flex items-center justify-center">
              <Heart className="h-3.5 w-3.5 text-pink-600" weight="duotone" />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              18%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Likes</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalLikes.toLocaleString()}
          </p>
        </div>

        {/* Total Comments */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-orange-100 flex items-center justify-center">
              <ChatCircle
                className="h-3.5 w-3.5 text-orange-600"
                weight="duotone"
              />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              15%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Comments</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalComments.toLocaleString()}
          </p>
        </div>

        {/* Total Shares */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-cyan-100 flex items-center justify-center">
              <ShareNetwork
                className="h-3.5 w-3.5 text-cyan-600"
                weight="duotone"
              />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              22%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Shares</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalShares.toLocaleString()}
          </p>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-7 w-7 rounded bg-indigo-100 flex items-center justify-center">
              <TrendUp
                className="h-3.5 w-3.5 text-indigo-600"
                weight="duotone"
              />
            </div>
            <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <TrendUp className="h-2.5 w-2.5" weight="bold" />
              5%
            </span>
          </div>
          <p className="text-[9px] text-gray-600 mb-0.5">Engagement</p>
          <p className="text-base font-bold text-gray-900">
            {stats.totalViews > 0
              ? (
                  ((stats.totalLikes +
                    stats.totalComments +
                    stats.totalShares) /
                    stats.totalViews) *
                  100
                ).toFixed(1)
              : "0.0"}
            %
          </p>
        </div>
      </div>
      {/* Charts Section - Inline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Views Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <TrendUp className="h-5 w-5" />
              Weekly Views
            </h3>
            <p className="text-sm text-gray-600">
              Content engagement over the last 7 days
            </p>
          </div>
          <div className="p-6 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number | undefined) =>
                    value !== undefined
                      ? [value.toLocaleString(), "Views"]
                      : ["0", "Views"]
                  }
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={{ fill: "#000000", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Articles by Category Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <Newspaper className="h-5 w-5" />
              Articles by Category
            </h3>
            <p className="text-sm text-gray-600">Top 5 content categories</p>
          </div>
          <div className="p-6 pt-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number | undefined) =>
                      value !== undefined
                        ? [value, "Articles"]
                        : [0, "Articles"]
                    }
                  />
                  <Bar
                    dataKey="count"
                    fill="#000000" // Change from "#3b82f6" to "#000000"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-75 text-gray-600">
                No category data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Articles and Top Authors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <Calendar className="h-5 w-5" />
              Recent Articles
            </h3>
            <p className="text-sm text-gray-600">Latest published content</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-3">
              {recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.view_count.toLocaleString()} views
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-1 text-xs border border-gray-300 rounded-md bg-white">
                      Published
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 text-center py-8">
                  No articles yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Authors */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-1">
              <UserCircle className="h-5 w-5" />
              Top Authors
            </h3>
            <p className="text-sm text-gray-600">Most active contributors</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-3">
              {topAuthors.length > 0 ? (
                topAuthors.map((author, index) => (
                  <div
                    key={author.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                        #{index + 1}
                      </span>
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-black font-semibold text-sm">
                        {/* Change from "bg-blue-100 text-blue-600" to "bg-gray-200 text-black" */}{" "}
                        {author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{author.name}</p>
                        <p className="text-xs text-gray-600">{author.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {author.article_count}
                      </p>
                      <p className="text-xs text-gray-600">articles</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 text-center py-8">
                  No authors yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
