class ProductsRepository {
  constructor(db) {
    this.db = db;
  }

  getProducts({ page = 1, pageSize = 10, search = '' }) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE archived_at IS NULL';
    let params = [];

    if (search) {
      whereClause = 'WHERE (name LIKE ? OR barcode LIKE ? OR product_code LIKE ?) AND archived_at IS NULL';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    const products = this.db
      .prepare(
        `
            SELECT * FROM products 
            ${whereClause}
            ORDER BY name
            LIMIT ? OFFSET ?
        `,
      )
      .all(...params, pageSize, offset);

    const totalCount = this.db
      .prepare(
        `
            SELECT COUNT(*) as count FROM products ${whereClause}
        `,
      )
      .get(...params);

    return {
      products,
      total: totalCount.count,
    };
  }

  getByBarcode(barcode) {
    const product = this.db.prepare('SELECT * FROM products WHERE barcode = ? AND archived_at IS NULL').get(barcode);
    if (!product) {
      // throw new Error('Product not found');
    }
    return product;
  }

  search(query) {
    return this.db
      .prepare(
        `
            SELECT * FROM products 
            WHERE (name LIKE ? OR barcode LIKE ? OR product_code LIKE ?) 
            AND archived_at IS NULL
            LIMIT 10
        `,
      )
      .all(`%${query}%`, `%${query}%`, `%${query}%`);
  }

  create(product) {
    const result = this.db
      .prepare(
        `
                INSERT INTO products (
                    name, barcode, product_code, unit_price, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
      )
      .run(product.name, product.barcode, product.product_code, product.unit_price);
    return { id: result.lastInsertRowid };
  }

  update(id, product) {
    this.db
      .prepare(
        `
                UPDATE products 
                SET name = ?, barcode = ?, product_code = ?, 
                    unit_price = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
      )
      .run(product.name, product.barcode, product.product_code, product.unit_price, id);
    return { ok: true };
  }

  delete(id) {
    const isUsed = this.isProductUsedInSales(id);

    if (isUsed) {
      // Soft delete - set archived_at
      this.db.prepare('UPDATE products SET archived_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    } else {
      // Hard delete - remove from database
      this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }

    return { success: true };
  }

  importProducts(records) {
    return this.db.transact('import products', () => {
      const stmt = this.db.prepare(`
                INSERT INTO products (
                    name, barcode, product_code, unit_price,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `);

      const results = records.reduce(
        (results, record) => {
          try {
            stmt.run(record.name, record.barcode, record.product_code, parseFloat(record.unit_price));
            return { count: results.count + 1, errors: results.errors };
          } catch (error) {
            const errors = results.errors;
            if (error.code in errors) {
              errors[error.code]++;
            } else {
              errors[error.code] = 1;
            }
            return { count: results.count, errors: errors };
          }
        },
        { count: 0, errors: {} },
      );

      return { ok: true, ...results };
    });
  }

  clearAll() {
    // First, archive products that are used in sales
    this.db
      .prepare(
        `
      UPDATE products 
      SET archived_at = CURRENT_TIMESTAMP, barcode = NULL
      WHERE id IN (
        SELECT DISTINCT product_id FROM sale_items
      ) AND archived_at IS NULL
    `,
      )
      .run();

    // Then delete products that aren't used
    return this.db.prepare('DELETE FROM products WHERE archived_at IS NULL').run();
  }

  isProductUsedInSales(productId) {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?').get(productId);
    return result.count > 0;
  }
}

module.exports = ProductsRepository;
