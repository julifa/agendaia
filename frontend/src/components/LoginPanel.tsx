import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuthContext";

const SALON_ID = import.meta.env.VITE_SALON_ID;

export function LoginPanel({ onClose }: { onClose: () => void }) {
  const { signInWithPassword, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
      } else {
        await signUp(email, password, fullName, SALON_ID);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-baby-pink/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
      <h2 className="font-display text-xl font-semibold text-charcoal">
        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        {mode === "signup" && (
          <input
            type="text"
            placeholder="Nombre completo"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal outline-none transition-colors focus:border-champagne"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal outline-none transition-colors focus:border-champagne"
        />
        <input
          type="password"
          placeholder="Contraseña"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-charcoal/15 bg-white px-4 py-2 text-sm text-charcoal outline-none transition-colors focus:border-champagne"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-full bg-baby-pink px-4 py-2 text-sm font-medium text-charcoal
            transition-colors duration-200 hover:bg-champagne hover:text-white disabled:opacity-50"
        >
          {submitting
            ? "Un momento..."
            : mode === "login"
              ? "Ingresar"
              : "Crear cuenta"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 text-sm text-charcoal/60 underline-offset-2 hover:underline"
      >
        {mode === "login"
          ? "¿No tenés cuenta? Creá una"
          : "¿Ya tenés cuenta? Iniciá sesión"}
      </button>
    </div>
  );
}
