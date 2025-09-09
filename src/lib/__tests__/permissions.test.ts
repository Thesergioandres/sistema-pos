import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasPermissionWithFirstUserBypass } from "@/lib/permissions";
import type { Session } from "next-auth";

// Mock prisma
const mockPrismaUsuarioCount = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    usuario: {
      count: () => mockPrismaUsuarioCount()
    }
  }
}));

describe("hasPermissionWithFirstUserBypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite bypass para primer usuario admin", async () => {
    mockPrismaUsuarioCount.mockResolvedValue(1);
    
    const session: Session = {
      user: {
        id: 1,
        rol: "admin",
        nombre: "Admin User",
        email: "admin@test.com"
      },
      expires: "2024-12-31"
    } as unknown as Session;

    const result = await hasPermissionWithFirstUserBypass(session, "sucursales.gestion");
    expect(result).toBe(true);
  });

  it("no permite bypass si no es primer usuario", async () => {
    mockPrismaUsuarioCount.mockResolvedValue(2);
    
    const session: Session = {
      user: {
        id: 1,
        rol: "admin",
        nombre: "Admin User",
        email: "admin@test.com"
      },
      expires: "2024-12-31"
    } as unknown as Session;

    const result = await hasPermissionWithFirstUserBypass(session, "sucursales.gestion");
    expect(result).toBe(true); // Debería seguir siendo true por el admin bypass normal
  });

  it("no permite bypass si no es admin", async () => {
    mockPrismaUsuarioCount.mockResolvedValue(1);
    
    const session: Session = {
      user: {
        id: 1,
        rol: "cajero",
        nombre: "Cajero User",
        email: "cajero@test.com"
      },
      expires: "2024-12-31"
    } as unknown as Session;

    const result = await hasPermissionWithFirstUserBypass(session, "sucursales.gestion");
    expect(result).toBe(false);
  });

  it("maneja sesión nula", async () => {
    const result = await hasPermissionWithFirstUserBypass(null, "sucursales.gestion");
    expect(result).toBe(false);
  });
});