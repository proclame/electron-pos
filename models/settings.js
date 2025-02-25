class SettingsRepository {
  constructor(db) {
    this.db = db;
  }

  getAll() {
    return this.db
      .prepare('SELECT key, value FROM settings')
      .all()
      .reduce(
        (acc, row) => ({
          ...acc,
          [row.key]: row.value,
        }),
        {},
      );
  }

  update(settings) {
    return this.db.transact('update settings', () => {
      const stmt = this.db.prepare(`
                UPDATE settings 
                SET value = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE key = ?
            `);

      Object.entries(settings).forEach(([key, value]) => {
        stmt.run(value.toString(), key);
      });
      return { ok: true };
    });
  }
}

module.exports = SettingsRepository;
