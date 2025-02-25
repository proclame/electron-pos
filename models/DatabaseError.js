class DatabaseError extends Error {
  constructor(message, code, operation) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.operation = operation;
  }

  static wrap(error, operation) {
    return new DatabaseError(`Database error during ${operation}: ${error.message}`, error.code, operation);
  }
}

module.exports = DatabaseError;
