class ActiveSalesRepository {
    constructor(db) {
        this.db = db;
    }

    getAll() {
        return this.db.prepare(`
            SELECT 
                id,
                cart_data,
                status,
                notes,
                created_at,
                updated_at
            FROM active_sales
        `).all();
    }

    getActiveSale(sale_id) {
        return this.db.prepare(`
            SELECT * FROM active_sales WHERE id = ?
        `).get(sale_id);
    }

    create(sale) {
            const result = this.db.prepare(`
                INSERT INTO active_sales (
                    cart_data,
                    status,
                    created_at,
                    updated_at
                ) VALUES (?, 'current', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `).run(JSON.stringify(sale));

            return { 
                ok: true,
                id: result.lastInsertRowid 
            };
    }

    update(id, sale) {
            this.db.prepare(`
                UPDATE active_sales 
                SET cart_data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(JSON.stringify(sale), id);

            return { ok: true };
    }

    delete(id) {
            this.db.prepare('DELETE FROM active_sales WHERE id = ?').run(id);
            return { ok: true };
    }

    putOnHold(id, notes = '') {
        this.db.prepare(`
            UPDATE active_sales 
            SET status = 'on_hold', 
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(notes, id);

        return { ok: true };
    }

    resume(id) {
            // First, put any current sale on hold
            this.db.prepare(`
                UPDATE active_sales 
                SET status = 'on_hold',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'current'
            `).run();

            // Then resume the selected sale
            this.db.prepare(`
                UPDATE active_sales 
                SET status = 'current',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(id);
            
            return { ok: true };
    }
}

module.exports = ActiveSalesRepository; 