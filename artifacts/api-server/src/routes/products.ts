import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, productsTable, usersTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
  UpdateDiscountParams,
  UpdateDiscountBody,
  UpdateStockParams,
  UpdateStockBody,
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

async function buildProductResponse(product: typeof productsTable.$inferSelect) {
  const [seller] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, product.sellerId));
  return {
    id: product.id,
    sellerId: product.sellerId,
    sellerName: seller?.name ?? "Unknown",
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    discountPercent: product.discountPercent ? parseFloat(product.discountPercent) : null,
    finalPrice: computeFinalPrice(product.price, product.discountPercent),
    category: product.category,
    stock: product.stock,
    imageUrl: product.imageUrl ?? null,
    createdAt: product.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(productsTable).$dynamic();

  const conditions = [];
  if (params.data.category) {
    conditions.push(eq(productsTable.category, params.data.category));
  }
  if (params.data.search) {
    conditions.push(ilike(productsTable.name, `%${params.data.search}%`));
  }
  if (params.data.sellerId) {
    conditions.push(eq(productsTable.sellerId, params.data.sellerId));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const products = await query.orderBy(sql`${productsTable.createdAt} desc`);
  const result = await Promise.all(products.map(buildProductResponse));
  res.json(result);
});

router.get("/products/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ category: productsTable.category })
    .from(productsTable)
    .orderBy(productsTable.category);
  res.json(rows.map((r) => r.category));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(await buildProductResponse(product));
});

router.post("/products", requireAuth, requireRole("seller"), async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      sellerId: req.user!.userId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: String(parsed.data.price),
      category: parsed.data.category,
      stock: parsed.data.stock,
      imageUrl: parsed.data.imageUrl ?? null,
    })
    .returning();

  res.status(201).json(await buildProductResponse(product));
});

router.patch("/products/:id", requireAuth, requireRole("seller"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing || existing.sellerId !== req.user!.userId) {
    res.status(404).json({ error: "Product not found or access denied" });
    return;
  }

  const updateData: Partial<typeof productsTable.$inferInsert> = {};
  if (parsed.data.name != null) updateData.name = parsed.data.name;
  if (parsed.data.description != null) updateData.description = parsed.data.description;
  if (parsed.data.price != null) updateData.price = String(parsed.data.price);
  if (parsed.data.category != null) updateData.category = parsed.data.category;
  if ("imageUrl" in parsed.data) updateData.imageUrl = parsed.data.imageUrl ?? null;

  const [updated] = await db.update(productsTable).set(updateData).where(eq(productsTable.id, params.data.id)).returning();
  res.json(await buildProductResponse(updated));
});

router.delete("/products/:id", requireAuth, requireRole("seller"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing || existing.sellerId !== req.user!.userId) {
    res.status(404).json({ error: "Product not found or access denied" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.json({ message: "Product deleted" });
});

router.patch("/products/:id/discount", requireAuth, requireRole("seller"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateDiscountParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const parsed = UpdateDiscountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing || existing.sellerId !== req.user!.userId) {
    res.status(404).json({ error: "Product not found or access denied" });
    return;
  }

  const discountValue = parsed.data.discountPercent;
  if (discountValue != null && (discountValue < 0 || discountValue > 100)) {
    res.status(400).json({ error: "Discount must be between 0 and 100" });
    return;
  }

  const [updated] = await db
    .update(productsTable)
    .set({ discountPercent: discountValue != null ? String(discountValue) : null })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  res.json(await buildProductResponse(updated));
});

router.patch("/products/:id/stock", requireAuth, requireRole("seller"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateStockParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid product ID" });
    return;
  }

  const parsed = UpdateStockBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.stock < 0) {
    res.status(400).json({ error: "Stock cannot be negative" });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing || existing.sellerId !== req.user!.userId) {
    res.status(404).json({ error: "Product not found or access denied" });
    return;
  }

  const [updated] = await db
    .update(productsTable)
    .set({ stock: parsed.data.stock })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  res.json(await buildProductResponse(updated));
});

export default router;
