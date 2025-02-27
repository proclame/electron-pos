const addEmailSettings = `
  INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('smtp_host', ''),
    ('smtp_port', '587'),
    ('smtp_secure', 'false'),
    ('smtp_user', ''),
    ('smtp_pass', ''),
    ('smtp_from', '');
`;

module.exports = {
  up: addEmailSettings,
  down: `
    DELETE FROM settings WHERE key IN (
      'smtp_host',
      'smtp_port',
      'smtp_secure',
      'smtp_user',
      'smtp_pass',
      'smtp_from'
    );
  `,
};
