"use client";

import {
  useState,
  useActionState,
  useEffect,
  useRef,
  startTransition,
} from "react";
import { User, Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAlert } from "@/app/hooks/useAlert";
import { changePassword } from "@/action/changePassword";
import { initialState, messageTranslation } from "@/lib/constant";
import { useAuth } from "@/app/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  const {
    showWarning,
    showSuccess,
    showProcessing,
    closeProcessing,
    showError,
  } = useAlert();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    changePassword,
    initialState
  );

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  // Password form state for validation
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Profile data
  const profileData = {
    name: user?.userName || "",
    role: user?.role || "",
  };

  // Client-side validation wrapper function
  const validateAndSubmit = () => {
    // Validation checks
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showWarning(messageTranslation.MisMatch);
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Run validation
    if (!validateAndSubmit()) {
      return;
    }
    showProcessing();
    const formData = new FormData(e.currentTarget);

    startTransition(() => {
      formAction(formData);
    });
    closeProcessing();
  };

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        showSuccess(state.message);
      } else {
        showError(state.message);
      }
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}

        {/* Profile Information Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{"profile"}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                {messageTranslation.UserName}
              </label>
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {profileData.name}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4" />
                {messageTranslation.Role}
              </label>
              <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 capitalize">
                {profileData.role?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">
              Change Password
            </h2>
          </div>

          <form
            ref={formRef}
            action={formAction}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {messageTranslation.NewPassword}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 pr-10 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  disabled={isPending}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {messageTranslation.ConfirmNewPassword}
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 pr-10 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  disabled={isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                messageTranslation.ChangePassword
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
