import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/*.d.ts"],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"), {
    files: ["./src/*.ts", "./src/**/*.ts"],

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
        ecmaVersion: 11,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    rules: {
        "@typescript-eslint/no-floating-promises": "error",

        indent: ["error", 2, {
            SwitchCase: 1,
        }],

        "no-trailing-spaces": "warn",

        "keyword-spacing": ["error", {
            overrides: {
                if: {
                    after: false,
                },

                while: {
                    after: false,
                },

                for: {
                    after: false,
                },
            },
        }],

        "function-call-argument-newline": ["error", "consistent"],
        "function-paren-newline": ["error", "multiline"],
        "linebreak-style": ["error", "unix"],

        quotes: ["error", "single", {
            avoidEscape: true,
        }],

        "require-await": 2,
        "mocha/no-async-describe": "error",
        "mocha/no-nested-tests": "error",
        "mocha/no-synchronous-tests": "error",
        semi: ["error", "always"],
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "comma-dangle": ["error", "always-multiline"],
        "no-unused-vars": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",

        "@typescript-eslint/no-unused-vars": ["warn", {
            varsIgnorePattern: "(?:_.+|__dirname|__filename)",
            argsIgnorePattern: "_.+",
        }],

        "no-async-promise-executor": "warn",
        "@typescript-eslint/no-empty-interface": "off",

        "prefer-const": ["error", {
            destructuring: "all",
        }],

        "@typescript-eslint/ban-ts-comment": "off",
        "object-curly-spacing": ["warn", "never"],
        "arrow-spacing": "warn",
        "array-bracket-spacing": ["warn", "never"],
        "template-curly-spacing": "warn",
        "space-in-parens": "warn",
        "arrow-body-style": ["warn", "as-needed"],

        "no-restricted-syntax": ["warn", {
            message: "toHuman results in horrible, hard to debug conversions with no stability guarantees, use Codec or .toJson instead",
            selector: "MemberExpression > Identifier[name=\"toHuman\"]",
        }],

        "@typescript-eslint/naming-convention": ["warn", {
            selector: "default",
            format: ["camelCase"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
        }, {
            selector: "variable",
            format: ["camelCase", "UPPER_CASE"],
            leadingUnderscore: "allow",
            trailingUnderscore: "allow",
        }, {
            selector: "typeLike",
            format: ["PascalCase"],
        }, {
            selector: "memberLike",
            format: null,
        }],
    },
}];
