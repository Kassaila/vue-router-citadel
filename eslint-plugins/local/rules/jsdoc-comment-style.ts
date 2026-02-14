import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

type MessageIds = 'preferJsdoc' | 'noInlineComment' | 'singleLineJsdoc' | 'todoFormat';

/**
 * ESLint rule: jsdoc-comment-style
 *
 * Requires comments to use JSDoc-style block comments above the code they describe.
 * Consecutive line comments are merged into a single JSDoc block.
 * Inline comments (on the same line as code) are forbidden.
 *
 * Examples:
 *   // Bad - line comment
 *   // This is a comment
 *
 *   // Bad - inline comment
 *   const x = 1; // not allowed
 *
 *   // Bad - consecutive line comments become separate blocks
 *   // Line 1
 *   // Line 2
 *
 *   // Good - JSDoc style
 *   /**
 *    * This is a comment
 *    *\/
 *
 *   // Good - multiline JSDoc
 *   /**
 *    * Line 1
 *    * Line 2
 *    *\/
 *
 *   // Bad - single-line JSDoc
 *   /** oldest first *\/
 *
 *   // Good - multiline JSDoc
 *   /**
 *    * oldest first
 *    *\/
 *
 *   // Good - multiline JSDoc with details
 *   /**
 *    * Setup polling for new messages
 *    * More details here
 *    *\/
 *
 *   // Bad - TODO without colon
 *   /** TODO Implement feature *\/
 *
 *   // Bad - TODO with dash
 *   /** TODO - Implement feature *\/
 *
 *   // Bad - lowercase todo
 *   /** todo: Implement feature *\/
 *
 *   // Good - TODO with colon (uppercase)
 *   /**
 *    * TODO: Implement feature
 *    *\/
 */
const rule: TSESLint.RuleModule<MessageIds> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSDoc-style block comments instead of line comments',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferJsdoc: 'Use JSDoc-style comment /** ... */ instead of line comment.',
      noInlineComment: 'Inline comments are not allowed. Move comment above the code.',
      singleLineJsdoc: 'JSDoc comments must use multiline format.',
      todoFormat: 'TODO comments must use format "TODO: description" (uppercase with colon).',
    },
  },

  defaultOptions: [],

  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Check if comment should be ignored
     */
    const shouldIgnore = (comment: TSESTree.Comment): boolean => {
      const text = comment.value.trim();

      /**
       * Ignore TypeScript triple-slash directives
       */
      if (comment.value.startsWith('/')) {
        return true;
      }

      /**
       * Ignore eslint directives
       */
      if (
        text.startsWith('eslint-disable') ||
        text.startsWith('eslint-enable') ||
        text.startsWith('eslint-ignore')
      ) {
        return true;
      }

      /**
       * Ignore TypeScript directives
       */
      if (
        text.startsWith('@ts-') ||
        text.startsWith('ts-ignore') ||
        text.startsWith('ts-expect-error') ||
        text.startsWith('ts-nocheck')
      ) {
        return true;
      }

      /**
       * Ignore separator comments (only special chars like ═══, ---, etc.)
       */
      if (/^[═=\-─_*#~]+$/.test(text)) {
        return true;
      }

      return false;
    };

    /**
     * Check if comment is inline (on same line as code)
     */
    const isInlineComment = (comment: TSESTree.Comment): boolean => {
      const line = sourceCode.lines[comment.loc.start.line - 1];
      const beforeComment = line.slice(0, comment.loc.start.column);

      /**
       * If there's code before the comment on the same line, it's inline
       */
      return beforeComment.trim().length > 0;
    };

    /**
     * Get indentation of the comment
     */
    const getIndent = (comment: TSESTree.Comment): string => {
      const line = sourceCode.lines[comment.loc.start.line - 1];
      const match = line.match(/^(\s*)/);

      return match ? match[1] : '';
    };

    /**
     * Check if two comments are consecutive (on adjacent lines)
     */
    const areConsecutive = (prev: TSESTree.Comment, next: TSESTree.Comment): boolean => {
      return prev.loc.end.line + 1 === next.loc.start.line;
    };

    /**
     * Group consecutive line comments together
     */
    const groupConsecutiveComments = (comments: TSESTree.Comment[]): TSESTree.Comment[][] => {
      const lineComments = comments.filter(
        (c) => c.type === 'Line' && !shouldIgnore(c) && !isInlineComment(c),
      );

      if (lineComments.length === 0) {
        return [];
      }

      const groups: TSESTree.Comment[][] = [];
      let currentGroup: TSESTree.Comment[] = [lineComments[0]];

      for (let i = 1; i < lineComments.length; i++) {
        const prev = lineComments[i - 1];
        const curr = lineComments[i];

        if (areConsecutive(prev, curr)) {
          currentGroup.push(curr);
        } else {
          groups.push(currentGroup);
          currentGroup = [curr];
        }
      }

      groups.push(currentGroup);

      return groups;
    };

    return {
      Program(): void {
        const comments = sourceCode.getAllComments();

        /**
         * Report and fix inline comments
         */
        for (const comment of comments) {
          if (comment.type !== 'Line') {
            continue;
          }

          if (shouldIgnore(comment)) {
            continue;
          }

          if (isInlineComment(comment)) {
            context.report({
              loc: comment.loc,
              messageId: 'noInlineComment',
              fix: (fixer) => {
                const line = sourceCode.lines[comment.loc.start.line - 1];
                const indent = line.match(/^(\s*)/)?.[1] ?? '';
                const commentText = comment.value.trim();

                /**
                 * Find where to cut: remove trailing whitespace before comment too
                 */
                const beforeComment = line.slice(0, comment.loc.start.column);
                const trimmedBefore = beforeComment.trimEnd();

                /**
                 * Build the JSDoc comment to insert above (always multiline)
                 */
                const jsdocComment = `${indent}/**\n${indent} * ${commentText}\n${indent} */\n`;

                /**
                 * Calculate the range: from end of code to end of comment
                 */
                const lineStart =
                  sourceCode.getIndexFromLoc({ line: comment.loc.start.line, column: 0 }) ?? 0;
                const codeEndIndex = lineStart + trimmedBefore.length;
                const commentEndIndex = comment.range[1];

                return [
                  fixer.insertTextBeforeRange([lineStart, lineStart], jsdocComment),
                  fixer.removeRange([codeEndIndex, commentEndIndex]),
                ];
              },
            });
          }
        }

        /**
         * Check for single-line JSDoc comments - they must be multiline
         */
        for (const comment of comments) {
          if (comment.type !== 'Block') {
            continue;
          }

          /**
           * Check if it's a JSDoc comment (starts with *)
           */
          const value = comment.value;
          if (!value.startsWith('*')) {
            continue;
          }

          /**
           * Check if it's single-line (no newlines in the comment)
           */
          if (value.includes('\n')) {
            continue;
          }

          /**
           * Get the comment content (remove leading *)
           */
          const content = value.slice(1).trim();

          /**
           * Skip empty JSDoc comments
           */
          if (!content) {
            continue;
          }

          /**
           * It's a single-line JSDoc - report and fix
           */
          const indent = getIndent(comment);
          const replacement = `/**\n${indent} * ${content}\n${indent} */`;

          context.report({
            loc: comment.loc,
            messageId: 'singleLineJsdoc',
            fix: (fixer) => {
              return fixer.replaceTextRange(comment.range, replacement);
            },
          });
        }

        /**
         * Check for TODO format - must be "TODO:" (uppercase with colon)
         */
        for (const comment of comments) {
          if (comment.type !== 'Block') {
            continue;
          }

          /**
           * Check if it's a JSDoc comment (starts with *)
           */
          const value = comment.value;
          if (!value.startsWith('*')) {
            continue;
          }

          /**
           * Check if comment contains TODO (case-insensitive)
           */
          if (!/\btodo\b/i.test(value)) {
            continue;
          }

          /**
           * Check each line for TODO format
           */
          const lines = value.split('\n');
          let hasInvalidTodo = false;

          for (const line of lines) {
            /**
             * Remove leading * and whitespace
             */
            const content = line.replace(/^\s*\*?\s*/, '');

            /**
             * Check if line contains TODO (case-insensitive)
             */
            if (!/\btodo\b/i.test(content)) {
              continue;
            }

            /**
             * Valid format: starts with "TODO: " (uppercase, colon, space)
             */
            if (/^TODO: \S/.test(content)) {
              continue;
            }

            /**
             * Invalid format found
             */
            hasInvalidTodo = true;
            break;
          }

          if (!hasInvalidTodo) {
            continue;
          }

          /**
           * Fix the TODO format
           */
          const fixedLines = lines.map((line) => {
            /**
             * Remove leading * and get content
             */
            const lineContent = line.replace(/^\s*\*?\s*/, '');

            /**
             * Check if line contains TODO
             */
            if (!/\btodo\b/i.test(lineContent)) {
              return line;
            }

            /**
             * Fix TODO format: replace "todo", "TODO", "TODO -", "todo:", etc. with "TODO: "
             * Pattern matches: todo/TODO followed by optional separator (space, dash, colon, or combo)
             */
            const fixedContent = lineContent.replace(/\btodo\s*[-:]?\s*/i, 'TODO: ');

            /**
             * Reconstruct the line with proper JSDoc formatting
             */
            const leadingMatch = line.match(/^(\s*\*?\s*)/);
            const leading = leadingMatch ? leadingMatch[1] : ' * ';

            return `${leading}${fixedContent}`;
          });

          const fixedValue = fixedLines.join('\n');
          const replacement = `/*${fixedValue}*/`;

          context.report({
            loc: comment.loc,
            messageId: 'todoFormat',
            fix: (fixer) => {
              return fixer.replaceTextRange(comment.range, replacement);
            },
          });
        }

        /**
         * Group and fix consecutive line comments
         */
        const groups = groupConsecutiveComments(comments);

        for (const group of groups) {
          const firstComment = group[0];
          const lastComment = group[group.length - 1];
          const indent = getIndent(firstComment);

          /**
           * Build the JSDoc comment from all lines in the group
           */
          const lines = group.map((c) => c.value.trim());
          const jsdocLines = lines.map((line) => `${indent} * ${line}`).join('\n');
          const replacement = `/**\n${jsdocLines}\n${indent} */`;

          context.report({
            loc: {
              start: firstComment.loc.start,
              end: lastComment.loc.end,
            },
            messageId: 'preferJsdoc',
            fix: (fixer) => {
              return fixer.replaceTextRange(
                [firstComment.range[0], lastComment.range[1]],
                replacement,
              );
            },
          });
        }
      },
    };
  },
};

export default rule;
