const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../../models/database');
const apiRouter = require('../../routes/api');
const getConfig = require('../config');
const errorHandler = require('./middleware/errorHandler');

class Server {
    constructor() {       
        this.app = express();
        this.server = null;
        this.dbStatements = null;
    }
    
    loadConfig(isDev) {
        const config = getConfig(isDev);
        this.port = config.server.port;
        this.config = config;
        this.port = config.server.port;
    }

    setupMiddleware() {
        if (this.config.server.cors) {
            this.app.use(cors());
        }
        this.app.use(express.json({ limit: this.config.server.jsonLimit }));
        this.app.use('/api', apiRouter);
        this.app.use(errorHandler);
    }

    async start(isDev) {
        this.loadConfig(isDev);
        try {
            this.dbStatements = await initDatabase();
            this.setupMiddleware();
            
            this.server = this.app.listen(this.port, () => {
                console.log(`Express server running on port ${this.port}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            throw error;
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = new Server(); 