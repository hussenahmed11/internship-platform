import { useEffect, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";

export function ThemeSync() {
  // Use useContext directly so we can check for undefined without throwing
  const authContext = useContext(AuthContext);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (authContext?.profile?.theme && authContext.profile.theme !== theme) {
      setTheme(authContext.profile.theme);
    }
  }, [authContext?.profile?.theme]);

  return null;
}
