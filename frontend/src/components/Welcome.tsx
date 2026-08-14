import { motion } from "framer-motion";
import { Divider } from "./Divider";
import { Monogram } from "./Logo";

/**
 * Pantalla de bienvenida: lo primero que ve la clienta al abrir el sitio,
 * antes del menú de servicios. Entrada escalonada (cada línea aparece un
 * poco después de la anterior) para que se sienta a propósito, no un salto
 * brusco de contenido.
 */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto flex min-h-[calc(100svh-57px)] max-w-md flex-col items-center justify-center px-6 pb-16 text-center sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Monogram className="mx-auto h-16 w-16" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
        className="mt-7 font-display text-[3.4rem] italic leading-[0.92] text-charcoal"
      >
        Bienvenida
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.24, ease: "easeOut" }}
        className="mt-2 text-[11px] font-medium uppercase tracking-[0.4em] text-champagne"
      >
        a MC Nails Studio
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.36, ease: "easeOut" }}
        className="mx-auto mt-6 max-w-[22rem] text-[15px] leading-relaxed text-charcoal/55"
      >
        Tu momento de belleza empieza acá. Elegí tu servicio, tu horario y
        listo — sin vueltas, sin necesidad de crear una cuenta.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.48, ease: "easeOut" }}
        className="mt-8 flex flex-col items-center"
      >
        <Divider className="mb-7" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onStart}
          className="group flex items-center gap-2 rounded-full bg-champagne px-8 py-3.5 text-sm font-medium
            tracking-wide text-white transition-opacity"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          Reservar turno
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </motion.div>
    </section>
  );
}
