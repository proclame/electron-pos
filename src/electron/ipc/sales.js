const { ipcMain } = require('electron');
const { db } = require('../../../models/database');

function registerSalesHandlers() {
    // Create new sale
    ipcMain.handle('create-sale', async (event, saleData) => {
        try {
            const result = db.transaction(() => {
                // Insert sale
                const saleResult = db.prepare(`
                    INSERT INTO sales (
                        subtotal, total, payment_method, 
                        needs_invoice, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `).run(
                    saleData.subtotal,
                    saleData.total,
                    saleData.payment_method,
                    saleData.needs_invoice ? 1 : 0,
                    saleData.notes
                );

                const saleId = saleResult.lastInsertRowid;

                // Insert sale items
                const insertItem = db.prepare(`
                    INSERT INTO sale_items (
                        sale_id, product_id,
                        quantity, unit_price, subtotal, total
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `);

                saleData.items.forEach(item => {
                    insertItem.run(
                        saleId,
                        item.product.id,
                        item.quantity,
                        item.product.unit_price,
                        item.quantity * item.product.unit_price,
                        item.quantity * item.product.unit_price
                    );
                });

                return { id: saleId };
            })();

            return { ok: true, ...result };
        } catch (error) {
            console.error('Error creating sale:', error);
            throw error;
        }
    });

    // Get all sales (paginated)
    ipcMain.handle('get-sales', async (event, { page = 1, pageSize = 10, startDate = '', endDate = '' }) => {
        try {
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
            const { total } = db.prepare(countQuery).get(...params);
    
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
            
            const sales = db.prepare(salesQuery)
                .all(...params, pageSize, offset)
                .map(sale => ({
                    ...sale,
                    items: sale.items ? JSON.parse(`[${sale.items}]`) : []
                }));
    
            return {
                ok: true,
                sales,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            };
        } catch (error) {
            console.error('Error fetching sales:', error);
            throw error;
        }
    });

    // Get sales by product 
    ipcMain.handle('get-sales-by-product', async (event, { productId, startDate = '', endDate = '' }) => {
        try {
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
    
            const results = db.prepare(query).all(...params);
            return results;
        } catch (error) {
            console.error('Error fetching product sales:', error);
            throw error;
        }
    });
    

    // Get sale by ID
    ipcMain.handle('get-sale', async (event, id) => {
        try {
            const sale = db.prepare(`
                SELECT * FROM sales WHERE id = ?
            `).get(id);

            if (!sale) {
                throw new Error('Sale not found');
            }

            const items = db.prepare(`
                SELECT * FROM sale_items WHERE sale_id = ?
            `).all(id);

            return { ...sale, items };
        } catch (error) {
            console.error('Error fetching sale:', error);
            throw error;
        }
    });

    // Update sale
    ipcMain.handle('update-sale', async (event, { id, updates }) => {
        try {
            db.prepare(`
                UPDATE sales 
                SET notes = ?, needs_invoice = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(updates.notes, updates.needs_invoice ? 1 : 0, id);

            return { ok: true };
        } catch (error) {
            console.error('Error updating sale:', error);
            throw error;
        }
    });
}

module.exports = registerSalesHandlers;
