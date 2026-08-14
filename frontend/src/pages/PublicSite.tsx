import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { LoginPanel } from "../components/LoginPanel";
import { BookingFlow } from "../components/BookingFlow";
import { DecorBackground } from "../components/DecorBackground";

function Header({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const isStaff = profile?.role === "owner" || profile?.role === "staff";

  return (
    <header className="mx-auto flex max-w-md items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-champagne">
          Estudio de manicura
        </p>
        <h1 className="mt-1 font-display text-[2.75rem] font-semibold leading-[0.95] tracking-tight text-charcoal">
          MC Nails
          <br />
          Studio
        </h1>
        <div className="mt-4 flex items-center gap-2.5">
          <span className="h-px w-7 bg-champagne" />
          <p className="text-sm text-charcoal/55">Reservá tu turno en segundos</p>
        </div>
      </div>

      {!loading && (
        <div className="flex flex-col items-end gap-2 pt-1 text-sm">
          {isStaff && (
            <Link
              to="/admin"
              className="text-charcoal/50 underline-offset-4 hover:text-charcoal hover:underline"
            >
              Panel del salón
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-charcoal/50 underline-offset-4 hover:text-charcoal hover:underline"
            >
              Cerrar sesión
            </button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onLoginClick}
              className="rounded-full border border-charcoal/15 px-4 py-1.5 text-xs font-medium text-charcoal/70
                transition-colors hover:border-champagne hover:text-champagne"
            >
              Iniciar sesión
            </motion.button>
          )}
        </div>
      )}
    </header>
  );
}

export function PublicSite() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-soft-white px-5 py-14 sm:px-6 sm:py-20">
      <DecorBackground />

      <Header onLoginClick={() => setShowLogin(true)} />

      <div className="mx-auto mt-10 max-w-md">
        <AnimatePresence>
          {showLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mb-6 overflow-hidden"
            >
              <LoginPanel onClose={() => setShowLogin(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="rounded-[2rem] border border-white/60 bg-white/70 p-6 backdrop-blur-xl sm:p-8"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          <BookingFlow />
        </div>

        <p className="mt-8 text-center text-xs text-charcoal/35">
          MC Nails Studio · hecho con cariño para tus uñas
        </p>
      </div>
    </main>
  );
}
