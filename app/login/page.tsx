"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Envelope,
  Eye,
  EyeSlash,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabaseClient";

type AuthFormData = {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
};

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    });
    setError("");
    setSuccess("");
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

      setSuccess(`Welcome back, ${userData.full_name}!`);

      setTimeout(() => {
        // Route based on role and permissions
        if (userData.role === "superadmin" || userData.role === "admin") {
          router.push("/dashboard");
        } else if (userData.role === "reporter") {
          // Check if reporter has approval permissions
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
      // Allow signup with selected role

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const { error: insertError } = await supabase
        .from("dashboardUsers")
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            role: selectedRole, // Use selected role
            permissions:
              selectedRole === "admin"
                ? ["/dashboard", "/approval", "/news", "/my-panel"]
                : ["/my-panel"], // Set default permissions based on role
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(
        `${selectedRole === "admin" ? "Admin" : "Reporter"} account created! Please login.`,
      );
      setTimeout(() => {
        setIsLogin(true);
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
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

    if (!isLogin) {
      if (!formData.fullName) {
        setError("Please enter your full name");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
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
      <div className="w-full max-w-sm">
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
            {/* Animated underline indicator */}
            <div
              className={`absolute bottom-0 h-0.5 bg-gray-900 transition-all duration-300 ease-out ${
                isLogin ? "left-0 w-1/2" : "left-1/2 w-1/2"
              }`}
            />
            <button
              onClick={() => {
                if (isLogin) return; // Already on login
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
                if (!isLogin) return; // Already on signup
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

          <div
            className={`p-4 space-y-3 transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 translate-x-4"
                : "opacity-100 translate-x-0"
            }`}
          >
            {error && (
              <div className="px-2.5 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
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
              <div className="px-2.5 py-2 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <div className="h-3.5 w-3.5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[8px] font-bold">✓</span>
                </div>
                <p className="text-[10px] text-green-700 font-medium flex-1">
                  {success}
                </p>
              </div>
            )}

            {!isLogin && (
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
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-2.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            {!isLogin && (
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
                      onChange={(e) => setSelectedRole("reporter")}
                      className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-900 cursor-pointer"
                      disabled={loading}
                    />
                    <div className="flex items-center gap-1.5">
                      <User
                        className="h-3.5 w-3.5 text-gray-600"
                        weight="duotone"
                      />
                      <span className="text-xs text-gray-900 font-medium">
                        Reporter
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedRole === "admin"}
                      onChange={(e) => setSelectedRole("admin")}
                      className="w-3.5 h-3.5 text-gray-900 border-gray-300 focus:ring-gray-900 cursor-pointer"
                      disabled={loading}
                    />
                    <div className="flex items-center gap-1.5">
                      <UserCircle
                        className="h-3.5 w-3.5 text-gray-600"
                        weight="duotone"
                      />
                      <span className="text-xs text-gray-900 font-medium">
                        Admin
                      </span>
                    </div>
                  </label>
                </div>
                <p className="text-[9px] text-gray-500 mt-1">
                  {selectedRole === "reporter"
                    ? "Can create and manage own articles"
                    : "Can approve articles and manage all content"}
                </p>
              </div>
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
                  className="w-full pl-9 pr-2.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-all"
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
                  className="w-full pl-9 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlash className="h-3.5 w-3.5" weight="duotone" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" weight="duotone" />
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
                    className="w-full pl-9 pr-9 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash className="h-3.5 w-3.5" weight="duotone" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" weight="duotone" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isLogin ? "Signing in..." : "Creating..."}
                </span>
              ) : (
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
