import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetCustomerDashboard, useGetSellerDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, isSeller, isCustomer } = useAuth();

  const customerDash = useGetCustomerDashboard({ query: { enabled: isCustomer } });
  const sellerDash = useGetSellerDashboard({ query: { enabled: isSeller } });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleLogout() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const stats = isSeller
    ? [
        { label: "Products", value: sellerDash.data?.totalProducts ?? "-", icon: "cube-outline" as const },
        { label: "Orders", value: sellerDash.data?.totalOrders ?? "-", icon: "receipt-outline" as const },
        { label: "Revenue", value: sellerDash.data ? `$${sellerDash.data.totalRevenue.toFixed(0)}` : "-", icon: "cash-outline" as const },
      ]
    : [
        { label: "Orders", value: customerDash.data?.totalOrders ?? "-", icon: "receipt-outline" as const },
        { label: "Delivered", value: customerDash.data?.deliveredOrders ?? "-", icon: "checkmark-circle-outline" as const },
        { label: "Spent", value: customerDash.data ? `$${customerDash.data.totalSpent.toFixed(0)}` : "-", icon: "cash-outline" as const },
      ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad + 16,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 90),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
            {user?.email}
          </Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: isSeller ? "#052E16" : "#EFF6FF",
              },
            ]}
          >
            <Ionicons
              name={isSeller ? "storefront-outline" : "person-outline"}
              size={12}
              color={isSeller ? "#10B981" : "#3B82F6"}
            />
            <Text
              style={[
                styles.roleText,
                { color: isSeller ? "#10B981" : "#3B82F6" },
              ]}
            >
              {isSeller ? "Seller" : "Customer"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View
            key={s.label}
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name={s.icon} size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {String(s.value)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.menuSection}>
        <MenuItem
          icon="receipt-outline"
          label="My Orders"
          onPress={() => router.push("/(tabs)/orders")}
          colors={colors}
        />
        {isCustomer && (
          <MenuItem
            icon="cart-outline"
            label="My Cart"
            onPress={() => router.push("/(tabs)/cart")}
            colors={colors}
          />
        )}
        {isSeller && (
          <MenuItem
            icon="analytics-outline"
            label="Dashboard"
            onPress={() => router.push("/(tabs)/")}
            colors={colors}
          />
        )}
      </View>

      <Pressable
        testID="logout-btn"
        style={({ pressed }) => [
          styles.logoutBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.destructive,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign out</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Marketplace · v1.0.0
      </Text>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.accent }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 24, fontWeight: "700" as const },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: "700" as const },
  userEmail: { fontSize: 13 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 3,
  },
  roleText: { fontSize: 11, fontWeight: "600" as const },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: "700" as const },
  statLabel: { fontSize: 11 },
  menuSection: { gap: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" as const },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  logoutText: { fontSize: 15, fontWeight: "600" as const },
  version: { fontSize: 12, textAlign: "center" },
});
