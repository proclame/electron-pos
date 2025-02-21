function errorHandler(err, req, res, next) {
    console.error('Error:', err);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid JSON payload'
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
}

module.exports = errorHandler; 