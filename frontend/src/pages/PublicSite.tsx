import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { LoginPanel } from "../components/LoginPanel";
import { BookingFlow } from "../components/BookingFlow";
import { DecorBackground } from "../components/DecorBackground";
import { Marquee } from "../components/Marquee";
import { PolishSwatches } from "../components/PolishSwatches";

function TopBar({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const isStaff = profile?.role === "owner" || profile?.role === "staff";

  return (
    <div className="sticky top-0 z-20 border-b border-charcoal/8 bg-soft-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 sm:px-6">
        <span className="font-display text-base font-semibold tracking-tight text-charcoal">
          MC Nails Studio
        </span>

        {!loading && (
          <div className="flex items-center gap-3 text-xs">
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
                className="rounded-full border border-charcoal/15 px-3.5 py-1.5 font-medium text-charcoal/70
                  transition-colors hover:border-champagne hover:text-champagne"
              >
                Iniciar sesión
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="mx-auto max-w-md px-5 pb-8 pt-10 text-center sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-champagne">
        Estudio de manicura · NYC style
      </p>
      <h1 className="mt-3 font-display text-[2.6rem] leading-[0.98] tracking-tight text-charcoal">
        Uñas lindas,
        <br />
        <span className="italic text-champagne">a tu manera.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[26rem] text-sm text-charcoal/55">
        Reservá tu turno en segundos — sin vueltas, sin necesidad de crear una cuenta.
      </p>
      <div className="mt-5 flex justify-center">
        <PolishSwatches />
      </div>
    </div>
  );
}

export function PublicSite() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-soft-white">
      <DecorBackground />

      <TopBar onLoginClick={() => setShowLogin(true)} />
      <Hero />
      <Marquee />

      <div className="mx-auto max-w-md px-5 pb-16 pt-8 sm:px-6">
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
