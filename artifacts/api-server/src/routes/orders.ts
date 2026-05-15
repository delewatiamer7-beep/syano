import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable, usersTable } from "@workspace/db";
import {
  GetOrderParams,
  PlaceOrderBody,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function computeFinalPrice(price: string, discountPercent: string | null): number {
  const p = parseFloat(price);
  if (!discountPercent) return p;
  const d = parseFloat(discountPercent);
  if (d <= 0 || d > 100) return p;
  return parseFloat((p * (1 - d / 100)).toFixed(2));
}

async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
  const [customer] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, order.customerId));
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

  return {
    id: order.id,
    customerId: order.customerId,
    customerName: customer?.name ?? "Unknown",
    customerEmail: customer?.email ?? "",
    items: items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      subtotal: parseFloat((parseFloat(item.unitPrice) * item.quantity).toFixed(2)),
    })),
    total: parseFloat(order.total),
    status: order.status,
    shippingAddress: order.shippingAddress,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const { userId, role } = req.user!;
  let orders: (typeof ordersTable.$inferSelect)[];

  if (role === "customer") {
    orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, userId))
      .orderBy(ordersTable.createdAt);
  } else {
    // Seller: get orders that contain their products
    const sellerOrderIds = await db
      .selectDistinct({ orderId: orderItemsTable.orderId })
      .from(orderItemsTable)
      .where(eq(orderItemsTable.sellerId, userId));

    if (sellerOrderIds.length === 0) {
      res.json([]);
      return;
    }

    const ids = sellerOrderIds.map((r) => r.orderId);
    orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, ids[0]))
      .orderBy(ordersTable.createdAt);

    // fetch all using a manual approach for multiple IDs
    if (ids.length > 1) {
      const allOrders = await Promise.all(
        ids.map((id) => db.select().from(ordersTable).where(eq(ordersTable.id, id)))
      );
      orders = allOrders.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  const result = await Promise.all(orders.map(buildOrderResponse));
  res.json(result);
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "customer") {
    res.status(403).json({ error: "Only customers can place orders" });
    return;
  }

  const parsed = PlaceOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const cartItems = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, req.user!.userId));

  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  // Fetch all products and compute total
  const productDetails = await Promise.all(
    cartItems.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      return { item, product };
    })
  );

  let total = 0;
  const orderItemsData = productDetails
    .filter(({ product }) => product != null)
    .map(({ item, product }) => {
      const finalPrice = computeFinalPrice(product.price, product.discountPercent);
      total += finalPrice * item.quantity;
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: String(finalPrice),
        sellerId: product.sellerId,
      };
    });

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerId: req.user!.userId,
      total: String(parseFloat(total.toFixed(2))),
      status: "pending",
      shippingAddress: parsed.data.shippingAddress,
    })
    .returning();

  await db.insert(orderItemsTable).values(
    orderItemsData.map((item) => ({ ...item, orderId: order.id }))
  );

  // Clear the cart after order placement
  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.userId));

  res.status(201).json(await buildOrderResponse(order));
});

router.get("/orders/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Check access: customer must own the order, seller must have items in it
  if (req.user!.role === "customer" && order.customerId !== req.user!.userId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (req.user!.role === "seller") {
    const [sellerItem] = await db
      .select()
      .from(orderItemsTable)
      .where(and(eq(orderItemsTable.orderId, order.id), eq(orderItemsTable.sellerId, req.user!.userId)));
    if (!sellerItem) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  res.json(await buildOrderResponse(order));
});

router.patch("/orders/:id/status", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "seller") {
    res.status(403).json({ error: "Only sellers can update order status" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateOrderStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid order ID" });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Verify seller has items in this order
  const [sellerItem] = await db
    .select()
    .from(orderItemsTable)
    .where(and(eq(orderItemsTable.orderId, order.id), eq(orderItemsTable.sellerId, req.user!.userId)));
  if (!sellerItem) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const newStatus = parsed.data.status as "pending" | "processing" | "shipped" | "delivered" | "cancelled";

  // Decrease stock only when order is delivered
  if (newStatus === "delivered" && order.status !== "delivered") {
    const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    for (const item of orderItems) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await db.update(productsTable).set({ stock: newStock }).where(eq(productsTable.id, product.id));
      }
    }
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  res.json(await buildOrderResponse(updated));
});

export default router;
