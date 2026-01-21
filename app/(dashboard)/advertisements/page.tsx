"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Trash,
  X,
  Plus,
  Megaphone,
  Eye,
  Heart,
  Share2,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Advertisement = {
  id: number;
  ad_type: "video" | "image_with_button";
  media_url: string;
  caption: string;
  button_text: string | null;
  button_link: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_sponsored: boolean;
  created_at: string;
};

function AdTableSkeleton() {
  return (
    <div className="hidden lg:block">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Preview
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Type
            </th>
            <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
              Caption
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
                <div className="h-10 w-16 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-4 w-16 bg-gray-100 animate-pulse rounded-full" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-48 bg-gray-100 animate-pulse rounded" />
              </td>
              <td className="py-2 px-3">
                <div className="h-3 w-20 bg-gray-100 animate-pulse rounded" />
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

function AdMobileSkeleton() {
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

export default function AdvertisementManager() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAds, setTotalAds] = useState(0);
  const itemsPerPage = 10;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const router = useRouter();

  const [adForm, setAdForm] = useState({
    ad_type: "video" as "video" | "image_with_button",
    media_url: "",
    caption: "",
    button_text: "",
    button_link: "",
    is_sponsored: true,
  });

  const [uploadMethod, setUploadMethod] = useState<"url" | "upload">("url");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
    });
  }, [router]);

  const fetchAds = async (page: number) => {
    setLoading(true);
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from("advertisements")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching ads:", error);
    } else {
      setAds(data || []);
      setTotalAds(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAds(currentPage);
  }, [currentPage]);

  const resetForm = () => {
    setAdForm({
      ad_type: "video",
      media_url: "",
      caption: "",
      button_text: "",
      button_link: "",
      is_sponsored: true,
    });
    setUploadMethod("url");
  };

  const handleAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEdit = (ad: Advertisement) => {
    setSelectedAd(ad);
    setAdForm({
      ad_type: ad.ad_type,
      media_url: ad.media_url,
      caption: ad.caption,
      button_text: ad.button_text || "",
      button_link: ad.button_link || "",
      is_sponsored: ad.is_sponsored,
    });
    setIsEditDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("advertisements")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      alert("Failed to upload file");
      return;
    }

    const { data } = supabase.storage
      .from("advertisements")
      .getPublicUrl(filePath);

    setAdForm({ ...adForm, media_url: data.publicUrl });
  };

  const handleAddAd = async () => {
    const { error } = await supabase.from("advertisements").insert([
      {
        ad_type: adForm.ad_type,
        media_url: adForm.media_url,
        caption: adForm.caption,
        button_text:
          adForm.ad_type === "image_with_button" && adForm.button_text.trim()
            ? adForm.button_text
            : null,
        button_link:
          adForm.ad_type === "image_with_button" && adForm.button_link.trim()
            ? adForm.button_link
            : null,
        is_sponsored: adForm.is_sponsored,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
      },
    ]);

    if (error) {
      console.error("Error adding ad:", error);
    } else {
      fetchAds(currentPage);
      setIsAddDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateAd = async () => {
    if (!selectedAd) return;

    const { error } = await supabase
      .from("advertisements")
      .update({
        ad_type: adForm.ad_type,
        media_url: adForm.media_url,
        caption: adForm.caption,
        button_text:
          adForm.ad_type === "image_with_button" && adForm.button_text.trim()
            ? adForm.button_text
            : null,
        button_link:
          adForm.ad_type === "image_with_button" && adForm.button_link.trim()
            ? adForm.button_link
            : null,
        is_sponsored: adForm.is_sponsored,
      })
      .eq("id", selectedAd.id);

    if (error) {
      console.error("Error updating ad:", error);
    } else {
      fetchAds(currentPage);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = (ad: Advertisement) => {
    setSelectedAd(ad);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAd = async () => {
    if (!selectedAd) return;

    const { error } = await supabase
      .from("advertisements")
      .delete()
      .eq("id", selectedAd.id);

    if (error) {
      console.error("Error deleting ad:", error);
    } else {
      fetchAds(currentPage);
      setIsDeleteDialogOpen(false);
    }
  };

  const totalPages = Math.ceil(totalAds / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-0.5">
              Advertisements
            </h1>
          </div>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Advertisement
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <>
              <AdTableSkeleton />
              <AdMobileSkeleton />
            </>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Preview
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Type
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-xs text-gray-900">
                        Caption
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
                    {ads.map((ad) => (
                      <tr
                        key={ad.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-2 px-3">
                          {ad.ad_type === "video" ? (
                            <video
                              src={ad.media_url}
                              className="w-16 h-10 object-cover rounded"
                            />
                          ) : (
                            <img
                              src={ad.media_url}
                              alt="Ad"
                              className="w-16 h-10 object-cover rounded"
                            />
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-1">
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-700 w-fit">
                              {ad.ad_type === "video"
                                ? "🎥 Video"
                                : "📷 Image + Button"}
                            </span>
                            {ad.is_sponsored && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5 w-fit">
                                <Megaphone className="h-2.5 w-2.5" />
                                Sponsored
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {ad.caption}
                          </p>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2 text-[10px] text-gray-600">
                            <div className="flex items-center gap-0.5">
                              <Heart className="h-3 w-3" />
                              <span>{ad.likes_count}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" />
                              <span>{ad.comments_count}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <Share2 className="h-3 w-3" />
                              <span>{ad.shares_count}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[10px] text-gray-600">
                          {new Date(ad.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                              onClick={() => handleEdit(ad)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-gray-700" />
                            </button>
                            <button
                              className="h-7 w-7 flex items-center justify-center hover:bg-red-50 rounded transition-colors"
                              onClick={() => handleDelete(ad)}
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
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-white rounded-lg border border-gray-200 p-2 hover:shadow-md transition-shadow"
                    >
                      {ad.media_url &&
                        (ad.ad_type === "video" ? (
                          <video
                            src={ad.media_url}
                            className="w-full h-12 object-cover rounded mb-1.5"
                          />
                        ) : (
                          <img
                            src={ad.media_url}
                            alt="Ad"
                            className="w-full h-12 object-cover rounded mb-1.5"
                          />
                        ))}

                      <div className="flex flex-wrap gap-1 mb-1">
                        {ad.is_sponsored && (
                          <span className="px-1 py-0.5 text-[7px] font-semibold rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                            <Megaphone className="h-1.5 w-1.5" />
                            Sponsored
                          </span>
                        )}
                      </div>

                      <span className="inline-block px-1 py-0.5 text-[7px] font-medium rounded-full bg-gray-100 text-gray-700 mb-1">
                        {ad.ad_type === "video"
                          ? "🎥 Video"
                          : "📷 Image + Button"}
                      </span>

                      <p className="text-[9px] text-gray-700 mb-1 line-clamp-2 leading-tight">
                        {ad.caption}
                      </p>

                      <div className="flex items-center gap-1.5 text-[7px] text-gray-600 mb-1.5">
                        <div className="flex items-center gap-0.5">
                          <Heart className="h-2 w-2" />
                          <span>{ad.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Share2 className="h-2 w-2" />
                          <span>{ad.shares_count}</span>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <button
                          className="flex-1 h-5 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          onClick={() => handleEdit(ad)}
                        >
                          <Pencil className="h-2.5 w-2.5 text-gray-700" />
                        </button>
                        <button
                          className="flex-1 h-5 flex items-center justify-center bg-red-50 hover:bg-red-100 rounded transition-colors"
                          onClick={() => handleDelete(ad)}
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
                    {Math.min(currentPage * itemsPerPage, totalAds)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-gray-900">{totalAds}</span>{" "}
                  advertisements
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 border border-gray-300 rounded text-[10px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 border border-gray-300 rounded text-[10px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  {isAddDialogOpen ? "Add Advertisement" : "Edit Advertisement"}
                </h2>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {isAddDialogOpen
                    ? "Create a new advertisement"
                    : "Update advertisement information"}
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

            <div className="overflow-y-auto p-4 space-y-3">
              {/* Ad Type Selection - Radio Buttons */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-900">
                  Advertisement Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label
                    className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    style={{
                      borderColor:
                        adForm.ad_type === "video" ? "#3b82f6" : "#e5e7eb",
                      backgroundColor:
                        adForm.ad_type === "video" ? "#eff6ff" : "white",
                    }}
                  >
                    <input
                      type="radio"
                      name="ad_type"
                      value="video"
                      checked={adForm.ad_type === "video"}
                      onChange={(e) =>
                        setAdForm({ ...adForm, ad_type: "video" })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                        🎥 Running Video
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Video will autoplay in feed (no button)
                      </p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                    style={{
                      borderColor:
                        adForm.ad_type === "image_with_button"
                          ? "#3b82f6"
                          : "#e5e7eb",
                      backgroundColor:
                        adForm.ad_type === "image_with_button"
                          ? "#eff6ff"
                          : "white",
                    }}
                  >
                    <input
                      type="radio"
                      name="ad_type"
                      value="image_with_button"
                      checked={adForm.ad_type === "image_with_button"}
                      onChange={(e) =>
                        setAdForm({ ...adForm, ad_type: "image_with_button" })
                      }
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                        📷 Image with Button
                      </div>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Image with clickable call-to-action button
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upload Method Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-900">
                  {adForm.ad_type === "video" ? "Video" : "Image"} Upload Method{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMethod("url")}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                      uploadMethod === "url"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    🔗 URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod("upload")}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                      uploadMethod === "upload"
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Upload className="h-3 w-3 inline mr-1" />
                    Upload File
                  </button>
                </div>
              </div>

              {/* Media Input */}
              {uploadMethod === "url" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    {adForm.ad_type === "video" ? "Video URL" : "Image URL"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={adForm.media_url}
                    onChange={(e) =>
                      setAdForm({ ...adForm, media_url: e.target.value })
                    }
                    placeholder={
                      adForm.ad_type === "video"
                        ? "https://example.com/video.mp4"
                        : "https://example.com/image.jpg"
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Upload {adForm.ad_type === "video" ? "Video" : "Image"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept={
                        adForm.ad_type === "video" ? "video/*" : "image/*"
                      }
                      onChange={handleFileUpload}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                  {adForm.media_url && (
                    <p className="text-[10px] text-green-600 mt-1">
                      ✓ File uploaded successfully
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-900">
                  Caption <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adForm.caption}
                  onChange={(e) =>
                    setAdForm({ ...adForm, caption: e.target.value })
                  }
                  placeholder="Every bright tomorrow begins with..."
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Show button fields only for image_with_button type */}
              {adForm.ad_type === "image_with_button" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-900">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={adForm.button_text}
                      onChange={(e) =>
                        setAdForm({ ...adForm, button_text: e.target.value })
                      }
                      placeholder="Apply now"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-900">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={adForm.button_link}
                      onChange={(e) =>
                        setAdForm({ ...adForm, button_link: e.target.value })
                      }
                      placeholder="https://example.com"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="is_sponsored"
                  checked={adForm.is_sponsored}
                  onChange={(e) =>
                    setAdForm({ ...adForm, is_sponsored: e.target.checked })
                  }
                  className="w-3 h-3 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label
                  htmlFor="is_sponsored"
                  className="text-[10px] font-medium text-gray-900 cursor-pointer"
                >
                  Mark as Sponsored
                </label>
              </div>
            </div>

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
                onClick={isAddDialogOpen ? handleAddAd : handleUpdateAd}
                className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors font-medium"
              >
                {isAddDialogOpen ? "Add Advertisement" : "Save Changes"}
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
              <Trash className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">
              Delete Advertisement?
            </h2>
            <p className="text-[10px] text-gray-600 mb-4">
              Are you sure you want to delete this advertisement? This action
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAd}
                className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium"
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
