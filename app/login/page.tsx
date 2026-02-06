"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";

import Compressor from "compressorjs";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Lock,
  Envelope,
  Eye,
  EyeSlash,
  UserCircle,
  X,
  Upload,
  CheckCircle,
  File,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

type AuthFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

type DocumentFiles = {
  aadhar: File | null;
  pan: File | null;
  photo1: File | null;
  photo2: File | null;
};

type DocumentPreviews = {
  aadhar: string | null;
  pan: string | null;
  photo1: string | null;
  photo2: string | null;
};

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });

  const [selectedRole, setSelectedRole] = useState<"admin" | "reporter">(
    "reporter",
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [documentFiles, setDocumentFiles] = useState<DocumentFiles>({
    aadhar: null,
    pan: null,
    photo1: null,
    photo2: null,
  });

  const [documentPreviews, setDocumentPreviews] = useState<DocumentPreviews>({
    aadhar: null,
    pan: null,
    photo1: null,
    photo2: null,
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
    setDocumentFiles({ aadhar: null, pan: null, photo1: null, photo2: null });
    setDocumentPreviews({
      aadhar: null,
      pan: null,
      photo1: null,
      photo2: null,
    });

    setError("");
    setSuccess("");
    setCurrentStep(1);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        success: (result) => resolve(result as File),
        error: (err) => reject(err),
      });
    });
  };

  const handleFileSelect = async (file: File, type: keyof DocumentFiles) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be less than 5MB");
      return;
    }

    try {
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentPreviews((prev) => ({
          ...prev,
          [type]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(compressedFile);

      setDocumentFiles((prev) => ({ ...prev, [type]: compressedFile }));
      toast.success(`${type.toUpperCase()} uploaded successfully!`);
    } catch (err) {
      toast.error("Failed to process file");
    }
  };
  const aadharDropzone = useDropzone({
    onDrop: (files) => handleFileSelect(files[0], "aadhar"),
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: !!documentFiles.aadhar, // Remove verifying.aadhar
  });

  const panDropzone = useDropzone({
    onDrop: (files) => handleFileSelect(files[0], "pan"),
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: !!documentFiles.pan, // Remove verifying.pan
  });

  const photo1Dropzone = useDropzone({
    onDrop: (files) => handleFileSelect(files[0], "photo1"),
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: !!documentFiles.photo1,
  });

  const photo2Dropzone = useDropzone({
    onDrop: (files) => handleFileSelect(files[0], "photo2"),
    accept: { "image/*": [".png", ".jpg", ".jpeg"] },
    maxFiles: 1,
    disabled: !!documentFiles.photo2,
  });

  const uploadDocuments = async (userId: string) => {
    const uploads: Record<string, string> = {};

    try {
      if (documentFiles.aadhar) {
        const aadharPath = `documents/${userId}/aadhar-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("reporter-documents")
          .upload(aadharPath, documentFiles.aadhar);
        if (error) throw error;
        const { data } = supabase.storage
          .from("reporter-documents")
          .getPublicUrl(aadharPath);
        uploads.aadhar_url = data.publicUrl;
      }

      if (documentFiles.pan) {
        const panPath = `documents/${userId}/pan-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("reporter-documents")
          .upload(panPath, documentFiles.pan);
        if (error) throw error;
        const { data } = supabase.storage
          .from("reporter-documents")
          .getPublicUrl(panPath);
        uploads.pan_url = data.publicUrl;
      }

      if (documentFiles.photo1) {
        const photo1Path = `photos/${userId}/photo1-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("reporter-photos")
          .upload(photo1Path, documentFiles.photo1);
        if (error) throw error;
        const { data } = supabase.storage
          .from("reporter-photos")
          .getPublicUrl(photo1Path);
        uploads.passport_photo_1_url = data.publicUrl;
      }

      if (documentFiles.photo2) {
        const photo2Path = `photos/${userId}/photo2-${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("reporter-photos")
          .upload(photo2Path, documentFiles.photo2);
        if (error) throw error;
        const { data } = supabase.storage
          .from("reporter-photos")
          .getPublicUrl(photo2Path);
        uploads.passport_photo_2_url = data.publicUrl;
      }

      return uploads;
    } catch (err) {
      throw new Error("Failed to upload documents");
    }
  };

  const handleLogin = async () => {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) throw authError;

      const { data: userData, error: userError } = await supabase
        .from("dashboardUsers")
        .select("*")
        .eq("email", formData.email)
        .single();

      if (userError) throw userError;

      // ✅ Block unverified reporters
      if (userData.role === "reporter" && !userData.documents_verified) {
        setError(
          userData.verification_status === "rejected"
            ? "Your account has been rejected. Please contact support."
            : "Your account is pending verification. Please wait for admin approval.",
        );
        await supabase.auth.signOut(); // Sign them out immediately
        return;
      }

      setSuccess(`Welcome back, ${userData.full_name}!`);

      setTimeout(() => {
        if (userData.role === "superadmin" || userData.role === "admin") {
          router.push("/dashboard");
        } else if (userData.role === "reporter") {
          if (
            userData.permissions &&
            userData.permissions.includes("/approval")
          ) {
            router.push("/approval");
          } else {
            router.push("/my-panel");
          }
        } else {
          router.push("/my-panel");
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
  };

  const handleSignup = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      let documentUrls = {};
      if (selectedRole === "reporter") {
        toast.loading("Uploading documents...");
        documentUrls = await uploadDocuments(authData.user.id);
        toast.dismiss();
      }

      const { error: insertError } = await supabase
        .from("dashboardUsers")
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: selectedRole,
            permissions:
              selectedRole === "admin"
                ? ["/dashboard", "/approval", "/news", "/my-panel"]
                : ["/my-panel"],
            // Only add documents for reporters
            ...(selectedRole === "reporter"
              ? {
                  ...documentUrls,
                  documents_verified: false,
                  verification_status: "pending",
                }
              : {}),
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(
        selectedRole === "admin"
          ? "Admin account created! Please login."
          : "Reporter account created! Documents submitted for verification.",
      );
      setTimeout(() => {
        setIsLogin(true);
        resetForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };

  const handleBasicInfoNext = () => {
    setError("");

    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (selectedRole === "reporter") {
      setCurrentStep(2);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (selectedRole === "reporter" && currentStep === 2) {
      if (
        !documentFiles.aadhar ||
        !documentFiles.pan ||
        !documentFiles.photo1 ||
        !documentFiles.photo2
      ) {
        setError("Please upload all required documents");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-2xl">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 mb-3">
            <UserCircle className="h-7 w-7 text-white" weight="duotone" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            News Admin Portal
          </h1>
          <p className="text-[10px] text-gray-600">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50 relative">
            <div
              className={`absolute bottom-0 h-0.5 bg-gray-900 transition-all duration-300 ease-out ${
                isLogin ? "left-0 w-1/2" : "left-1/2 w-1/2"
              }`}
            />
            <button
              onClick={() => {
                if (isLogin) return;
                setIsTransitioning(true);
                setTimeout(() => {
                  setIsLogin(true);
                  resetForm();
                  setIsTransitioning(false);
                }, 150);
              }}
              className={`py-2 text-xs font-semibold transition-all duration-300 relative z-10 ${
                isLogin
                  ? "text-gray-900 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                if (!isLogin) return;
                setIsTransitioning(true);
                setTimeout(() => {
                  setIsLogin(false);
                  resetForm();
                  setIsTransitioning(false);
                }, 150);
              }}
              className={`py-2 text-xs font-semibold transition-all duration-300 relative z-10 ${
                !isLogin
                  ? "text-gray-900 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Progress for Reporter Signup */}
          {!isLogin && selectedRole === "reporter" && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-medium ${currentStep === 1 ? "text-blue-700" : "text-gray-500"}`}
                >
                  Step 1: Basic Info
                </span>
                <span className="text-gray-400">→</span>
                <span
                  className={`font-medium ${currentStep === 2 ? "text-blue-700" : "text-gray-500"}`}
                >
                  Step 2: Documents
                </span>
              </div>
              <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: currentStep === 1 ? "50%" : "100%" }}
                />
              </div>
            </div>
          )}

          <div
            className={`p-4 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
          >
            {error && (
              <div className="mb-3 px-2.5 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <X
                  className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5"
                  weight="bold"
                />
                <p className="text-[10px] text-red-700 font-medium flex-1">
                  {error}
                </p>
                <button
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-3 w-3" weight="bold" />
                </button>
              </div>
            )}
            {success && (
              <div className="mb-3 px-2.5 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle
                  className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5"
                  weight="fill"
                />
                <p className="text-[10px] text-green-700 font-medium flex-1">
                  {success}
                </p>
              </div>
            )}

            {/* STEP 1: Basic Info */}
            {((!isLogin && currentStep === 1) || isLogin) && (
              <div className="space-y-3">
                {!isLogin && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-900">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                          weight="duotone"
                        />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          placeholder="Enter your full name"
                          className="w-full pl-9 pr-2.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pb-2 border-b border-gray-200">
                      <label className="text-[10px] font-semibold text-gray-900">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="reporter"
                            checked={selectedRole === "reporter"}
                            onChange={() => setSelectedRole("reporter")}
                            className="w-3.5 h-3.5"
                            disabled={loading}
                          />
                          <span className="text-xs">Reporter</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="admin"
                            checked={selectedRole === "admin"}
                            onChange={() => setSelectedRole("admin")}
                            className="w-3.5 h-3.5"
                            disabled={loading}
                          />
                          <span className="text-xs">Admin</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Envelope
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                      weight="duotone"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter your email"
                      className="w-full pl-9 pr-2.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-900">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                      weight="duotone"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                      disabled={loading}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeSlash
                          className="h-3.5 w-3.5 text-gray-400"
                          weight="duotone"
                        />
                      ) : (
                        <Eye
                          className="h-3.5 w-3.5 text-gray-400"
                          weight="duotone"
                        />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-900">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                        weight="duotone"
                      />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Confirm your password"
                        className="w-full pl-9 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
                        disabled={loading}
                      />
                      <button
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeSlash
                            className="h-3.5 w-3.5 text-gray-400"
                            weight="duotone"
                          />
                        ) : (
                          <Eye
                            className="h-3.5 w-3.5 text-gray-400"
                            weight="duotone"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={isLogin ? handleSubmit : handleBasicInfoNext}
                  disabled={loading}
                  className="w-full py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 mt-4"
                >
                  {loading
                    ? "Loading..."
                    : isLogin
                      ? "Sign In"
                      : selectedRole === "reporter"
                        ? "Next: Upload Documents"
                        : "Create Account"}
                </button>
              </div>
            )}

            {/* STEP 2: Document Upload (Reporter Only) */}
            {!isLogin && selectedRole === "reporter" && currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold text-gray-900">
                    Upload Documents
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Upload clear images of Aadhaar, PAN, and 2 passport photos
                  </p>
                </div>

                {/* Aadhaar */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-900">
                    Aadhaar Card <span className="text-red-500">*</span>
                  </label>
                  {!documentFiles.aadhar ? (
                    <div
                      {...aadharDropzone.getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        aadharDropzone.isDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      } `}
                    >
                      <input {...aadharDropzone.getInputProps()} />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Click or drag Aadhaar card
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-2 border-green-500 rounded-lg overflow-hidden">
                      <img
                        src={documentPreviews.aadhar!}
                        alt="Aadhaar"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => {
                          setDocumentFiles((prev) => ({
                            ...prev,
                            aadhar: null,
                          }));
                          setDocumentPreviews((prev) => ({
                            ...prev,
                            aadhar: null,
                          }));
                        }}
                        className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  )}
                </div>

                {/* PAN */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-900">
                    PAN Card <span className="text-red-500">*</span>
                  </label>
                  {!documentFiles.pan ? (
                    <div
                      {...panDropzone.getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        panDropzone.isDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      } `}
                    >
                      <input {...panDropzone.getInputProps()} />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Click or drag PAN card
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-2 border-green-500 rounded-lg overflow-hidden">
                      <img
                        src={documentPreviews.pan!}
                        alt="PAN"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => {
                          setDocumentFiles((prev) => ({ ...prev, pan: null }));
                          setDocumentPreviews((prev) => ({
                            ...prev,
                            pan: null,
                          }));
                        }}
                        className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo 1 */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-900">
                    Passport Photo 1 <span className="text-red-500">*</span>
                  </label>
                  {!documentFiles.photo1 ? (
                    <div
                      {...photo1Dropzone.getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        photo1Dropzone.isDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input {...photo1Dropzone.getInputProps()} />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Click or drag passport photo
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-2 border-green-500 rounded-lg overflow-hidden">
                      <img
                        src={documentPreviews.photo1!}
                        alt="Photo 1"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => {
                          setDocumentFiles((prev) => ({
                            ...prev,
                            photo1: null,
                          }));
                          setDocumentPreviews((prev) => ({
                            ...prev,
                            photo1: null,
                          }));
                        }}
                        className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo 2 */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-900">
                    Passport Photo 2 <span className="text-red-500">*</span>
                  </label>
                  {!documentFiles.photo2 ? (
                    <div
                      {...photo2Dropzone.getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        photo2Dropzone.isDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <input {...photo2Dropzone.getInputProps()} />
                      <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Click or drag passport photo
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="relative border-2 border-green-500 rounded-lg overflow-hidden">
                      <img
                        src={documentPreviews.photo2!}
                        alt="Photo 2"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => {
                          setDocumentFiles((prev) => ({
                            ...prev,
                            photo2: null,
                          }));
                          setDocumentPreviews((prev) => ({
                            ...prev,
                            photo2: null,
                          }));
                        }}
                        className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCurrentStep(1)}
                    disabled={loading}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading
                      ? "Creating Account..."
                      : "Submit & Create Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
