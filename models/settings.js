class SettingsRepository {
  constructor(db) {
    this.db = db;
    this.settings = null;
  }

  getAll() {
    if (this.settings) {
      return this.settings;
    }

    this.settings = this.db
      .prepare('SELECT key, value FROM settings')
      .all()
      .reduce(
        (acc, row) => ({
          ...acc,
          [row.key]: row.value,
        }),
        {},
      );

    return this.settings;
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
      this.settings = null;
      return { ok: true };
    });
  }
}

module.exports = SettingsRepository;
