import { Router, type IRouter } from "express";
import { eq, count, sum, desc } from "drizzle-orm";
import { db, usersTable, productsTable, ordersTable, orderItemsTable, platformSettingsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

router.get("/settings", async (_req, res): Promise<void> => {
  const [setting] = await db
    .select()
    .from(platformSettingsTable)
    .where(eq(platformSettingsTable.key, "exchange_rate"));
  res.json({ exchangeRate: parseFloat(setting?.value ?? "14500") });
});

// ─── ADMIN MIDDLEWARE ─────────────────────────────────────────────────────────

router.use("/admin", requireAuth, requireRole("admin"));

// ─── STATS ───────────────────────────────────────────────────────────────────

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [{ userCount }] = await db
    .select({ userCount: count(usersTable.id) })
    .from(usersTable);

  const [{ productCount }] = await db
    .select({ productCount: count(productsTable.id) })
    .from(productsTable);

  const [{ orderCount }] = await db
    .select({ orderCount: count(ordersTable.id) })
    .from(ordersTable);

  const [{ revenue }] = await db
    .select({ revenue: sum(ordersTable.total) })
    .from(ordersTable);

  const ordersByStatus = await db
    .select({ status: ordersTable.status, count: count(ordersTable.id) })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  const recentWithDetails = await Promise.all(
    recentOrders.map(async (order) => {
      const [customer] = await db
        .select({ name: usersTable.name, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, order.customerId));
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
      return {
        id: order.id,
        customerId: order.customerId,
        customerName: customer?.name ?? "Unknown",
        customerEmail: customer?.email ?? "",
        total: parseFloat(order.total),
        status: order.status,
        shippingAddress: order.shippingAddress,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unitPrice),
          subtotal: parseFloat((parseFloat(i.unitPrice) * i.quantity).toFixed(2)),
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    })
  );

  res.json({
    totalUsers: userCount,
    totalProducts: productCount,
    totalOrders: orderCount,
    totalRevenue: parseFloat(revenue ?? "0"),
    ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s.count })),
    recentOrders: recentWithDetails,
  });
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get("/admin/users", async (_req, res): Promise<void> => {
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));
  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user!.userId) {
    res.status(400).json({ error: "Cannot delete your own admin account" });
    return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User deleted" });
});

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

router.get("/admin/products", async (_req, res): Promise<void> => {
  const products = await db
    .select()
    .from(productsTable)
    .orderBy(desc(productsTable.createdAt));

  const result = await Promise.all(
    products.map(async (p) => {
      const [seller] = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, p.sellerId));
      return {
        id: p.id,
        sellerId: p.sellerId,
        sellerName: seller?.name ?? "Unknown",
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        discountPercent: p.discountPercent ? parseFloat(p.discountPercent) : null,
        category: p.category,
        stock: p.stock,
        imageUrl: p.imageUrl ?? null,
        createdAt: p.createdAt.toISOString(),
      };
    })
  );
  res.json(result);
});

router.patch("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { name, description, price, category, stock, discountPercent, imageUrl } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  if (price !== undefined) update.price = String(price);
  if (category !== undefined) update.category = category;
  if (stock !== undefined) update.stock = parseInt(stock, 10);
  if (discountPercent !== undefined) update.discountPercent = discountPercent === null ? null : String(discountPercent);
  if (imageUrl !== undefined) update.imageUrl = imageUrl;

  await db.update(productsTable).set(update).where(eq(productsTable.id, id));
  const [updated] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.sellerId));

  res.json({
    id: updated.id,
    sellerId: updated.sellerId,
    sellerName: seller?.name ?? "Unknown",
    name: updated.name,
    description: updated.description,
    price: parseFloat(updated.price),
    discountPercent: updated.discountPercent ? parseFloat(updated.discountPercent) : null,
    category: updated.category,
    stock: updated.stock,
    imageUrl: updated.imageUrl ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ message: "Product deleted" });
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

router.get("/admin/orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  const result = await Promise.all(
    orders.map(async (order) => {
      const [customer] = await db
        .select({ name: usersTable.name, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, order.customerId));
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
      return {
        id: order.id,
        customerId: order.customerId,
        customerName: customer?.name ?? "Unknown",
        customerEmail: customer?.email ?? "",
        total: parseFloat(order.total),
        status: order.status,
        shippingAddress: order.shippingAddress,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: parseFloat(i.unitPrice),
          subtotal: parseFloat((parseFloat(i.unitPrice) * i.quantity).toFixed(2)),
        })),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    })
  );
  res.json(result);
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  await db
    .update(ordersTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(ordersTable.id, id));
  res.json({ message: "Order status updated", status });
});

// ─── SETTINGS ────────────────────────────────────────────────────────────────

router.get("/admin/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(platformSettingsTable);
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  res.json({ exchangeRate: parseFloat(map["exchange_rate"] ?? "14500") });
});

router.patch("/admin/settings", async (req, res): Promise<void> => {
  const { exchangeRate } = req.body;
  if (exchangeRate !== undefined) {
    await db
      .insert(platformSettingsTable)
      .values({ key: "exchange_rate", value: String(exchangeRate) })
      .onConflictDoUpdate({
        target: platformSettingsTable.key,
        set: { value: String(exchangeRate) },
      });
  }
  res.json({ message: "Settings updated" });
});

export default router;
