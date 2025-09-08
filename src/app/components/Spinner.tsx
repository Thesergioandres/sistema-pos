"use client";
import React from "react";

type SpinnerProps = {
  size?: number; // px
  className?: string;
  label?: string;
};

export default function Spinner({
  size = 20,
  className = "",
  label,
}: SpinnerProps) {
  const border = Math.max(2, Math.round(size / 10));
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="animate-spin rounded-full border-t-transparent border-solid"
        style={{
          width: size,
          height: size,
          borderWidth: border,
          borderColor: "#CBD5E1",
          borderTopColor: "transparent",
        }}
        aria-label={label || "Cargando"}
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
}
