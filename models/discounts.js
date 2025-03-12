const { db } = require('./database');

const discountsRepo = {
  getAll() {
    return db.prepare('SELECT * FROM discounts ORDER BY created_at DESC').all();
  },

  getActive() {
    return db.prepare('SELECT * FROM discounts WHERE active = 1 ORDER BY created_at DESC').all();
  },

  getById(id) {
    return db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
  },

  getByBarcode(barcode) {
    return db.prepare('SELECT * FROM discounts WHERE barcode = ? AND barcode IS NOT NULL AND active = 1').get(barcode);
  },

  create(discount) {
    const stmt = db.prepare(`
      INSERT INTO discounts (name, type, value, auto_activate, min_cart_value, active, barcode, show_on_pos)
      VALUES (@name, @type, @value, @auto_activate, @min_cart_value, @active, @barcode, @show_on_pos)
    `);

    discount.auto_activate = discount.auto_activate ? 1 : 0;
    discount.active = discount.active ? 1 : 0;
    discount.show_on_pos = discount.show_on_pos ? 1 : 0;
    const result = stmt.run(discount);
    return result.lastInsertRowid;
  },

  update(id, discount) {
    const stmt = db.prepare(`
      UPDATE discounts 
      SET name = @name, 
          type = @type, 
          value = @value, 
          auto_activate = @auto_activate, 
          min_cart_value = @min_cart_value, 
          active = @active,
          barcode = @barcode,
          show_on_pos = @show_on_pos
      WHERE id = @id
    `);

    discount.auto_activate = discount.auto_activate ? 1 : 0;
    discount.active = discount.active ? 1 : 0;
    discount.show_on_pos = discount.show_on_pos ? 1 : 0;
    return stmt.run({ ...discount, id });
  },

  delete(id) {
    return db.prepare('DELETE FROM discounts WHERE id = ?').run(id);
  },

  getApplicableDiscounts(cartTotal) {
    return db
      .prepare(
        'SELECT * FROM discounts WHERE active = 1 AND auto_activate = 1 AND min_cart_value <= ? ORDER BY value DESC',
      )
      .all(cartTotal);
  },
};

module.exports = { discountsRepo };
