import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'preferArrow' | 'preferArrowDeclaration';
type FunctionNode = TSESTree.FunctionExpression | TSESTree.FunctionDeclaration;

/**
 * ESLint rule: prefer-arrow-without-this
 *
 * Enforces arrow functions when `this` is not used.
 * Regular functions should only be used when `this` binding is needed.
 *
 * Examples:
 *   // Bad - function expression doesn't use `this`
 *   const add = function(a, b) { return a + b; };
 *
 *   // Bad - function declaration doesn't use `this`
 *   function add(a, b) { return a + b; }
 *
 *   // Good - arrow function
 *   const add = (a, b) => a + b;
 *
 *   // Good - function uses `this`
 *   const obj = {
 *     value: 1,
 *     getValue: function() { return this.value; }
 *   };
 */
const rule: TSESLint.RuleModule<MessageIds> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer arrow functions when `this` is not used',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferArrow:
        'Prefer arrow function. Use regular function only when `this` binding is needed.',
      preferArrowDeclaration:
        'Prefer arrow function. Convert `function {{ name }}()` to `const {{ name }} = () =>`.',
    },
  },

  defaultOptions: [],

  create(context) {
    /**
     * Track which functions contain `this`
     */
    const functionsWithThis = new WeakSet<TSESTree.Node>();
    /**
     * Stack to track current function scope
     */
    const functionStack: FunctionNode[] = [];

    /**
     * Check if function is a method (object property or class method)
     */
    const isMethod = (node: TSESTree.FunctionExpression): boolean => {
      const parent = node.parent;

      /**
       * Object method shorthand: { method() {} }
       */
      if (parent?.type === 'Property' && parent.method) {
        return true;
      }

      /**
       * Class method
       */
      if (parent?.type === 'MethodDefinition') {
        return true;
      }

      return false;
    };

    /**
     * Check if function is used as constructor
     */
    const isConstructorLike = (node: FunctionNode): boolean => {
      const parent = node.parent;

      /**
       * new function() {}
       */
      if (parent?.type === 'NewExpression') {
        return true;
      }

      /**
       * Function declaration or variable with PascalCase name
       */
      if (node.type === 'FunctionDeclaration' && node.id) {
        const name = node.id.name;

        if (name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()) {
          return true;
        }
      }

      if (
        node.type === 'FunctionExpression' &&
        parent?.type === 'VariableDeclarator' &&
        parent.id.type === 'Identifier'
      ) {
        const name = parent.id.name;

        if (name[0] === name[0].toUpperCase() && name[0] !== name[0].toLowerCase()) {
          return true;
        }
      }

      return false;
    };

    /**
     * Check if function declaration should be skipped
     */
    const shouldSkipDeclaration = (node: TSESTree.FunctionDeclaration): boolean => {
      const parent = node.parent;

      /**
       * Skip export default function
       */
      if (parent?.type === 'ExportDefaultDeclaration') {
        return true;
      }

      /**
       * Skip if no name (anonymous, though rare for declarations)
       */
      if (!node.id) {
        return true;
      }

      return false;
    };

    /**
     * Convert function expression to arrow function
     */
    const fixExpression = (
      fixer: TSESLint.RuleFixer,
      node: TSESTree.FunctionExpression,
    ): TSESLint.RuleFix | null => {
      const sourceCode = context.sourceCode;
      const bodyText = sourceCode.getText(node.body);
      const paramsText = node.params.map((p) => sourceCode.getText(p)).join(', ');
      const asyncPrefix = node.async ? 'async ' : '';

      if (node.generator) {
        return null;
      }

      /**
       * Simple return statement - can use concise body
       */
      if (
        node.body.type === 'BlockStatement' &&
        node.body.body.length === 1 &&
        node.body.body[0].type === 'ReturnStatement' &&
        node.body.body[0].argument
      ) {
        const returnValue = sourceCode.getText(node.body.body[0].argument);
        const wrappedValue = returnValue.trimStart().startsWith('{')
          ? `(${returnValue})`
          : returnValue;

        return fixer.replaceText(node, `${asyncPrefix}(${paramsText}) => ${wrappedValue}`);
      }

      return fixer.replaceText(node, `${asyncPrefix}(${paramsText}) => ${bodyText}`);
    };

    /**
     * Convert function declaration to arrow function variable
     */
    const fixDeclaration = (
      fixer: TSESLint.RuleFixer,
      node: TSESTree.FunctionDeclaration,
    ): TSESLint.RuleFix | null => {
      if (!node.id || node.generator) {
        return null;
      }

      const sourceCode = context.sourceCode;
      const name = node.id.name;
      const bodyText = sourceCode.getText(node.body);
      const paramsText = node.params.map((p) => sourceCode.getText(p)).join(', ');
      const asyncPrefix = node.async ? 'async ' : '';

      /**
       * Get return type if present
       */
      const returnType = node.returnType ? sourceCode.getText(node.returnType) : '';

      /**
       * Simple return statement - can use concise body
       */
      if (
        node.body.type === 'BlockStatement' &&
        node.body.body.length === 1 &&
        node.body.body[0].type === 'ReturnStatement' &&
        node.body.body[0].argument
      ) {
        const returnValue = sourceCode.getText(node.body.body[0].argument);
        const wrappedValue = returnValue.trimStart().startsWith('{')
          ? `(${returnValue})`
          : returnValue;

        return fixer.replaceText(
          node,
          `const ${name} = ${asyncPrefix}(${paramsText})${returnType} => ${wrappedValue};`,
        );
      }

      return fixer.replaceText(
        node,
        `const ${name} = ${asyncPrefix}(${paramsText})${returnType} => ${bodyText};`,
      );
    };

    return {
      /**
       * Track entering functions
       */
      'FunctionExpression'(node: TSESTree.FunctionExpression): void {
        functionStack.push(node);
      },

      'FunctionDeclaration'(node: TSESTree.FunctionDeclaration): void {
        functionStack.push(node);
      },

      /**
       * When we see `this`, mark the current function
       */
      'ThisExpression'(): void {
        for (let i = functionStack.length - 1; i >= 0; i--) {
          const fn = functionStack[i];

          functionsWithThis.add(fn);

          break;
        }
      },

      /**
       * Check FunctionExpression on exit
       */
      'FunctionExpression:exit'(node: TSESTree.FunctionExpression): void {
        functionStack.pop();

        if (isMethod(node)) {
          return;
        }

        if (isConstructorLike(node)) {
          return;
        }

        if (node.generator) {
          return;
        }

        if (!functionsWithThis.has(node)) {
          context.report({
            node,
            messageId: 'preferArrow',
            fix: (fixer) => fixExpression(fixer, node),
          });
        }
      },

      /**
       * Check FunctionDeclaration on exit
       */
      'FunctionDeclaration:exit'(node: TSESTree.FunctionDeclaration): void {
        functionStack.pop();

        if (shouldSkipDeclaration(node)) {
          return;
        }

        if (isConstructorLike(node)) {
          return;
        }

        if (node.generator) {
          return;
        }

        if (!functionsWithThis.has(node)) {
          context.report({
            node,
            messageId: 'preferArrowDeclaration',
            data: { name: node.id?.name ?? 'anonymous' },
            fix: (fixer) => fixDeclaration(fixer, node),
          });
        }
      },
    };
  },
};

export default rule;
