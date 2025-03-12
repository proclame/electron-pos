const addBarcodeSoundSetting = `
  INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('barcode_sound_enabled', 'true');
`;

module.exports = {
  up: addBarcodeSoundSetting,
  down: `
    DELETE FROM settings WHERE key IN (
      'barcode_sound_enabled'
    );
  `,
};
