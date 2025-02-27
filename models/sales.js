class SalesRepository {
  constructor(db) {
    this.db = db;
  }

  getSales({ page = 1, pageSize = 10, startDate = '', endDate = '' }) {
    const offset = (page - 1) * pageSize;
    let whereClause = '';
    let params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE created_at BETWEEN ? AND ?';
      params = [startDate, endDate + ' 23:59:59'];
    }

    // Get total count
    const countQuery = `
            SELECT COUNT(*) as total 
            FROM sales 
            ${whereClause}
        `;
    const { total } = this.db.prepare(countQuery).get(...params);

    // Get paginated sales with their items
    const salesQuery = `
            SELECT 
                s.*,
                GROUP_CONCAT(
                    json_object(
                        'id', si.id,
                        'product_id', si.product_id,
                        'quantity', si.quantity,
                        'unit_price', si.unit_price,
                        'total', si.total,
                        'product_name', p.name
                    )
                ) as items
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN products p ON si.product_id = p.id
            ${whereClause}
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;

    const sales = this.db
      .prepare(salesQuery)
      .all(...params, pageSize, offset)
      .map((sale) => ({
        ...sale,
        items: sale.items ? JSON.parse(`[${sale.items}]`) : [],
      }));

    return {
      ok: true,
      sales,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  getSalesByProduct({ startDate = '', endDate = '' }) {
    let whereClause = '';
    let params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE s.created_at BETWEEN ? AND ?';
      params = [startDate, endDate + ' 23:59:59'];
    }

    const query = `
            SELECT 
                p.id as product_id,
                p.product_code,
                p.name as product_name,
                SUM(si.quantity) as total_quantity,
                SUM(si.total) as total_revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            JOIN sales s ON si.sale_id = s.id
            ${whereClause}
            GROUP BY p.id, p.product_code, p.name
            ORDER BY total_revenue DESC
        `;

    return this.db.prepare(query).all(...params);
  }

  getSale(id) {
    const sale = this.db
      .prepare(
        `
            SELECT * FROM sales WHERE id = ?
        `,
      )
      .get(id);

    if (!sale) {
      throw new Error('Sale not found');
    }

    const items = this.db
      .prepare(
        `
            SELECT 
                si.*,
                p.name as product_name,
                p.product_code
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE sale_id = ?
        `,
      )
      .all(id);

    return { ...sale, items };
  }

  create(saleData) {
    const result = this.db.transact('create sale', () => {
      // Insert sale
      const saleResult = this.db
        .prepare(
          `
                INSERT INTO sales (
                    subtotal, discount_amount, total, payment_method, 
                    needs_invoice, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `,
        )
        .run(
          saleData.subtotal,
          saleData.discount_amount,
          saleData.total,
          saleData.payment_method,
          saleData.needs_invoice ? 1 : 0,
          saleData.notes,
        );

      const saleId = saleResult.lastInsertRowid;

      // Insert sale items
      const insertItem = this.db.prepare(`
                INSERT INTO sale_items (
                    sale_id, 
                    product_id, 
                    quantity, 
                    unit_price, 
                    subtotal, 
                    discount_percentage, 
                    total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

      saleData.items.forEach((item) => {
        insertItem.run(
          saleId,
          item.product.id,
          item.quantity,
          item.product.unit_price,
          item.subtotal,
          item.discount_percentage,
          item.total,
        );
      });

      return { id: saleId };
    });

    return { ok: true, ...result };
  }

  update(id, updates) {
    this.db
      .prepare(
        `
            UPDATE sales 
            SET notes = ?, needs_invoice = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `,
      )
      .run(updates.notes, updates.needs_invoice ? 1 : 0, id);

    return { ok: true };
  }
}

module.exports = SalesRepository;
