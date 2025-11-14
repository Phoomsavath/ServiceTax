"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="bg-white shadow-md rounded-2xl p-8 text-center max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 mb-6">
          You don’t have permission to view this page. Please contact your
          administrator if you think this is a mistake.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-medium transition"
          >
            Go to Home
          </button>
        </div>
      </div>
      <p className="mt-6 text-sm text-gray-500">
        © {new Date().getFullYear()} Your Company. All rights reserved.
      </p>
    </div>
  );
}
