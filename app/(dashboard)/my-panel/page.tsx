"use client";

import { useState, useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";

import {
  ChartBar,
  Article,
  Funnel,
  CalendarBlank,
  Heart,
  ChatCircle,
  BookmarkSimple,
  Plus,
  Eye,
  Share,
  CheckCircle,
  Pencil,
  Trash,
  X,
  Clock,
  XCircle,
  TrendUp,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  DotsSixVertical,
  UserCircle,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SocialIcon } from "react-social-icons";
import TiptapEditor from "@/components/TiptapEditor";
type MediaItem = {
  type: "image" | "video";
  url: string;
  order: number;
  file?: File;
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

// ============================
// REPLACEMENT COMPONENTS FOR TREMOR
// ============================

// Stat Card Component (replaces Tremor Card + Metric)
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-2 sm:p-3 border border-gray-100">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          <p className="text-[9px] sm:text-[10px] text-gray-600 font-medium">
            {title}
          </p>
          <Icon weight="duotone" className={`h-3 w-3 sm:h-4 sm:w-4 ${color}`} />
        </div>
        <p className="text-base sm:text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

// Chart Card Wrapper (replaces Tremor Card)
const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 border border-gray-100">
      <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-900">
        {title}
      </h3>
      {children}
    </div>
  );
};

// Tab Components (replaces Tremor TabGroup/TabList/Tab)
const TabList = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mb-3 flex gap-2 border-b border-gray-200">{children}</div>
  );
};

const Tab = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
        active
          ? "text-gray-900 border-gray-900"
          : "text-gray-600 border-transparent hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
};

// Grid Component (replaces Tremor Grid)
const Grid = ({
  cols,
  children,
}: {
  cols: number;
  children: React.ReactNode;
}) => {
  const gridColsClass = cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1";
  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-3 mb-3`}>
      {children}
    </div>
  );
};

// ============================
// SKELETON LOADERS
// ============================

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
              Status
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
                <div className="h-4 w-20 bg-gray-100 animate-pulse rounded-full" />
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

// ============================
// MAIN COMPONENT
// ============================
// ============================
// ADD/EDIT ARTICLE MODAL
// ============================
const ArticleModal = ({
  isOpen,
  onClose,
  onSave,
  editForm,
  setEditForm,
  mediaItems,
  setMediaItems,
  categories,
  uploading,
  isEditMode = false,
  handleAddImages,
  handleAddVideo,
  handleVideoUrlChange,
  handleRemoveMedia,
  handleMoveUp,
  handleMoveDown,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleAddLink,
  handleRemoveLink,
  handleLinkChange,
  multipleMediaInputRef,
  draggedIndex,
  getYouTubeVideoId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editForm: any;
  setEditForm: any;
  mediaItems: MediaItem[];
  setMediaItems: any;
  categories: Category[];
  uploading: boolean;
  isEditMode?: boolean;
  handleAddImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddVideo: () => void;
  handleVideoUrlChange: (index: number, url: string) => void;
  handleRemoveMedia: (index: number) => void;
  handleMoveUp: (index: number) => void;
  handleMoveDown: (index: number) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleAddLink: () => void;
  handleRemoveLink: (index: number) => void;
  handleLinkChange: (
    index: number,
    field: "url" | "label",
    value: string,
  ) => void;
  multipleMediaInputRef: React.RefObject<HTMLInputElement>;
  draggedIndex: number | null;
  getYouTubeVideoId: (url: string) => string | null;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? "Edit Article" : "Create New Article"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter article title..."
                  required
                />
              </div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Article Content *
              </label>
              <TiptapEditor
                value={editForm.content}
                onChange={(value: string) =>
                  setEditForm({ ...editForm, content: value })
                }
                style={{ minHeight: "200px" }}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Excerpt (Short Description)
              </label>
              <textarea
                value={editForm.excerpt}
                onChange={(e) =>
                  setEditForm({ ...editForm, excerpt: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Brief summary of the article..."
              />
            </div>

            {/* Category & Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editForm.category_id}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., New York, USA"
                />
              </div>
            </div>

            {/* Author Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Author Name
                </label>
                <input
                  type="text"
                  value={editForm.author_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, author_name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Author Bio
                </label>
                <input
                  type="text"
                  value={editForm.author_bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, author_bio: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Short bio or tagline"
                />
              </div>
            </div>

            {/* Breaking News Checkbox */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_breaking}
                  onChange={(e) =>
                    setEditForm({ ...editForm, is_breaking: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Mark as Breaking News
                </span>
              </label>
            </div>

            {/* Media Section */}
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Media (Images & Videos)
              </label>

              {/* Media Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => multipleMediaInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  Add Images
                </button>
                <button
                  type="button"
                  onClick={handleAddVideo}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Video URL
                </button>
              </div>

              <input
                ref={multipleMediaInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImages}
                className="hidden"
              />

              {/* Media Items List */}
              {mediaItems.length > 0 && (
                <div className="space-y-2">
                  {mediaItems.map((item, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 transition-all ${
                        draggedIndex === index
                          ? "border-blue-500 shadow-lg"
                          : "border-transparent"
                      }`}
                    >
                      <DotsSixVertical
                        className="h-5 w-5 text-gray-400 cursor-move"
                        weight="bold"
                      />

                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={`Media ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-purple-100 rounded flex items-center justify-center">
                          <span className="text-xs font-semibold text-purple-700">
                            VIDEO
                          </span>
                        </div>
                      )}

                      <div className="flex-1">
                        {item.type === "video" ? (
                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) =>
                              handleVideoUrlChange(index, e.target.value)
                            }
                            placeholder="Enter YouTube URL..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                          />
                        ) : (
                          <p className="text-xs text-gray-600 truncate">
                            {item.file?.name || item.url}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === mediaItems.length - 1}
                          className="p-1.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(index)}
                          className="p-1.5 hover:bg-red-100 rounded text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Links Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Social Media Links
                </label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </button>
              </div>

              <div className="space-y-3">
                {editForm.links.map((link: any, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) =>
                        handleLinkChange(index, "url", e.target.value)
                      }
                      placeholder="https://twitter.com/username"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) =>
                        handleLinkChange(index, "label", e.target.value)
                      }
                      placeholder="Label (optional)"
                      className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {editForm.links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={uploading || !editForm.title || !editForm.content}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>{isEditMode ? "Update Article" : "Create Article"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================
// DELETE CONFIRMATION MODAL
// ============================
const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  newsTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newsTitle: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash className="h-6 w-6 text-red-600" weight="duotone" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            Delete Article?
          </h3>

          <p className="text-sm text-gray-600 text-center mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">"{newsTitle}"</span>?
            This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default function MyPanel() {
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNews, setTotalNews] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const router = useRouter();

  const [uploading, setUploading] = useState(false);

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const multipleMediaInputRef = useRef<HTMLInputElement>(
    null,
  ) as React.RefObject<HTMLInputElement>;
  const [editForm, setEditForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category_id: "",
    location: "",
    author_name: "",
    author_bio: "",
    is_breaking: false,
    links: [{ url: "", label: "" }],
  });
  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({
    from: undefined,
    to: undefined,
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterBreaking, setFilterBreaking] = useState("all");

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<{
    totalArticles: number;
    totalViews: number;
    totalShares: number;
    totalLikes: number;
    totalComments: number;
    totalBookmarks: number;
    approvalRate: number;
    statusDistribution: Array<{ name: string; value: number }>;
    categoryDistribution: Array<{ name: string; Articles: number }>;
    performanceOverTime: Array<{ date: string; Views: number; Shares: number }>;
    topArticles: Array<{ name: string; Views: number; Shares: number }>;
  }>({
    totalArticles: 0,
    totalViews: 0,
    totalShares: 0,
    totalLikes: 0,
    totalComments: 0,
    totalBookmarks: 0,
    approvalRate: 0,
    statusDistribution: [],
    categoryDistribution: [],
    performanceOverTime: [],
    topArticles: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setAuthChecked(true);
          router.push("/login");
          return;
        }

        setCurrentUserId(session.user.id);

        // Get user role and permissions
        const { data: userData, error: userError } = await supabase
          .from("dashboardUsers")
          .select("role, permissions")
          .eq("id", session.user.id)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user data:", userError);
          setAuthChecked(true);
          router.push("/login");
          return;
        }

        setUserRole(userData.role);
        setUserPermissions(userData.permissions || []);

        setAuthChecked(true);
      } catch (err) {
        console.error("Auth check error:", err);
        setAuthChecked(true);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Real-time permissions check
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("user-permissions-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "dashboardUsers",
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("Permissions updated:", payload);

          const newRole = payload.new.role;
          const newPermissions = payload.new.permissions || [];

          setUserRole(newRole);
          setUserPermissions(newPermissions);

          const hasPermission =
            newRole === "superadmin" || newPermissions.includes("/my-panel");

          if (!hasPermission) {
            console.log("Access to My Panel revoked");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("category-dropdown-articles");
      const target = event.target as HTMLElement;

      if (
        dropdown &&
        !dropdown.contains(target) &&
        !target.closest("[data-category-button]")
      ) {
        dropdown.classList.add("hidden");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
    if (!currentUserId) return;

    setLoading(true);
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("news")
      .select("*", { count: "exact" })
      .eq("author_id", currentUserId)
      .order("created_at", { ascending: false });

    if (dateRange.from) {
      query = query.gte("created_at", dateRange.from.toISOString());
    }
    if (dateRange.to) {
      query = query.lte("created_at", dateRange.to.toISOString());
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    if (filterCategory.length > 0) {
      const categoryIds = filterCategory.map((id) => parseInt(id));
      query = query.in("category_id", categoryIds);
    }

    if (filterBreaking !== "all") {
      query = query.eq("is_breaking", filterBreaking === "breaking");
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching news:", error);
    } else {
      setNews(data || []);
      setTotalNews(count || 0);
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    if (!currentUserId) return;

    let query = supabase
      .from("news")
      .select(
        `
    *,
    likes:likes(count),
    comments:comments(count),
    bookmarks:bookmarks(count)
  `,
      )
      .eq("author_id", currentUserId);

    if (activeTab === 1) {
      if (dateRange.from) {
        query = query.gte("created_at", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte("created_at", dateRange.to.toISOString());
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterCategory.length > 0) {
        const categoryIds = filterCategory.map((id) => parseInt(id));
        query = query.in("category_id", categoryIds);
      }

      if (filterBreaking !== "all") {
        query = query.eq("is_breaking", filterBreaking === "breaking");
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching analytics:", error);
      return;
    }

    const totalArticles = data.length;
    const totalViews = data.reduce(
      (sum, item) => sum + (item.view_count || 0),
      0,
    );
    const totalShares = data.reduce(
      (sum, item) => sum + (item.share_count || 0),
      0,
    );

    const totalLikes = data.reduce(
      (sum, item) => sum + (item.likes?.[0]?.count || 0),
      0,
    );
    const totalComments = data.reduce(
      (sum, item) => sum + (item.comments?.[0]?.count || 0),
      0,
    );
    const totalBookmarks = data.reduce(
      (sum, item) => sum + (item.bookmarks?.[0]?.count || 0),
      0,
    );

    const approvedCount = data.filter(
      (item) => item.status === "approved",
    ).length;
    const approvalRate =
      totalArticles > 0 ? (approvedCount / totalArticles) * 100 : 0;

    const statusDistribution = [
      {
        name: "Approved",
        value: data.filter((i) => i.status === "approved").length,
      },
      {
        name: "Pending",
        value: data.filter((i) => i.status === "pending").length,
      },
      {
        name: "Rejected",
        value: data.filter((i) => i.status === "rejected").length,
      },
    ].filter((item) => item.value > 0);

    const categoryMap: { [key: string]: number } = {};
    data.forEach((item) => {
      if (item.category_id) {
        const catName = getCategoryName(item.category_id);
        categoryMap[catName] = (categoryMap[catName] || 0) + 1;
      }
    });
    const categoryDistribution = Object.entries(categoryMap).map(
      ([name, value]) => ({
        name,
        Articles: value,
      }),
    );

    const topArticles = [...data]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)
      .map((item) => ({
        name: item.title.substring(0, 30) + "...",
        Views: item.view_count || 0,
        Shares: item.share_count || 0,
      }));

    const performanceOverTime = generateTimeSeriesData(data);

    setAnalyticsData({
      totalArticles,
      totalViews,
      totalShares,
      totalLikes,
      totalComments,
      totalBookmarks,
      approvalRate,
      statusDistribution,
      categoryDistribution,
      performanceOverTime,
      topArticles,
    });
  };

  const generateTimeSeriesData = (data: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split("T")[0];
    });

    return last30Days.map((date) => {
      const dayArticles = data.filter((item) =>
        item.created_at.startsWith(date),
      );
      return {
        date,
        Views: dayArticles.reduce(
          (sum, item) => sum + (item.view_count || 0),
          0,
        ),
        Shares: dayArticles.reduce(
          (sum, item) => sum + (item.share_count || 0),
          0,
        ),
      };
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      if (activeTab === 0) {
        fetchAnalytics();
      } else {
        fetchNews(currentPage);
      }
    }
  }, [
    currentPage,
    currentUserId,
    activeTab,
    dateRange,
    filterStatus,
    filterCategory,
    filterBreaking,
  ]);

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "No Category";
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
      category_id: "",
      location: "",
      author_name: "",
      author_bio: "",
      is_breaking: false,
      links: [{ url: "", label: "" }],
    });
    setMediaItems([]);
    if (multipleMediaInputRef.current) {
      multipleMediaInputRef.current.value = "";
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 5MB`);
        return false;
      }
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    const newMediaItems: MediaItem[] = [];
    let processedCount = 0;

    validFiles.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newMediaItems.push({
          type: "image",
          url: reader.result as string,
          order: mediaItems.length + idx,
          file: file,
        });

        processedCount++;
        if (processedCount === validFiles.length) {
          setMediaItems((prev) =>
            [...prev, ...newMediaItems].map((item, index) => ({
              ...item,
              order: index,
            })),
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddVideo = () => {
    const newMedia: MediaItem = {
      type: "video",
      url: "",
      order: mediaItems.length,
    };
    setMediaItems((prev) => [...prev, newMedia]);
  };

  const handleVideoUrlChange = (index: number, url: string) => {
    setMediaItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, url } : item)),
    );
  };

  const handleRemoveMedia = (index: number) => {
    setMediaItems((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i })),
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    setMediaItems((prev) => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [
        newItems[index],
        newItems[index - 1],
      ];
      return newItems.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === mediaItems.length - 1) return;

    setMediaItems((prev) => {
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [
        newItems[index + 1],
        newItems[index],
      ];
      return newItems.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    setMediaItems((prev) => {
      const newItems = [...prev];
      const draggedItem = newItems[draggedIndex];
      newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, draggedItem);
      return newItems.map((item, i) => ({ ...item, order: i }));
    });

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("news-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split("/storage/v1/object/public/news-images/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from("news-images").remove([filePath]);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
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
      category_id: newsItem.category_id?.toString() || "",
      location: newsItem.location || "",
      author_name: newsItem.author_name || "",
      author_bio: newsItem.author_bio || "",
      is_breaking: newsItem.is_breaking,
      links:
        newsItem.links && newsItem.links.length > 0
          ? newsItem.links
          : [{ url: "", label: "" }],
    });

    const existingMedia: MediaItem[] = [];

    if (newsItem.image && (!newsItem.media || newsItem.media.length === 0)) {
      existingMedia.push({
        type: "image",
        url: newsItem.image,
        order: 0,
      });
    }

    if (newsItem.media && newsItem.media.length > 0) {
      existingMedia.push(...newsItem.media.sort((a, b) => a.order - b.order));
    }

    setMediaItems(existingMedia.map((item, i) => ({ ...item, order: i })));
    setIsEditDialogOpen(true);
  };

  const handleAddLink = () => {
    setEditForm({
      ...editForm,
      links: [...editForm.links, { url: "", label: "" }],
    });
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = editForm.links.filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      links: newLinks.length > 0 ? newLinks : [{ url: "", label: "" }],
    });
  };

  const handleLinkChange = (
    index: number,
    field: "url" | "label",
    value: string,
  ) => {
    const newLinks = [...editForm.links];
    newLinks[index][field] = value;
    setEditForm({ ...editForm, links: newLinks });
  };

  const handleAddNews = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setUploading(true);

    const processedMedia: MediaItem[] = [];
    for (const item of mediaItems) {
      if (item.type === "image" && item.file) {
        const uploadedUrl = await uploadImage(item.file);
        if (uploadedUrl) {
          processedMedia.push({
            type: "image",
            url: uploadedUrl,
            order: item.order,
          });
        }
      } else if (item.type === "video" && item.url.trim()) {
        processedMedia.push({
          type: "video",
          url: item.url,
          order: item.order,
        });
      }
    }

    const articleImage =
      processedMedia.find((item) => item.type === "image")?.url || null;

    const validLinks = editForm.links.filter((link) => link.url.trim() !== "");

    const { error } = await supabase.from("news").insert([
      {
        title: editForm.title,
        excerpt: editForm.excerpt || null,
        content: editForm.content,
        image: articleImage,
        media: processedMedia.length > 0 ? processedMedia : null,
        category_id: editForm.category_id
          ? parseInt(editForm.category_id)
          : null,
        location: editForm.location || null,
        author_name: editForm.author_name || null,
        author_bio: editForm.author_bio || null,
        is_breaking: editForm.is_breaking,
        author_id: session?.user.id || null,
        status: "pending",
        links: validLinks.length > 0 ? validLinks : null,
      },
    ]);

    setUploading(false);

    if (error) {
      console.error("Error adding news:", error);
      alert("Failed to create article");
    } else {
      fetchNews(currentPage);
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateNews = async () => {
    if (!selectedNews) return;

    setUploading(true);

    const oldMedia = selectedNews.media || [];
    const processedMedia: MediaItem[] = [];

    for (const item of mediaItems) {
      if (item.type === "image" && item.file) {
        const uploadedUrl = await uploadImage(item.file);
        if (uploadedUrl) {
          processedMedia.push({
            type: "image",
            url: uploadedUrl,
            order: item.order,
          });
        }
      } else if (item.url && !item.url.startsWith("data:")) {
        processedMedia.push({
          type: item.type,
          url: item.url,
          order: item.order,
        });
      } else if (item.type === "video" && item.url.trim()) {
        processedMedia.push({
          type: "video",
          url: item.url,
          order: item.order,
        });
      }
    }

    const removedImages = oldMedia
      .filter((old) => old.type === "image")
      .filter((old) => !processedMedia.find((pm) => pm.url === old.url));

    for (const removed of removedImages) {
      await deleteImage(removed.url);
    }

    if (
      selectedNews.image &&
      !processedMedia.find((pm) => pm.url === selectedNews.image)
    ) {
      await deleteImage(selectedNews.image);
    }

    const articleImage =
      processedMedia.find((item) => item.type === "image")?.url || null;

    const validLinks = editForm.links.filter((link) => link.url.trim() !== "");

    const { error } = await supabase
      .from("news")
      .update({
        title: editForm.title,
        excerpt: editForm.excerpt || null,
        content: editForm.content,
        image: articleImage,
        media: processedMedia.length > 0 ? processedMedia : null,
        category_id: editForm.category_id
          ? parseInt(editForm.category_id)
          : null,
        location: editForm.location || null,
        author_name: editForm.author_name || null,
        author_bio: editForm.author_bio || null,
        is_breaking: editForm.is_breaking,
        links: validLinks.length > 0 ? validLinks : null,
      })
      .eq("id", selectedNews.id);

    setUploading(false);

    if (error) {
      console.error("Error updating news:", error);
      alert("Failed to update article");
    } else {
      fetchNews(currentPage);
      setIsEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteNews = async () => {
    if (!selectedNews) return;

    if (selectedNews.image) {
      await deleteImage(selectedNews.image);
    }

    if (selectedNews.media) {
      for (const item of selectedNews.media) {
        if (item.type === "image") {
          await deleteImage(item.url);
        }
      }
    }

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

  // Access Denied UI
  if (
    authChecked &&
    userRole !== "superadmin" &&
    (!userPermissions || !userPermissions.includes("/my-panel"))
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            You don't have permission to access{" "}
            <span className="font-semibold text-gray-900">My Panel</span>.
            Please contact your administrator to request access.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full mb-6">
            <UserCircle className="h-5 w-5 text-gray-600" weight="duotone" />
            <span className="text-sm font-medium text-gray-700">
              Current Role:{" "}
              <span className="capitalize">{userRole || "Unknown"}</span>
            </span>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => {
                const email = "support@yourcompany.com";
                const subject = "Access Request: My Panel";
                const body = `Hello,\n\nI would like to request access to the My Panel page.\n\nUser Role: ${userRole}\n\nThank you.`;
                window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-0.5">
              Reporter Panel
            </h1>
            <p className="text-xs text-gray-600">
              Analytics and article management
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" weight="bold" />
            Create Article
          </button>
        </div>

        {/* Tabs */}
        <TabList>
          <Tab active={activeTab === 0} onClick={() => setActiveTab(0)}>
            <div className="flex items-center gap-2">
              <ChartBar weight="duotone" className="h-4 w-4" />
              Dashboard
            </div>
          </Tab>
          <Tab active={activeTab === 1} onClick={() => setActiveTab(1)}>
            <div className="flex items-center gap-2">
              <Article weight="duotone" className="h-4 w-4" />
              My Articles
            </div>
          </Tab>
        </TabList>

        {/* Tab Content */}
        {activeTab === 0 && (
          <div>
            {/* All Stats Cards - Single Compact Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
              <StatCard
                title="Articles"
                value={analyticsData.totalArticles}
                icon={Article}
                color="text-blue-500"
              />
              <StatCard
                title="Views"
                value={
                  analyticsData.totalViews > 1000
                    ? `${(analyticsData.totalViews / 1000).toFixed(1)}k`
                    : analyticsData.totalViews
                }
                icon={Eye}
                color="text-green-500"
              />
              <StatCard
                title="Shares"
                value={analyticsData.totalShares}
                icon={Share}
                color="text-purple-500"
              />
              <StatCard
                title="Approval"
                value={`${analyticsData.approvalRate.toFixed(0)}%`}
                icon={CheckCircle}
                color="text-amber-500"
              />
              <StatCard
                title="Likes"
                value={
                  analyticsData.totalLikes > 1000
                    ? `${(analyticsData.totalLikes / 1000).toFixed(1)}k`
                    : analyticsData.totalLikes
                }
                icon={Heart}
                color="text-rose-500"
              />
              <StatCard
                title="Comments"
                value={
                  analyticsData.totalComments > 1000
                    ? `${(analyticsData.totalComments / 1000).toFixed(1)}k`
                    : analyticsData.totalComments
                }
                icon={ChatCircle}
                color="text-indigo-500"
              />
              <StatCard
                title="Bookmarks"
                value={
                  analyticsData.totalBookmarks > 1000
                    ? `${(analyticsData.totalBookmarks / 1000).toFixed(1)}k`
                    : analyticsData.totalBookmarks
                }
                icon={BookmarkSimple}
                color="text-cyan-500"
              />
            </div>

            {/* Charts Row 1 */}
            <Grid cols={2}>
              <ChartCard title="Performance Over Time">
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: "axis",
                      axisPointer: { type: "cross" },
                    },
                    legend: {
                      data: ["Views", "Shares"],
                      bottom: 0,
                    },
                    grid: {
                      left: "3%",
                      right: "4%",
                      bottom: "15%",
                      top: "10%",
                      containLabel: true,
                    },
                    xAxis: {
                      type: "category",
                      boundaryGap: false,
                      data: analyticsData.performanceOverTime.map((d) => {
                        const date = new Date(d.date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }),
                    },
                    yAxis: {
                      type: "value",
                    },
                    series: [
                      {
                        name: "Views",
                        type: "line",
                        smooth: true,
                        data: analyticsData.performanceOverTime.map(
                          (d) => d.Views,
                        ),
                        areaStyle: {
                          color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                              { offset: 0, color: "rgba(59, 130, 246, 0.5)" },
                              { offset: 1, color: "rgba(59, 130, 246, 0.1)" },
                            ],
                          },
                        },
                        lineStyle: { color: "#3b82f6", width: 2 },
                        itemStyle: { color: "#3b82f6" },
                      },
                      {
                        name: "Shares",
                        type: "line",
                        smooth: true,
                        data: analyticsData.performanceOverTime.map(
                          (d) => d.Shares,
                        ),
                        areaStyle: {
                          color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                              { offset: 0, color: "rgba(168, 85, 247, 0.5)" },
                              { offset: 1, color: "rgba(168, 85, 247, 0.1)" },
                            ],
                          },
                        },
                        lineStyle: { color: "#a855f7", width: 2 },
                        itemStyle: { color: "#a855f7" },
                      },
                    ],
                  }}
                  style={{ height: "240px" }}
                  opts={{ renderer: "svg" }}
                />
              </ChartCard>

              <ChartCard title="Status Distribution">
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: "item",
                      formatter: "{b}: {c} articles ({d}%)",
                    },
                    legend: {
                      bottom: 0,
                      left: "center",
                    },
                    series: [
                      {
                        type: "pie",
                        radius: ["40%", "70%"],
                        avoidLabelOverlap: false,
                        itemStyle: {
                          borderRadius: 10,
                          borderColor: "#fff",
                          borderWidth: 2,
                        },
                        label: {
                          show: true,
                          position: "inside",
                          formatter: "{c}",
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "#fff",
                        },
                        emphasis: {
                          label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: "bold",
                          },
                          itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: "rgba(0, 0, 0, 0.5)",
                          },
                        },
                        data: analyticsData.statusDistribution.map((d) => ({
                          value: d.value,
                          name: d.name,
                          itemStyle: {
                            color:
                              d.name === "Approved"
                                ? "#22c55e"
                                : d.name === "Pending"
                                  ? "#eab308"
                                  : "#ef4444",
                          },
                        })),
                      },
                    ],
                  }}
                  style={{ height: "240px" }}
                  opts={{ renderer: "svg" }}
                />
              </ChartCard>
            </Grid>

            {/* Charts Row 2 */}
            <Grid cols={2}>
              <ChartCard title="Top Performing Articles">
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: "axis",
                      axisPointer: { type: "shadow" },
                    },
                    grid: {
                      left: "3%",
                      right: "4%",
                      bottom: "3%",
                      top: "3%",
                      containLabel: true,
                    },
                    xAxis: {
                      type: "value",
                    },
                    yAxis: {
                      type: "category",
                      data: analyticsData.topArticles.map((d) => d.name),
                      axisLabel: {
                        fontSize: 10,
                        width: 100,
                        overflow: "truncate",
                      },
                    },
                    series: [
                      {
                        name: "Views",
                        type: "bar",
                        data: analyticsData.topArticles.map((d) => d.Views),
                        itemStyle: {
                          color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                              { offset: 0, color: "#3b82f6" },
                              { offset: 1, color: "#2563eb" },
                            ],
                          },
                          borderRadius: [0, 4, 4, 0],
                        },
                        label: {
                          show: true,
                          position: "right",
                          formatter: "{c}",
                          fontSize: 11,
                        },
                      },
                    ],
                  }}
                  style={{ height: "240px" }}
                  opts={{ renderer: "svg" }}
                />
              </ChartCard>

              <ChartCard title="Articles by Category">
                <ReactECharts
                  option={{
                    tooltip: {
                      trigger: "axis",
                      axisPointer: { type: "shadow" },
                    },
                    grid: {
                      left: "3%",
                      right: "4%",
                      bottom: "10%",
                      top: "3%",
                      containLabel: true,
                    },
                    xAxis: {
                      type: "category",
                      data: analyticsData.categoryDistribution.map(
                        (d) => d.name,
                      ),
                      axisLabel: {
                        fontSize: 10,
                        rotate: 45,
                      },
                    },
                    yAxis: {
                      type: "value",
                    },
                    series: [
                      {
                        name: "Articles",
                        type: "bar",
                        data: analyticsData.categoryDistribution.map(
                          (d) => d.Articles,
                        ),
                        itemStyle: {
                          color: {
                            type: "linear",
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                              { offset: 0, color: "#a855f7" },
                              { offset: 1, color: "#7e22ce" },
                            ],
                          },
                          borderRadius: [4, 4, 0, 0],
                        },
                        label: {
                          show: true,
                          position: "top",
                          formatter: "{c}",
                          fontSize: 11,
                        },
                      },
                    ],
                  }}
                  style={{ height: "240px" }}
                  opts={{ renderer: "svg" }}
                />
              </ChartCard>
            </Grid>
          </div>
        )}

        {activeTab === 1 && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.from?.toISOString().split("T")[0] || ""}
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        setDateRange({ ...dateRange, from: date });
                      }}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={dateRange.to?.toISOString().split("T")[0] || ""}
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        setDateRange({ ...dateRange, to: date });
                      }}
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="To"
                    />
                  </div>
                  {(dateRange.from || dateRange.to) && (
                    <button
                      onClick={() =>
                        setDateRange({ from: undefined, to: undefined })
                      }
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear dates
                    </button>
                  )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Category
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      data-category-button
                      onClick={(e) => {
                        e.stopPropagation();
                        const dropdown = document.getElementById(
                          "category-dropdown-articles",
                        );
                        if (dropdown) {
                          dropdown.classList.toggle("hidden");
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between"
                    >
                      <span className="text-gray-700">
                        {filterCategory.length === 0
                          ? "All Categories"
                          : `${filterCategory.length} selected`}
                      </span>
                      <svg
                        className="h-4 w-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <div
                      id="category-dropdown-articles"
                      className="hidden absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      <div className="p-2 space-y-1">
                        {categories.map((cat) => (
                          <label
                            key={cat.id}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={filterCategory.includes(
                                cat.id.toString(),
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilterCategory([
                                    ...filterCategory,
                                    cat.id.toString(),
                                  ]);
                                } else {
                                  setFilterCategory(
                                    filterCategory.filter(
                                      (id) => id !== cat.id.toString(),
                                    ),
                                  );
                                }
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-xs text-gray-700">
                              {cat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                      {filterCategory.length > 0 && (
                        <div className="border-t border-gray-200 p-2">
                          <button
                            onClick={() => setFilterCategory([])}
                            className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-1"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Breaking News */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Breaking News
                  </label>
                  <select
                    value={filterBreaking}
                    onChange={(e) => setFilterBreaking(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value="all">All Articles</option>
                    <option value="breaking">Breaking Only</option>
                    <option value="regular">Regular Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {loading || !authChecked ? (
                <>
                  <NewsTableSkeleton />
                  <NewsMobileSkeleton />
                </>
              ) : news.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-gray-400" weight="bold" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    No articles yet
                  </h3>
                  <p className="text-xs text-gray-600 text-center mb-4">
                    Start creating your first news article to see it here
                  </p>
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium"
                  >
                    Create Your First Article
                  </button>
                </div>
              ) : (
                <>
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
                            Status
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
                              <div className="flex flex-col gap-1">
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
                                </div>
                                {newsItem.location && (
                                  <span className="text-[10px] text-gray-500">
                                    📍 {newsItem.location}
                                  </span>
                                )}
                                {newsItem.links &&
                                  newsItem.links.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                      {newsItem.links
                                        .slice(0, 4)
                                        .map((link, idx) => (
                                          <SocialIcon
                                            key={idx}
                                            url={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title={link.label || link.url}
                                            style={{ height: 20, width: 20 }}
                                          />
                                        ))}
                                      {newsItem.links.length > 4 && (
                                        <span className="text-[9px] text-gray-500 self-center">
                                          +{newsItem.links.length - 4}
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-700">
                                {getCategoryName(newsItem.category_id)}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {getStatusBadge(newsItem.status)}
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

                  <div className="lg:hidden p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {news.map((newsItem) => (
                        <div
                          key={newsItem.id}
                          className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-shadow"
                        >
                          {newsItem.image && (
                            <img
                              src={newsItem.image}
                              alt={newsItem.title}
                              className="w-full h-12 object-cover rounded mb-1.5"
                            />
                          )}

                          <div className="flex flex-wrap gap-1 mb-1">
                            {newsItem.is_breaking && (
                              <span className="px-1 py-0.5 text-[7px] font-semibold rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                                <TrendUp
                                  className="h-1.5 w-1.5"
                                  weight="bold"
                                />
                                Breaking
                              </span>
                            )}
                            <div className="scale-75 origin-left">
                              {getStatusBadge(newsItem.status)}
                            </div>
                          </div>

                          <h3 className="text-[9px] font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
                            {newsItem.title}
                          </h3>

                          <span className="inline-block px-1 py-0.5 text-[7px] font-medium rounded-full bg-gray-100 text-gray-700 mb-1">
                            {getCategoryName(newsItem.category_id)}
                          </span>

                          {newsItem.links && newsItem.links.length > 0 && (
                            <div className="flex gap-0.5 mb-1">
                              {newsItem.links.slice(0, 3).map((link, idx) => (
                                <SocialIcon
                                  key={idx}
                                  url={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={link.label || link.url}
                                  style={{ height: 14, width: 14 }}
                                />
                              ))}
                            </div>
                          )}

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
                      <span className="font-medium text-gray-900">
                        {totalNews}
                      </span>{" "}
                      articles
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
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
        )}
      </div>
      {/* Add/Edit Article Modal */}
      <ArticleModal
        isOpen={isAddDialogOpen || isEditDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }}
        onSave={isEditDialogOpen ? handleUpdateNews : handleAddNews}
        editForm={editForm}
        setEditForm={setEditForm}
        mediaItems={mediaItems}
        setMediaItems={setMediaItems}
        categories={categories}
        uploading={uploading}
        isEditMode={isEditDialogOpen}
        handleAddImages={handleAddImages}
        handleAddVideo={handleAddVideo}
        handleVideoUrlChange={handleVideoUrlChange}
        handleRemoveMedia={handleRemoveMedia}
        handleMoveUp={handleMoveUp}
        handleMoveDown={handleMoveDown}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnd={handleDragEnd}
        handleAddLink={handleAddLink}
        handleRemoveLink={handleRemoveLink}
        handleLinkChange={handleLinkChange}
        multipleMediaInputRef={multipleMediaInputRef}
        draggedIndex={draggedIndex}
        getYouTubeVideoId={getYouTubeVideoId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteNews}
        newsTitle={selectedNews?.title || ""}
      />
    </div>
  );
}
