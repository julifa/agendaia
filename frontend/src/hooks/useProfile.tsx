import { useCallback, useEffect, useState, type ReactNode } from "react";
import { apiGet } from "../lib/api";
import { useAuth } from "./useAuthContext";
import { ProfileContext } from "./ProfileContext";
import type { ApiStaff } from "../types/api";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiStaff | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setProfile(await apiGet<ApiStaff>("/me"));
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}
