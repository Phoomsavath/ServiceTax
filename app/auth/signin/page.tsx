"use client";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { signIn } from "next-auth/react";
import { useAlert } from "@/app/hooks/useAlert";
import { useRouter } from "next/navigation";
import { messageTranslation } from "@/lib/constant";

export default function PremiumLoginForm() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [focusedField, setFocusedField] = useState("");
  const { showSuccess, showProcessing, showError, closeProcessing } =
    useAlert();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showProcessing();

    const result = await signIn("credentials", {
      redirect: false,
      userName,
      password,
    });
    closeProcessing();
    if (result?.ok) {
      showSuccess(messageTranslation.SignInSuccess);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } else {
      showError(result?.error as string);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Animated background elements */}

      {/* Main container */}
      <div className="relative w-full max-w-md">
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-linear-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>

        {/* Login card */}
        <div className="relative bg-slate-900 bg-opacity-80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-linear-to-r from-purple-500 via-pink-500 to-cyan-500"></div>

          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-linear-to-br from-purple-500 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/50">
                Logo
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {messageTranslation.SignIn} P & Safe
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-300 block"
                >
                  {messageTranslation.UserName}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 transition-colors duration-200 ${
                        focusedField === "username"
                          ? "text-purple-400"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <input
                    id="userName"
                    type="userName"
                    required
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder={messageTranslation.Placeholder}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onFocus={() => setFocusedField("userName")}
                    onBlur={() => setFocusedField("")}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-300 block"
                  >
                    {messageTranslation.Password}
                  </label>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock
                      className={`h-5 w-5 transition-colors duration-200 ${
                        focusedField === "password"
                          ? "text-purple-400"
                          : "text-slate-500"
                      }`}
                    />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-12 pr-12 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder={messageTranslation.Placeholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-linear-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>{messageTranslation.SignIn}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
            {/* Footer */}
          </div>

          {/* Bottom gradient accent */}
          <div className="h-px bg-linear-to-r from-transparent via-slate-700 to-transparent"></div>
        </div>

        {/* Floating badges */}
      </div>
    </div>
  );
}
