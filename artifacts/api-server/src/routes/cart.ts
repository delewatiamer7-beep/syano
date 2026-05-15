import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable, usersTable } from "@workspace/db";
import {
  AddToCartBody,
  UpdateCartItemParams,
  UpdateCartItemBody,
  RemoveFromCartParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function computeFinalPrice(price: string, discountPercent: string | null): number {
  const p = parseFloat(price);
  if (!discountPercent) return p;
  const d = parseFloat(discountPercent);
  if (d <= 0 || d > 100) return p;
  return parseFloat((p * (1 - d / 100)).toFixed(2));
}

async function buildCartResponse(userId: number) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));

  const cartItems = await Promise.all(
    items.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (!product) return null;
      const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, product.sellerId));
      const finalPrice = computeFinalPrice(product.price, product.discountPercent);
      return {
        productId: item.productId,
        product: {
          id: product.id,
          sellerId: product.sellerId,
          sellerName: seller?.name ?? "Unknown",
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          discountPercent: product.discountPercent ? parseFloat(product.discountPercent) : null,
          finalPrice,
          category: product.category,
          stock: product.stock,
          imageUrl: product.imageUrl ?? null,
          createdAt: product.createdAt.toISOString(),
        },
        quantity: item.quantity,
        subtotal: parseFloat((finalPrice * item.quantity).toFixed(2)),
      };
    })
  );

  const validItems = cartItems.filter((i): i is NonNullable<typeof i> => i !== null);
  const total = validItems.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = validItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    items: validItems,
    total: parseFloat(total.toFixed(2)),
    itemCount,
  };
}

router.get("/cart", requireAuth, requireRole("customer"), async (req, res): Promise<void> => {
  res.json(await buildCartResponse(req.user!.userId));
});

router.post("/cart/items", requireAuth, requireRole("customer"), async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, productId)));

  if (existing) {
    await db
      .update(cartItemsTable)
      .set({ quantity: existing.quantity + quantity })
      .where(eq(cartItemsTable.id, existing.id));
  } else {
    await db.insert(cartItemsTable).values({
      userId: req.user!.userId,
      productId,
      quantity,
    });
  }

  res.json(await buildCartResponse(req.user!.userId));
});

router.patch("/cart/items/:productId", requireAuth, requireRole("customer"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const params = UpdateCartItemParams.safeParse({ productId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.quantity < 1) {
    await db
      .delete(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, params.data.productId)));
  } else {
    await db
      .update(cartItemsTable)
      .set({ quantity: parsed.data.quantity })
      .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, params.data.productId)));
  }

  res.json(await buildCartResponse(req.user!.userId));
});

router.delete("/cart/items/:productId", requireAuth, requireRole("customer"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const params = RemoveFromCartParams.safeParse({ productId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  await db
    .delete(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, req.user!.userId), eq(cartItemsTable.productId, params.data.productId)));

  res.json(await buildCartResponse(req.user!.userId));
});

router.delete("/cart/clear", requireAuth, requireRole("customer"), async (req, res): Promise<void> => {
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.userId));
  res.json({ message: "Cart cleared" });
});

export default router;
