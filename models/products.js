class ProductsRepository {
    constructor(db) {
        this.db = db;
    }

    getProducts({ page = 1, pageSize = 10, search = '' }) {
        const offset = (page - 1) * pageSize;
        let whereClause = '';
        let params = [];

        if (search) {
            whereClause = 'WHERE name LIKE ? OR barcode LIKE ? OR product_code LIKE ?';
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        const products = this.db.prepare(`
            SELECT * FROM products 
            ${whereClause}
            ORDER BY name
            LIMIT ? OFFSET ?
        `).all(...params, pageSize, offset);

        const totalCount = this.db.prepare(`
            SELECT COUNT(*) as count FROM products ${whereClause}
        `).get(...params);

        return {
            products,
            total: totalCount.count
        };
    }

    getByBarcode(barcode) {
        const product = this.db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
        if (!product) {
            throw new Error('Product not found');
        }
        return product;
    }

    search(query) {
        return this.db.prepare(`
            SELECT * FROM products 
            WHERE name LIKE ? OR barcode LIKE ? OR product_code LIKE ?
            LIMIT 10
        `).all(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    create(product) {
            const result = this.db.prepare(`
                INSERT INTO products (
                    name, barcode, product_code, unit_price, 
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).run(
                product.name,
                product.barcode,
                product.product_code,
                product.unit_price
            );
            return { id: result.lastInsertRowid };
    }

    update(id, product) {
            this.db.prepare(`
                UPDATE products 
                SET name = ?, barcode = ?, product_code = ?, 
                    unit_price = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                product.name,
                product.barcode,
                product.product_code,
                product.unit_price,
                id
            );
            return { ok: true };
    }

    delete(id) {
            this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
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

            const importedCount = records.reduce((count, record) => {
                try {
                    stmt.run(
                        record.name,
                        record.barcode,
                        record.product_code,
                        parseFloat(record.unit_price)
                    );
                    return count + 1;
                } catch (error) {
                    console.error('Error importing row:', error, record);
                    return count;
                }
            }, 0);

            return { ok: true, importedCount };
        });
    }
}

module.exports = ProductsRepository; 