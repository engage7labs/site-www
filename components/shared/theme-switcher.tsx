/**
 * Theme Switcher Component
 *
 * Allows users to switch between light and black themes.
 */

"use client";

import { useAppTheme } from "@/components/providers/app-theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { appTheme, setAppTheme } = useAppTheme();

  const toggleTheme = () => {
    setAppTheme(appTheme === "light" ? "black" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      {appTheme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
