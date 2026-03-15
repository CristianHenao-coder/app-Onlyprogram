import { useCallback } from "react";
import { LinkPage } from "../pages/Dashboard/LinksModule/types";

export function useBots(currentPage: LinkPage, updatePage: (field: string, value: any) => void) {
  
  const updateGeoblocking = useCallback((countries: string[]) => {
    updatePage("security_config", {
      ...currentPage.security_config,
      geoblocking: countries
    });
  }, [currentPage.security_config, updatePage]);

  const addBlockedCountry = useCallback((countryCode: string) => {
    const current = currentPage.security_config?.geoblocking || [];
    if (current.includes(countryCode)) return;
    updateGeoblocking([...current, countryCode]);
  }, [currentPage.security_config, updateGeoblocking]);

  const removeBlockedCountry = useCallback((countryCode: string) => {
    const current = currentPage.security_config?.geoblocking || [];
    updateGeoblocking(current.filter(c => c !== countryCode));
  }, [currentPage.security_config, updateGeoblocking]);

  const updateDeviceRedirection = useCallback((device: "ios" | "android" | "desktop", url: string) => {
    updatePage("security_config", {
      ...currentPage.security_config,
      device_redirections: {
        ...currentPage.security_config?.device_redirections,
        [device]: url
      }
    });
  }, [currentPage.security_config, updatePage]);

  return {
    geoblocking: currentPage.security_config?.geoblocking || [],
    deviceRedirections: currentPage.security_config?.device_redirections || {},
    addBlockedCountry,
    removeBlockedCountry,
    updateDeviceRedirection,
  };
}
