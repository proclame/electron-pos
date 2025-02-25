const { ipcMain } = require('electron');
const { db } = require('../../../models/database');
const csv = require('csv-parse');

function registerProductsHandlers() {
    // Import products from CSV
    ipcMain.handle('products:import-products', async (event, csvData) => {
        try {
            return new Promise((resolve, reject) => {
                const records = [];
                csv.parse(csvData, {
                    columns: true,
                    skip_empty_lines: true
                })
                .on('data', (data) => {
                    records.push(data);
                })
                .on('end', () => {
                    const stmt = db.prepare(`
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

                    resolve({ ok: true, importedCount });
                })
                .on('error', reject);
            });
        } catch (error) {
            console.error('Error importing products:', error);
            throw error;
        }
    });

    // Get all products (paginated)
    ipcMain.handle('products:get-products', async (event, { page = 1, pageSize = 10, search = '' }) => {
        try {
            const offset = (page - 1) * pageSize;
            let whereClause = '';
            let params = [];

            if (search) {
                whereClause = 'WHERE name LIKE ? OR barcode LIKE ? OR product_code LIKE ?';
                params = [`%${search}%`, `%${search}%`, `%${search}%`];
            }

            const products = db.prepare(`
                SELECT * FROM products 
                ${whereClause}
                ORDER BY name
                LIMIT ? OFFSET ?
            `).all(...params, pageSize, offset);

            const totalCount = db.prepare(`
                SELECT COUNT(*) as count FROM products ${whereClause}
            `).get(...params);

            return {
                products,
                total: totalCount.count
            };
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    });

    // Create new product
    ipcMain.handle('products:create-product', async (event, product) => {
        try {
            const result = db.prepare(`
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
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    });

    // Update product
    ipcMain.handle('products:update-product', async (event, { id, product }) => {
        try {
            db.prepare(`
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
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    });

    // Delete product
    ipcMain.handle('products:delete-product', async (event, id) => {
        try {
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    });

    // Get product by barcode
    ipcMain.handle('products:get-product-by-barcode', async (event, barcode) => {
        try {
            const product = db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
            if (!product) {
                throw new Error('Product not found');
            }
            return product;
        } catch (error) {
            console.error('Error finding product:', error);
            throw error;
        }
    });

    // Search products
    ipcMain.handle('products:search-products', async (event, query) => {
        try {
            const products = db.prepare(`
                SELECT * FROM products 
                WHERE name LIKE ? OR barcode LIKE ? OR product_code LIKE ?
                LIMIT 10
            `).all(`%${query}%`, `%${query}%`, `%${query}%`);
            return products;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    });
}

module.exports = registerProductsHandlers;