import { Platform } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Returns layout constants for tab screens:
 * - topPad: padding to clear the status bar / web header
 * - tabBarHeight: actual height of the bottom tab bar (includes safe area inset)
 * - insets: raw safe area insets (for screens that still need them directly)
 *
 * Only call this hook from a component that is rendered INSIDE the tab navigator.
 * For auth screens or full-screen modals, use useSafeAreaInsets directly.
 */
export function useScreenLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return { topPad, tabBarHeight, insets };
}
