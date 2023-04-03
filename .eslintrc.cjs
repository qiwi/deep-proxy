module.exports = {
    extends: [
        'eslint-config-qiwi',
        'prettier',
    ],
    rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        'unicorn/no-useless-switch-case': 'off'
    }
};
