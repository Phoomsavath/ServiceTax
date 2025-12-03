"use client";
import { messageTranslation } from "@/lib/constant";
import Swal from "sweetalert2";

export function useAlert() {
  const showSuccess = (message: string) => {
    Swal.fire({
      icon: "success",
      title: messageTranslation.Success,
      text: message,
      confirmButtonColor: "#10b981",
      confirmButtonText: "Got it!",
      background: "#ffffff",
      backdrop: `rgba(0,0,0,0.4)`,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-2xl font-bold text-gray-800",
        htmlContainer: "text-gray-600",
        confirmButton:
          "px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform",
      },
      showClass: {
        popup: "animate__animated animate__fadeInDown animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });
  };

  const showError = (message: string) => {
    Swal.fire({
      icon: "error",
      title: messageTranslation.Error,
      text: message,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Understood",
      background: "#ffffff",
      backdrop: `rgba(220,38,38,0.1)`,
      customClass: {
        popup: "rounded-2xl shadow-2xl border-2 border-red-100",
        title: "text-2xl font-bold text-gray-800",
        htmlContainer: "text-gray-600",
        confirmButton:
          "px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform",
      },
      showClass: {
        popup: "animate__animated animate__shakeX animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });
  };

  const showWarning = (message: string) => {
    Swal.fire({
      icon: "warning",
      title: messageTranslation.Warning,
      text: message,
      confirmButtonColor: "#f59e0b",
      confirmButtonText: "I understand",
      background: "#ffffff",
      backdrop: `rgba(245,158,11,0.1)`,
      customClass: {
        popup: "rounded-2xl shadow-2xl border-2 border-amber-100",
        title: "text-2xl font-bold text-gray-800",
        htmlContainer: "text-gray-600",
        confirmButton:
          "px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform",
      },
      showClass: {
        popup: "animate__animated animate__headShake animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp animate__faster",
      },
    });
  };

  const showProcessing = () => {
    Swal.fire({
      title: messageTranslation.Processing,
      html: "<div class='text-gray-600 mt-2'>Please wait a moment</div>",
      allowOutsideClick: false,
      allowEscapeKey: false,
      background: "#ffffff",
      backdrop: `rgba(0,0,0,0.5)`,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-xl font-bold text-gray-800",
        htmlContainer: "text-gray-500",
      },
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const showConfirm = async (
    message: string,
    title: string = "Are you sure?"
  ): Promise<boolean> => {
    const result = await Swal.fire({
      title,
      text: message,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: messageTranslation.Submit,
      cancelButtonText: messageTranslation.Cancel,
      background: "#ffffff",
      backdrop: `rgba(0,0,0,0.4)`,
      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-2xl font-bold text-gray-800",
        htmlContainer: "text-gray-600",
        confirmButton:
          "px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform mr-2",
        cancelButton:
          "px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-transform",
      },
      showClass: {
        popup: "animate__animated animate__zoomIn animate__faster",
      },
      hideClass: {
        popup: "animate__animated animate__zoomOut animate__faster",
      },
    });

    return result.isConfirmed;
  };

  const closeProcessing = () => Swal.close();

  return {
    showSuccess,
    showError,
    showWarning,
    showProcessing,
    showConfirm,
    closeProcessing,
  };
}
