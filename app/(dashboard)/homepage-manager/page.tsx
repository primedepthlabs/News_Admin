"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, House, Image, UploadSimple, Link as LinkIcon, Trash } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

export default function HomepageManager() {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [content, setContent] = useState({
    hero_image: "",
    heading: "",
    subheading: "",
    updated_at: "",
  });

  const [form, setForm] = useState({
    hero_image: "",
    heading: "",
    subheading: "",
  });

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

      await fetchContent();
      setLoading(false);
    } catch (err) {
      console.error("Auth error:", err);
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) console.error("Error fetching homepage content:", error);
    if (data) setContent(data);
  };

  const handleEdit = () => {
    setForm({
      hero_image: content.hero_image,
      heading: content.heading,
      subheading: content.subheading,
    });
    setImageMode("upload");
    setEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, WebP, and GIF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const ext = file.name.split(".").pop();
      const fileName = `hero-${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("homepage")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("homepage")
        .getPublicUrl(data.path);

      setForm({ ...form, hero_image: urlData.publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, hero_image: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("homepage_content")
      .update({
        hero_image: form.hero_image,
        heading: form.heading,
        subheading: form.subheading,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    setSaving(false);

    if (!error) {
      setEditing(false);
      fetchContent();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-4 w-1/3 bg-gray-100 animate-pulse rounded mb-3" />
          <div className="h-3 w-1/4 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage Content</h1>
        <p className="text-xs text-gray-600 mt-1">
          Manage the landing page image and text
        </p>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <House className="h-5 w-5 text-gray-500" weight="duotone" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Landing Page
              </h3>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
                  /
                </span>
                {content.updated_at && (
                  <span>
                    Updated{" "}
                    {new Date(content.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>

        {/* Preview */}
        {content.hero_image && (
          <div className="border-t border-gray-200 p-4">
            <img
              src={content.hero_image}
              alt="Hero preview"
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
            <p className="text-sm font-semibold text-gray-900">
              {content.heading}
            </p>
            <p className="text-xs text-gray-500 mt-1">{content.subheading}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Landing Page
                </h2>
                <span className="text-xs text-gray-500">/</span>
              </div>
              <button
                onClick={() => setEditing(false)}
                className="h-8 w-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Image Section */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Hero Image
                </label>

                {/* Toggle: Upload / URL */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-3 w-fit">
                  <button
                    onClick={() => setImageMode("upload")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                      imageMode === "upload"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <UploadSimple className="h-3.5 w-3.5" />
                    Upload
                  </button>
                  <button
                    onClick={() => setImageMode("url")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                      imageMode === "url"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    URL
                  </button>
                </div>

                {imageMode === "upload" ? (
                  <div>
                    {/* Preview with remove */}
                    {form.hero_image && (
                      <div className="relative mb-3 group">
                        <img
                          src={form.hero_image}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 h-8 w-8 bg-black/60 hover:bg-black/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Upload area */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-500">
                            Uploading...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <UploadSimple className="h-8 w-8 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Click to upload image
                          </span>
                          <span className="text-[10px] text-gray-400">
                            JPG, PNG, WebP, GIF • Max 5MB
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    {form.hero_image && (
                      <img
                        src={form.hero_image}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.hero_image}
                        onChange={(e) =>
                          setForm({ ...form, hero_image: e.target.value })
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Heading
                </label>
                <input
                  type="text"
                  value={form.heading}
                  onChange={(e) =>
                    setForm({ ...form, heading: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Subheading
                </label>
                <textarea
                  value={form.subheading}
                  onChange={(e) =>
                    setForm({ ...form, subheading: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.heading.trim() || uploading}
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