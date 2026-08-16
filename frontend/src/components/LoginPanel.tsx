import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuthContext";

export function LoginPanel({ onClose }: { onClose: () => void }) {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-baby-pink/30 bg-white/70 p-6 shadow-sm backdrop-blur-md">
      <h2 className="font-display text-xl font-semibold text-charcoal">Iniciar sesión</h2>
      <p className="mt-1 text-xs text-charcoal/50">Acceso exclusivo para el equipo del salón.</p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
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
          {submitting ? "Un momento..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
