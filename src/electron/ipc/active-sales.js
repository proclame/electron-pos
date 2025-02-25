const { ipcMain } = require('electron');
const { db } = require('../../../models/database');

function registerActiveSalesHandlers() {
    ipcMain.handle('get-active-sales', async () => {
      
        try {
            const activeSales = db.prepare(`
                SELECT * FROM active_sales 
                ORDER BY created_at DESC
            `).all();

            return activeSales.map(sale => ({
                ...sale,
                cart_data: JSON.parse(sale.cart_data)
            }));
        } catch (error) {
            console.error('Error fetching active sales:', error);
            throw error;
        }
    });

    ipcMain.handle('create-active-sale', async (event, cartData) => {
        console.log('create-active-sale', cartData);
        try {
            const status = 'current';
            const notes = '';

            const result = db.prepare(`
                INSERT INTO active_sales (cart_data, status, notes)
                VALUES (?, ?, ?)
            `).run(JSON.stringify(cartData), status, notes);
    
            return { 
                id: result.lastInsertRowid,
                message: 'Active sale created successfully' 
            };
        } catch (error) {
            console.error('Error creating active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('get-active-sale', async (event, id) => {
        try {
            const sale = db.prepare('SELECT * FROM active_sales WHERE id = ?').get(id);
            return {
                ...sale,
                cart_data: JSON.parse(sale.cart_data)
            };
        } catch (error) {
            console.error('Error fetching active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('update-active-sale', async (event, id, cartData) => {
        console.log('update-active-sale', id, cartData);
        try {
            const result = db.prepare(`
                UPDATE active_sales 
                SET cart_data = ?
                WHERE id = ?
            `).run(JSON.stringify(cartData), id);

            return { ok: true, message: 'Active sale updated successfully' }; 
        } catch (error) {
            console.error('Error updating active sale:', error);
            throw error;
        }
    }); 

    ipcMain.handle('delete-active-sale', async (event, id) => {
        try {
            const result = db.prepare('DELETE FROM active_sales WHERE id = ?').run(id);
            return { ok: true, message: 'Active sale deleted successfully' };
        } catch (error) {
            console.error('Error deleting active sale:', error);
            throw error;
        }
    });

    ipcMain.handle('put-on-hold', async (event, id, notes = '') => {
        try {
            const result = db.prepare(`
                UPDATE active_sales 
                SET status = 'on_hold', notes = ?
                WHERE id = ?
            `).run(notes, id);

            return { ok: true, message: 'Sale put on hold successfully' };
        } catch (error) {
            console.error('Error putting sale on hold:', error);
            throw error;
        }
    }); 

    ipcMain.handle('resume-sale', async (event, id) => {
        try {
            const result = db.prepare(`
                UPDATE active_sales 
                SET status = 'current', notes = ''
                WHERE id = ?
            `).run(id);

            return { ok: true, message: 'Sale resumed successfully' };
        } catch (error) {
            console.error('Error resuming sale:', error);
            throw error;
        }
    });

}

module.exports = registerActiveSalesHandlers;