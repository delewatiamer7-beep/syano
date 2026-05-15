import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/seller", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "seller") {
    res.status(403).json({ error: "Seller access required" });
    return;
  }

  const sellerId = req.user!.userId;

  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, sellerId));
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock < 5).length;

  // Get all orders for this seller
  const sellerOrderIds = await db
    .selectDistinct({ orderId: orderItemsTable.orderId })
    .from(orderItemsTable)
    .where(eq(orderItemsTable.sellerId, sellerId));

  const ids = sellerOrderIds.map((r) => r.orderId);

  let orders: (typeof ordersTable.$inferSelect)[] = [];
  if (ids.length > 0) {
    const allOrders = await Promise.all(
      ids.map((id) => db.select().from(ordersTable).where(eq(ordersTable.id, id)))
    );
    orders = allOrders.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  // Revenue: sum of delivered order items for this seller
  const deliveredOrderIds = orders.filter((o) => o.status === "delivered").map((o) => o.id);
  let totalRevenue = 0;
  if (deliveredOrderIds.length > 0) {
    for (const orderId of deliveredOrderIds) {
      const items = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, orderId) && eq(orderItemsTable.sellerId, sellerId));
      for (const item of items) {
        totalRevenue += parseFloat(item.unitPrice) * item.quantity;
      }
    }
  }

  const ordersByStatus = [
    { status: "pending", count: orders.filter((o) => o.status === "pending").length },
    { status: "processing", count: orders.filter((o) => o.status === "processing").length },
    { status: "shipped", count: orders.filter((o) => o.status === "shipped").length },
    { status: "delivered", count: orders.filter((o) => o.status === "delivered").length },
    { status: "cancelled", count: orders.filter((o) => o.status === "cancelled").length },
  ];

  const recentOrders = await Promise.all(
    orders.slice(0, 5).map(async (order) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      const { usersTable } = await import("@workspace/db");
      const { eq: eqDb } = await import("drizzle-orm");
      const [customer] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eqDb(usersTable.id, order.customerId));
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
          subtotal: parseFloat(item.unitPrice) * item.quantity,
        })),
        total: parseFloat(order.total),
        status: order.status,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      };
    })
  );

  res.json({
    totalProducts,
    totalOrders,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    pendingOrders,
    lowStockProducts,
    recentOrders,
    ordersByStatus,
  });
});

router.get("/dashboard/customer", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "customer") {
    res.status(403).json({ error: "Customer access required" });
    return;
  }

  const customerId = req.user!.userId;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerId, customerId))
    .orderBy(ordersTable.createdAt);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  const recentOrders = await Promise.all(
    orders
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(async (order) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
        const { usersTable } = await import("@workspace/db");
        const { eq: eqDb } = await import("drizzle-orm");
        const [customer] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eqDb(usersTable.id, order.customerId));
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
            subtotal: parseFloat(item.unitPrice) * item.quantity,
          })),
          total: parseFloat(order.total),
          status: order.status,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        };
      })
  );

  res.json({
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    recentOrders,
  });
});

export default router;
