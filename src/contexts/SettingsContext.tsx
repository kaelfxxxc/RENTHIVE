import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { PlatformSettings } from "../types";

/**
 * Used until an admin saves for the first time. `platform_settings` ships
 * column defaults but no row, so these mirror those defaults exactly —
 * keep the two in sync with supabase/wire-database.sql.
 */
export const DEFAULT_SETTINGS: PlatformSettings = {
  site_name: "RentHive",
  support_email: "support@renthive.ph",
  platform_fee_percent: 10,
  reservation_fee_percent: 10,
  max_rental_days: 90,
  require_verification: true,
  allow_guest_browse: true,
};

interface SettingsContextValue {
  settings: PlatformSettings;
  loading: boolean;
  /** True once the row has been read (or confirmed absent). */
  loaded: boolean;
  /** Re-read from the database — call after an admin save. */
  refreshSettings: () => Promise<void>;
  /** Fee multipliers derived from the percentages, e.g. 0.1 for 10%. */
  platformFeeRate: number;
  reservationFeeRate: number;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    // maybeSingle(): the table is intentionally empty until the first save.
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .maybeSingle();

    if (!error && data) {
      setSettings({
        site_name: data.site_name ?? DEFAULT_SETTINGS.site_name,
        support_email: data.support_email ?? DEFAULT_SETTINGS.support_email,
        platform_fee_percent: Number(data.platform_fee_percent ?? DEFAULT_SETTINGS.platform_fee_percent),
        reservation_fee_percent: Number(data.reservation_fee_percent ?? DEFAULT_SETTINGS.reservation_fee_percent),
        max_rental_days: Number(data.max_rental_days ?? DEFAULT_SETTINGS.max_rental_days),
        require_verification: data.require_verification ?? DEFAULT_SETTINGS.require_verification,
        allow_guest_browse: data.allow_guest_browse ?? DEFAULT_SETTINGS.allow_guest_browse,
      });
    }
    setLoading(false);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        loaded,
        refreshSettings,
        platformFeeRate: settings.platform_fee_percent / 100,
        reservationFeeRate: settings.reservation_fee_percent / 100,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("usePlatformSettings must be used within a SettingsProvider");
  return ctx;
}
