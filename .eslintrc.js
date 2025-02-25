module.exports = {
    env: {
        node: true,
        es2021: true
    },
    extends: ['eslint:recommended'],
    rules: {
        'no-unused-vars': 'warn',
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
};