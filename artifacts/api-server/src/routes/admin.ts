import { Router, type IRouter } from "express";
import { eq, count, sum, desc } from "drizzle-orm";
import { db, usersTable, productsTable, ordersTable, orderItemsTable, platformSettingsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

function parsePagination(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "20"), 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

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
  const [{ userCount }] = await db.select({ userCount: count(usersTable.id) }).from(usersTable);
  const [{ productCount }] = await db.select({ productCount: count(productsTable.id) }).from(productsTable);
  const [{ orderCount }] = await db.select({ orderCount: count(ordersTable.id) }).from(ordersTable);
  const [{ revenue }] = await db.select({ revenue: sum(ordersTable.total) }).from(ordersTable);

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
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
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

router.get("/admin/users", async (req, res): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const [{ total }] = await db.select({ total: count(usersTable.id) }).from(usersTable);

  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(paginated(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })), total, page, limit));
});

router.delete("/admin/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  if (id === req.user!.userId) { res.status(400).json({ error: "Cannot delete your own admin account" }); return; }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, id));
  if (!existing) { res.status(404).json({ error: "User not found" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ message: "User deleted" });
});

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

router.get("/admin/products", async (req, res): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const [{ total }] = await db.select({ total: count(productsTable.id) }).from(productsTable);

  const rows = await db
    .select({
      id: productsTable.id,
      sellerId: productsTable.sellerId,
      sellerName: usersTable.name,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      discountPercent: productsTable.discountPercent,
      category: productsTable.category,
      stock: productsTable.stock,
      imageUrl: productsTable.imageUrl,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .orderBy(desc(productsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const data = rows.map((p) => ({
    id: p.id,
    sellerId: p.sellerId,
    sellerName: p.sellerName ?? "Unknown",
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    discountPercent: p.discountPercent ? parseFloat(p.discountPercent) : null,
    category: p.category,
    stock: p.stock,
    imageUrl: p.imageUrl ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  res.json(paginated(data, total, page, limit));
});

router.patch("/admin/products/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }

  const [existing] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Product not found" }); return; }

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

  const [updated] = await db
    .select({ id: productsTable.id, sellerId: productsTable.sellerId, sellerName: usersTable.name, name: productsTable.name, description: productsTable.description, price: productsTable.price, discountPercent: productsTable.discountPercent, category: productsTable.category, stock: productsTable.stock, imageUrl: productsTable.imageUrl, createdAt: productsTable.createdAt })
    .from(productsTable)
    .leftJoin(usersTable, eq(productsTable.sellerId, usersTable.id))
    .where(eq(productsTable.id, id));

  res.json({
    id: updated.id,
    sellerId: updated.sellerId,
    sellerName: updated.sellerName ?? "Unknown",
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
  if (isNaN(id)) { res.status(400).json({ error: "Invalid product ID" }); return; }

  const [existing] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Product not found" }); return; }

  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ message: "Product deleted" });
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

router.get("/admin/orders", async (req, res): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const [{ total }] = await db.select({ total: count(ordersTable.id) }).from(ordersTable);

  const orders = await db
    .select({
      id: ordersTable.id,
      customerId: ordersTable.customerId,
      customerName: usersTable.name,
      customerEmail: usersTable.email,
      total: ordersTable.total,
      status: ordersTable.status,
      shippingAddress: ordersTable.shippingAddress,
      createdAt: ordersTable.createdAt,
      updatedAt: ordersTable.updatedAt,
    })
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.customerId, usersTable.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const data = await Promise.all(
    orders.map(async (order) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      return {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customerName ?? "Unknown",
        customerEmail: order.customerEmail ?? "",
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

  res.json(paginated(data, total, page, limit));
});

router.patch("/admin/orders/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid order ID" }); return; }

  const [existing] = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.id, id));
  if (!existing) { res.status(404).json({ error: "Order not found" }); return; }

  const { status } = req.body;
  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  await db.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id));
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
    const rate = parseFloat(exchangeRate);
    if (isNaN(rate) || rate <= 0) { res.status(400).json({ error: "Exchange rate must be a positive number" }); return; }
    await db
      .insert(platformSettingsTable)
      .values({ key: "exchange_rate", value: String(rate) })
      .onConflictDoUpdate({ target: platformSettingsTable.key, set: { value: String(rate) } });
  }
  res.json({ message: "Settings updated" });
});

export default router;
