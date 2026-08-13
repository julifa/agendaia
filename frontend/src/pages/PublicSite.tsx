import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { LoginPanel } from "../components/LoginPanel";
import { BookingFlow } from "../components/BookingFlow";

function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const isStaff = profile?.role === "owner" || profile?.role === "staff";

  return (
    <header className="mx-auto flex max-w-md items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-charcoal">
          MC Nails Studio
        </h1>
        <p className="text-sm text-charcoal/60">Reservá tu turno</p>
      </div>

      {!loading && (
        <div className="flex items-center gap-4 text-sm">
          {isStaff && (
            <Link
              to="/admin"
              className="text-charcoal/60 underline-offset-2 hover:underline"
            >
              Panel del salón
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-charcoal/60 underline-offset-2 hover:underline"
            >
              Cerrar sesión
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full border border-charcoal/20 px-4 py-1.5 text-charcoal/80
                transition-colors hover:border-champagne hover:text-champagne"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      )}
    </header>
  );
}

export function PublicSite() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="min-h-screen bg-soft-white px-6 py-16">
      <Header onLoginClick={() => setShowLogin(true)} />

      <div className="mx-auto mt-10 max-w-md">
        {showLogin && (
          <div className="mb-10">
            <LoginPanel onClose={() => setShowLogin(false)} />
          </div>
        )}
        <BookingFlow />
      </div>
    </main>
  );
}
