import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuthContext";
import { useProfile } from "../hooks/useProfileContext";
import { LoginPanel } from "../components/LoginPanel";
import { BookingFlow } from "../components/BookingFlow";
import { DecorBackground } from "../components/DecorBackground";
import { Divider } from "../components/Divider";
import { InstagramIcon } from "../components/InstagramIcon";
import { Logo, Monogram } from "../components/Logo";
import { Marquee } from "../components/Marquee";
import { PolishSwatches } from "../components/PolishSwatches";
import { Welcome } from "../components/Welcome";

function TopBar({ onLoginClick }: { onLoginClick: () => void }) {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const isStaff = profile?.role === "owner" || profile?.role === "staff";

  return (
    <div className="sticky top-0 z-20 border-b border-charcoal/8 bg-soft-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3 sm:px-6">
        <Logo />

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
      <div className="glow-orb mx-auto inline-block">
        <Monogram className="h-12 w-12" />
      </div>

      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.35em] text-champagne">
        MC Nails Studio
      </p>
      <h1 className="mt-3 font-display text-[2.6rem] leading-[0.98] tracking-tight text-charcoal">
        Uñas impecables,
        <br />
        <span className="italic text-champagne">a tu medida.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[26rem] text-sm text-charcoal/55">
        Reservá tu turno en minutos, sin vueltas ni necesidad de crear una cuenta.
      </p>
      <div className="mt-5 flex justify-center">
        <PolishSwatches />
      </div>
    </div>
  );
}

export function PublicSite() {
  const [showLogin, setShowLogin] = useState(false);
  // Si Mercado Pago redirige de vuelta acá (`?pago=...`), se salta la
  // pantalla de bienvenida: BookingFlow ya sabe mostrar el aviso de retorno.
  const [entered, setEntered] = useState(() =>
    new URLSearchParams(window.location.search).has("pago"),
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-soft-white">
      <DecorBackground />

      <TopBar onLoginClick={() => setShowLogin(true)} />

      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.div
            key="welcome"
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeIn" }}
          >
            <Welcome onStart={() => setEntered(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
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

              <Divider className="mb-6" />

              <div
                className="rounded-[2rem] border border-white/60 bg-white/70 p-6 backdrop-blur-xl sm:p-8"
                style={{ boxShadow: "var(--shadow-soft)" }}
              >
                <BookingFlow />
              </div>

              <footer className="mt-10 flex flex-col items-center gap-3">
                <Monogram className="h-7 w-7 opacity-60" />

                <a
                  href="https://www.instagram.com/mcstudiodebelleza"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-charcoal/50
                    underline-offset-4 transition-colors hover:text-champagne hover:underline"
                >
                  <InstagramIcon className="h-3.5 w-3.5" />
                  Mirá los diseños en Instagram
                </a>

                <p className="text-center text-xs tracking-wide text-charcoal/35">
                  MC NAILS STUDIO · hecho con cariño para tus uñas
                </p>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
