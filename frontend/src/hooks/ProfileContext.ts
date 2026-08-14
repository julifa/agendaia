import { createContext } from "react";
import type { ApiStaff } from "../types/api";

export interface ProfileContextValue {
  profile: ApiStaff | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);
