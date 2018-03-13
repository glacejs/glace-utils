module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "globals": {
        "test": true,
        "before": true,
        "beforeChunk": true,
        "chunk": true,
        "expect": true,
        "sinon": true,
        "scope": true,
        "after": true,
        "__glaceLogger": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2017,
        "sourceType": "module"
    },
    "rules": {
        "no-trailing-spaces": 1,
        "no-console": 0,
        "no-extra-semi": 1,
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};
