import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { ToastProvider } from "@/components/toast/ToastProvider";

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
