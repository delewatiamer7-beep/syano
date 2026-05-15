import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useClearCart,
  useGetCart,
  usePlaceOrder,
  useRemoveFromCart,
  useUpdateCartItem,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function CartTab() {
  const { isSeller } = useAuth();
  return isSeller ? <SellerProductsPlaceholder /> : <CartScreen />;
}

function SellerProductsPlaceholder() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topPad,
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        },
      ]}
    >
      <Ionicons name="storefront-outline" size={56} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Seller Account</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Manage your products from the web dashboard
      </Text>
    </View>
  );
}

function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: cart, isLoading, refetch } = useGetCart();
  const removeItem = useRemoveFromCart();
  const updateItem = useUpdateCartItem();
  const clearCart = useClearCart();
  const placeOrder = usePlaceOrder();

  const [address, setAddress] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleRemove(productId: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeItem.mutate({ productId });
  }

  function handleQuantityChange(productId: number, newQty: number) {
    if (newQty < 1) {
      handleRemove(productId);
      return;
    }
    updateItem.mutate({ productId, data: { quantity: newQty } });
  }

  function handleCheckout() {
    if (!address.trim()) {
      Alert.alert("Shipping address required", "Please enter your shipping address.");
      return;
    }
    setPlacingOrder(true);
    placeOrder.mutate(
      { data: { shippingAddress: address.trim() } },
      {
        onSuccess: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowCheckout(false);
          setAddress("");
          setPlacingOrder(false);
          await refetch();
          router.push("/(tabs)/orders");
        },
        onError: () => {
          setPlacingOrder(false);
          Alert.alert("Error", "Failed to place order. Please try again.");
        },
      }
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Cart</Text>
        {items.length > 0 && (
          <Pressable
            onPress={() =>
              Alert.alert("Clear cart", "Remove all items?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: () => clearCart.mutate(undefined),
                },
              ])
            }
          >
            <Ionicons name="trash-outline" size={22} color={colors.destructive} />
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Browse products and add them to your cart
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.browseBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={[styles.browseBtnText, { color: colors.primaryForeground }]}>
              Browse Shop
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.productId)}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 160 },
            ]}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.cartItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.itemImage, { backgroundColor: colors.muted }]}>
                  {item.product.imageUrl ? (
                    <Image
                      source={{ uri: item.product.imageUrl }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="cube-outline" size={28} color={colors.mutedForeground} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.primary }]}>
                    ${item.product.finalPrice.toFixed(2)} each
                  </Text>
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.qtyText, { color: colors.foreground }]}>
                      {item.quantity}
                    </Text>
                    <Pressable
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.subtotal, { color: colors.mutedForeground }]}>
                      ${item.subtotal.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => handleRemove(item.productId)} style={styles.removeBtn}>
                  <Ionicons name="close" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            )}
          />

          <View
            style={[
              styles.checkoutBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 8),
              },
            ]}
          >
            {showCheckout ? (
              <View style={styles.checkoutForm}>
                <View
                  style={[
                    styles.addressWrap,
                    { borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons name="location-outline" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.addressInput, { color: colors.foreground }]}
                    placeholder="Shipping address"
                    placeholderTextColor={colors.mutedForeground}
                    value={address}
                    onChangeText={setAddress}
                    multiline
                  />
                </View>
                <View style={styles.checkoutActions}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setShowCheckout(false)}
                  >
                    <Text style={[{ color: colors.foreground, fontWeight: "600" as const }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    testID="place-order-btn"
                    style={({ pressed }) => [
                      styles.placeOrderBtn,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, flex: 1 },
                    ]}
                    onPress={handleCheckout}
                    disabled={placingOrder}
                  >
                    {placingOrder ? (
                      <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                      <Text style={[styles.placeOrderText, { color: colors.primaryForeground }]}>
                        Place Order · ${total.toFixed(2)}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.totalRow}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total</Text>
                  <Text style={[styles.totalAmount, { color: colors.foreground }]}>
                    ${total.toFixed(2)}
                  </Text>
                </View>
                <Pressable
                  testID="checkout-btn"
                  style={({ pressed }) => [
                    styles.checkoutBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={() => setShowCheckout(true)}
                >
                  <Text style={[styles.checkoutText, { color: colors.primaryForeground }]}>
                    Checkout
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
                </Pressable>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: "700" as const },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: "700" as const },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  browseBtnText: { fontSize: 15, fontWeight: "600" as const },
  listContent: { padding: 16, gap: 10 },
  cartItem: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    gap: 10,
    padding: 10,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 13, fontWeight: "500" as const, lineHeight: 18 },
  itemPrice: { fontSize: 13, fontWeight: "600" as const },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 14, fontWeight: "600" as const, minWidth: 20, textAlign: "center" },
  subtotal: { fontSize: 13, marginLeft: "auto" },
  removeBtn: { padding: 4 },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 12 },
  totalAmount: { fontSize: 20, fontWeight: "700" as const },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkoutText: { fontSize: 15, fontWeight: "700" as const },
  checkoutForm: { gap: 10 },
  addressWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 60,
  },
  addressInput: { flex: 1, fontSize: 14 },
  checkoutActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: { fontSize: 14, fontWeight: "700" as const },
});
