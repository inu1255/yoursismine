const fs = require("fs");
const path = require("path");
const TS = fs.existsSync(path.join(__dirname, "tsconfig.json"));
const TS_RULES = {
	"@typescript-eslint/no-unused-vars": 1,
};
module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
	},
	parserOptions: TS
		? {}
		: {
				parser: "@babel/eslint-parser",
				requireConfigFile: false,
		  },
	extends: [
		TS ? "@nuxtjs/eslint-config-typescript" : "@nuxtjs",
		"plugin:nuxt/recommended",
		"plugin:prettier/recommended",
	],
	plugins: [],
	globals: {
		dataLayer: "readonly",
		electron_api: "readonly",
	},
	// add your custom rules here
	rules: Object.assign(TS ? TS_RULES : {}, {
		"no-var": 0,
		camelcase: 0,
		eqeqeq: 0,
		"no-console": 0,
		"object-shorthand": 0,
		"rules/prefer-includes": 0,
		"no-empty": 0,
		"no-redeclare": 0,
		"prefer-spread": 0,
		"prefer-const": 0,
		"no-prototype-builtins": 0,
		"no-new-func": 0,
		"no-control-regex": 0,
		"no-useless-escape": 0,
		"prefer-promise-reject-errors": 0,
		"require-await": 0,
		"no-throw-literal": 0,
		"no-unused-vars": ["warn", {vars: "all", args: "none", ignoreRestSiblings: true}],
		"no-use-before-define": ["error", {functions: false, classes: false}],
		"no-else-return": ["error", {allowElseIf: false}],
		// unicorn
		"unicorn/prefer-includes": 0,
		"unicorn/throw-new-error": 0,
		// vue
		"vue/require-default-prop": 0,
		"vue/no-mutating-props": 0,
		// nuxt
		"nuxt/no-cjs-in-config": 0,
		"node/no-callback-literal": 0,
	}),
};
