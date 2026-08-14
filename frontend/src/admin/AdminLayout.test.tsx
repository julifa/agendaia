import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";

const mockUseAuth = vi.fn();
const mockUseProfile = vi.fn();

vi.mock("../hooks/useAuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock("../hooks/useProfileContext", () => ({
  useProfile: () => mockUseProfile(),
}));

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<p>contenido secreto del panel</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  it("pide iniciar sesión si no hay usuario logueado", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
    mockUseProfile.mockReturnValue({ profile: null, loading: false });

    renderLayout();

    expect(screen.getByText(/iniciá sesión/i)).toBeInTheDocument();
    expect(screen.queryByText("contenido secreto del panel")).not.toBeInTheDocument();
  });

  it("bloquea a un usuario logueado con rol client", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false, signOut: vi.fn() });
    mockUseProfile.mockReturnValue({
      profile: { id: "u1", role: "client", full_name: "Julieta", salon_id: "s1" },
      loading: false,
    });

    renderLayout();

    expect(screen.getByText(/no tiene acceso/i)).toBeInTheDocument();
    expect(screen.queryByText("contenido secreto del panel")).not.toBeInTheDocument();
  });

  it("deja pasar a un usuario con rol owner", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u2" }, loading: false, signOut: vi.fn() });
    mockUseProfile.mockReturnValue({
      profile: { id: "u2", role: "owner", full_name: "Camila", salon_id: "s1" },
      loading: false,
    });

    renderLayout();

    expect(screen.getByText("contenido secreto del panel")).toBeInTheDocument();
  });

  it("deja pasar a un usuario con rol staff", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u3" }, loading: false, signOut: vi.fn() });
    mockUseProfile.mockReturnValue({
      profile: { id: "u3", role: "staff", full_name: "Valentina", salon_id: "s1" },
      loading: false,
    });

    renderLayout();

    expect(screen.getByText("contenido secreto del panel")).toBeInTheDocument();
  });

  it("muestra un loader mientras auth o profile están cargando", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, loading: false, signOut: vi.fn() });
    mockUseProfile.mockReturnValue({ profile: null, loading: true });

    renderLayout();

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    expect(screen.queryByText("contenido secreto del panel")).not.toBeInTheDocument();
  });
});
