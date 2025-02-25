const path = require('path');

const config = {
    development: {
        window: {
            width: 1200,
            height: 900,
            devTools: true
        },
        database: {
            path: path.join(__dirname, '../../models/database.sqlite')
        }
    },
    production: {
        window: {
            width: 1200,
            height: 900,
            devTools: false
        },
        database: {
            path: path.join(process.resourcesPath, 'database.sqlite')
        }
    }
};

module.exports = function getConfig(isDev) {
    return config[isDev ? 'development' : 'production'];
}; 