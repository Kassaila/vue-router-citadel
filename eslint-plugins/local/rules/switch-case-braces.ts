import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'requireBraces';

/**
 * ESLint rule: switch-case-braces
 *
 * Requires each case/default clause in switch statements to have a block statement (braces).
 * This improves readability and prevents scope-related issues with let/const.
 *
 * Examples:
 *   // Bad
 *   switch (x) {
 *     case 1:
 *       doSomething();
 *       break;
 *     default:
 *       doDefault();
 *   }
 *
 *   // Good
 *   switch (x) {
 *     case 1: {
 *       doSomething();
 *       break;
 *     }
 *     default: {
 *       doDefault();
 *     }
 *   }
 */
const rule: TSESLint.RuleModule<MessageIds> = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Require braces around each case/default clause in switch statements',
    },
    fixable: 'code',
    schema: [],
    messages: {
      requireBraces: 'Expected braces around {{type}} clause.',
    },
  },

  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Check if a SwitchCase has a block statement as its only consequent
     */
    const hasBlockStatement = (node: TSESTree.SwitchCase): boolean => {
      /**
       * Empty case (fallthrough to next) is OK
       */
      if (node.consequent.length === 0) {
        return true;
      }

      /**
       * Should have exactly one BlockStatement
       */
      if (node.consequent.length === 1 && node.consequent[0].type === 'BlockStatement') {
        return true;
      }

      return false;
    };

    /**
     * Get indentation of the case statement
     */
    const getIndent = (node: TSESTree.SwitchCase): string => {
      const line = sourceCode.lines[node.loc.start.line - 1];
      const match = line.match(/^(\s*)/);

      return match ? match[1] : '';
    };

    /**
     * Re-indent statements to be inside the block
     */
    const reindentStatements = (text: string, node: TSESTree.SwitchCase): string => {
      const baseIndent = getIndent(node);
      const lines = text.split('\n');

      /**
       * Add extra indentation to each line
       */
      return lines.map((line) => (line.trim() ? `${baseIndent}  ${line.trim()}` : '')).join('\n');
    };

    /**
     * Fix by wrapping consequent statements in braces
     */
    const fix = (fixer: TSESLint.RuleFixer, node: TSESTree.SwitchCase): TSESLint.RuleFix | null => {
      if (node.consequent.length === 0) {
        return null;
      }

      const firstStatement = node.consequent[0];
      const lastStatement = node.consequent[node.consequent.length - 1];

      /**
       * Get the range from first to last statement
       */
      const statementsText = sourceCode
        .getText()
        .slice(firstStatement.range[0], lastStatement.range[1]);

      /**
       * Find the colon after case/default
       */
      const caseText = sourceCode.getText(node);
      const colonIndex = node.test
        ? caseText.indexOf(':', sourceCode.getText(node.test).length)
        : caseText.indexOf(':');

      /**
       * Calculate position after the colon in the original source
       */
      const colonPosition = node.range[0] + colonIndex + 1;

      /**
       * Create the fix: replace from after colon to end of last statement
       */
      return fixer.replaceTextRange(
        [colonPosition, lastStatement.range[1]],
        ` {\n${reindentStatements(statementsText, node)}\n${getIndent(node)}}`,
      );
    };

    return {
      SwitchCase(node): void {
        if (!hasBlockStatement(node)) {
          const clauseType = node.test ? 'case' : 'default';

          context.report({
            node,
            messageId: 'requireBraces',
            data: { type: clauseType },
            fix: (fixer) => fix(fixer, node),
          });
        }
      },
    };
  },
};

export default rule;
