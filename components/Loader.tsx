// components/Loader.tsx
import { messageTranslation } from "@/lib/constant";
import React from "react";

interface LoaderProps {
  size?: number; // in px
  text?: string;
}

export default function Loader({
  size = 12,
  text = messageTranslation.Loading,
}: LoaderProps) {
  return (
    <div className="flex flex-col justify-center items-center py-10 space-y-2">
      <div
        className="rounded-full animate-spin border-4 border-gray-300 border-t-blue-600"
        style={{ width: size * 4, height: size * 4 }}
      ></div>
      {text && <span className="text-gray-500 text-sm">{text}</span>}
    </div>
  );
}
