import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAddToCart, useGetProduct } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isCustomer } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [footerHeight, setFooterHeight] = useState(82);

  const { data: product, isLoading } = useGetProduct(Number(id));
  const addToCart = useAddToCart();

  function handleAddToCart() {
    if (!product) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart.mutate(
      { data: { productId: product.id, quantity } },
      {
        onSuccess: () => {
          setAddedFeedback(true);
          setTimeout(() => setAddedFeedback(false), 2000);
        },
      }
    );
  }

  function handleFooterLayout(e: LayoutChangeEvent) {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setFooterHeight(h);
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.destructive }]}>Product not found</Text>
      </View>
    );
  }

  const hasDiscount = product.discountPercent != null && product.discountPercent > 0;
  const scrollBottomPad = isCustomer && product.stock > 0 ? footerHeight + bottomPad + 8 : bottomPad + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable
        style={({ pressed }) => [
          styles.backBtn,
          {
            top: topPad + 8,
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={colors.foreground} />
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroImage, { backgroundColor: colors.muted }]}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="cube-outline" size={80} color={colors.mutedForeground} />
          )}
          {hasDiscount && (
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.discountText, { color: colors.primaryForeground }]}>
                -{product.discountPercent}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={styles.metaRow}>
            <Text style={[styles.category, { color: colors.primary }]}>
              {product.category}
            </Text>
            <View style={[styles.stockBadge, { backgroundColor: product.stock > 0 ? colors.accent : "#FEE2E2" }]}>
              <Text style={[styles.stockText, { color: product.stock > 0 ? colors.accentForeground : "#EF4444" }]}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </Text>
            </View>
          </View>

          <Text style={[styles.name, { color: colors.foreground }]}>{product.name}</Text>
          <Text style={[styles.seller, { color: colors.mutedForeground }]}>
            by {product.sellerName}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.foreground }]}>
              ${product.finalPrice.toFixed(2)}
            </Text>
            {hasDiscount && (
              <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                ${product.price.toFixed(2)}
              </Text>
            )}
          </View>

          <Text style={[styles.descriptionLabel, { color: colors.foreground }]}>
            About this product
          </Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {product.description}
          </Text>
        </View>
      </ScrollView>

      {isCustomer && product.stock > 0 && (
        <View
          onLayout={handleFooterLayout}
          style={[
            styles.footer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 8,
            },
          ]}
        >
          <View style={styles.qtyControl}>
            <Pressable
              style={[styles.qtyBtn, { borderColor: colors.border }]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={18} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.qtyText, { color: colors.foreground }]}>{quantity}</Text>
            <Pressable
              style={[styles.qtyBtn, { borderColor: colors.border }]}
              onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            >
              <Ionicons name="add" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <Pressable
            testID="add-to-cart-detail-btn"
            style={({ pressed }) => [
              styles.addToCartBtn,
              {
                backgroundColor: addedFeedback ? "#10B981" : colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleAddToCart}
            disabled={addToCart.isPending}
          >
            {addToCart.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Ionicons
                  name={addedFeedback ? "checkmark" : "cart-outline"}
                  size={20}
                  color={colors.primaryForeground}
                />
                <Text style={[styles.addToCartText, { color: colors.primaryForeground }]}>
                  {addedFeedback ? "Added!" : `Add to Cart · $${(product.finalPrice * quantity).toFixed(2)}`}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  errorText: { fontSize: 16 },
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  discountBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  discountText: { fontSize: 14, fontWeight: "700" as const },
  details: { padding: 20, gap: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  category: { fontSize: 13, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  stockBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  stockText: { fontSize: 12, fontWeight: "500" as const },
  name: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  seller: { fontSize: 13 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 },
  price: { fontSize: 28, fontWeight: "700" as const },
  originalPrice: { fontSize: 16, textDecorationLine: "line-through" },
  descriptionLabel: { fontSize: 15, fontWeight: "700" as const, marginTop: 8 },
  description: { fontSize: 14, lineHeight: 22 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 17, fontWeight: "700" as const, minWidth: 24, textAlign: "center" },
  addToCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  addToCartText: { fontSize: 15, fontWeight: "700" as const },
});
