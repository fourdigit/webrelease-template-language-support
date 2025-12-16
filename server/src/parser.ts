/**
 * WebRelease Template Language Parser
 */

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Diagnostic {
  range: Range;
  severity: number; // 1=Error, 2=Warning, 3=Information, 4=Hint
  message: string;
  code?: string;
}

// Functions that can only be called on single elements (not lists)
const SINGLE_ELEMENT_FUNCTIONS = new Set([
  'selectedValue',
  'selectedName',
  'selected'
]);

// Built-in functions
const BUILT_IN_FUNCTIONS = new Set([
  'pageTitle', 'currentTime', 'formatDate', 'isNull', 'isNotNull', 'isNumber',
  'number', 'string', 'divide', 'setScale', 'length', 'substring', 'indexOf',
  'contains', 'startsWith', 'endsWith', 'toUpperCase', 'toLowerCase', 'trim',
  'replace', 'split', 'join', 'round', 'floor', 'ceil', 'abs', 'min', 'max',
  'unsplit', 'generatePrice', 'generateBenefit', 'generateBakuage',
  'selectedValue', 'selectedName', 'selected'
]);

// Valid WebRelease tags
const VALID_TAGS = new Set([
  'wr-if', 'wr-then', 'wr-else', 'wr-switch', 'wr-case', 'wr-default',
  'wr-for', 'wr-break', 'wr-variable', 'wr-append', 'wr-clear',
  'wr-return', 'wr-error', 'wr-conditional', 'wr-cond', 'wr-comment'
]);

// Tag attributes
const TAG_ATTRIBUTES: Record<string, string[]> = {
  'wr-if': ['condition'],
  'wr-then': [],
  'wr-else': [],
  'wr-switch': ['value'],
  'wr-case': ['value'],
  'wr-default': [],
  'wr-for': ['list', 'string', 'times', 'variable', 'count', 'index'],
  'wr-break': ['condition'],
  'wr-variable': ['name', 'value'],
  'wr-append': ['name', 'value'],
  'wr-clear': ['name'],
  'wr-return': ['value'],
  'wr-error': ['condition', 'message'],
  'wr-conditional': ['condition'],
  'wr-cond': ['condition'],
  'wr-comment': [],
};

// Tags that don't require closing tags
const NO_CLOSE_TAGS = new Set([
  'wr-then', 'wr-else', 'wr-case', 'wr-default',
  'wr-variable', 'wr-append', 'wr-clear', 'wr-break',
  'wr-return', 'wr-error', 'wr-cond'
]);

/**
 * Expression Parser for WebRelease template expressions
 */
class ExpressionParser {
  private expression: string;
  private pos: number = 0;
  private listElements: Set<string>;
  private loopVariables: Set<string>;
  private errors: Array<{ position: number; message: string }> = [];

  constructor(
    expression: string,
    listElements: Set<string> = new Set(),
    loopVariables: Set<string> = new Set()
  ) {
    this.expression = expression.trim();
    this.listElements = listElements;
    this.loopVariables = loopVariables;
  }

  parse(): { isValid: boolean; errorMessage: string | null } {
    if (!this.expression) {
      return { isValid: true, errorMessage: null };
    }

    try {
      this.parseExpression();
      if (this.errors.length > 0) {
        return { isValid: false, errorMessage: this.errors[0].message };
      }
      return { isValid: true, errorMessage: null };
    } catch (e) {
      return { isValid: false, errorMessage: (e as Error).message };
    }
  }

  getErrors(): Array<{ position: number; message: string }> {
    return this.errors;
  }

  private parseExpression(): void {
    this.parseOrExpression();
  }

  private parseOrExpression(): void {
    this.parseAndExpression();
    while (this.matchOperator('||')) {
      this.parseAndExpression();
    }
  }

  private parseAndExpression(): void {
    this.parseComparisonExpression();
    while (this.matchOperator('&&')) {
      this.parseComparisonExpression();
    }
  }

  private parseComparisonExpression(): void {
    this.parseAdditiveExpression();
    while (this.matchAnyOperator(['==', '!=', '<=', '>=', '<', '>'])) {
      this.parseAdditiveExpression();
    }
  }

  private parseAdditiveExpression(): void {
    this.parseMultiplicativeExpression();
    while (this.matchAnyOperator(['+', '-'])) {
      this.parseMultiplicativeExpression();
    }
  }

  private parseMultiplicativeExpression(): void {
    this.parseUnaryExpression();
    while (this.matchAnyOperator(['*', '/', '%'])) {
      this.parseUnaryExpression();
    }
  }

  private parseUnaryExpression(): void {
    if (this.matchOperator('!')) {
      this.parseUnaryExpression();
    } else {
      this.parsePostfixExpression();
    }
  }

  private parsePostfixExpression(): void {
    const baseElement = this.parsePrimaryExpression();
    const elementChain: string[] = baseElement ? [baseElement] : [];

    while (true) {
      if (this.match('(')) {
        // Function call
        const funcName = elementChain.length > 0 ? elementChain[elementChain.length - 1] : null;
        this.parseFunctionArguments();
        this.expect(')');

        // Check if this is a single-element function called on a list
        if (funcName && SINGLE_ELEMENT_FUNCTIONS.has(funcName)) {
          if (elementChain.length > 1) {
            const elementPath = elementChain.slice(0, -1).join('.');
            this.checkListFunctionCall(elementPath, funcName);
          }
        }

        elementChain.length = 0; // Reset after function call
      } else if (this.match('[')) {
        // Array access
        this.parseExpression();
        this.expect(']');
        elementChain.length = 0; // Array access produces a single element
      } else if (this.match('.')) {
        // Member access
        const member = this.parseIdentifier();
        if (member) {
          elementChain.push(member);
        }
      } else {
        break;
      }
    }
  }

  private checkListFunctionCall(elementPath: string, funcName: string): void {
    // Check if the element path itself is a list element
    if (this.listElements.has(elementPath)) {
      this.errors.push({
        position: this.pos,
        message: `Cannot call '${funcName}()' on list element '${elementPath}'. Use a loop variable instead.`
      });
      return;
    }

    // Check if any prefix of the path is a list element
    const parts = elementPath.split('.');
    for (let i = 0; i < parts.length; i++) {
      const prefix = parts.slice(0, i + 1).join('.');
      if (this.listElements.has(prefix)) {
        this.errors.push({
          position: this.pos,
          message: `Cannot call '${funcName}()' on list element '${prefix}'. Use a loop variable to iterate over the list first.`
        });
        return;
      }
    }
  }

  private parsePrimaryExpression(): string | null {
    this.skipWhitespace();

    if (this.pos >= this.expression.length) {
      throw new Error('Unexpected end of expression');
    }

    // String literal
    if (this.expression[this.pos] === '"') {
      this.parseStringLiteral();
      return null;
    }
    // Number literal
    if (/\d/.test(this.expression[this.pos])) {
      this.parseNumberLiteral();
      return null;
    }
    // Parenthesized expression
    if (this.expression[this.pos] === '(') {
      this.match('(');
      this.parseExpression();
      this.expect(')');
      return null;
    }
    // Identifier
    return this.parseIdentifier();
  }

  private parseIdentifier(): string | null {
    this.skipWhitespace();

    if (this.pos >= this.expression.length) {
      return null;
    }

    if (!/[a-zA-Z_]/.test(this.expression[this.pos])) {
      return null;
    }

    const start = this.pos;
    while (this.pos < this.expression.length && /[a-zA-Z0-9_]/.test(this.expression[this.pos])) {
      this.pos++;
    }

    return this.expression.slice(start, this.pos);
  }

  private parseFunctionArguments(): void {
    this.skipWhitespace();

    if (this.pos < this.expression.length && this.expression[this.pos] !== ')') {
      this.parseExpression();

      while (this.match(',')) {
        this.parseExpression();
      }
    }
  }

  private parseStringLiteral(): void {
    this.expect('"');

    while (this.pos < this.expression.length && this.expression[this.pos] !== '"') {
      if (this.expression[this.pos] === '\\' && this.pos + 1 < this.expression.length) {
        this.pos += 2; // Skip escaped character
      } else {
        this.pos++;
      }
    }

    this.expect('"');
  }

  private parseNumberLiteral(): void {
    while (this.pos < this.expression.length && /[\d.]/.test(this.expression[this.pos])) {
      this.pos++;
    }
  }

  private match(ch: string): boolean {
    this.skipWhitespace();
    if (this.pos < this.expression.length && this.expression[this.pos] === ch) {
      this.pos++;
      return true;
    }
    return false;
  }

  private matchOperator(op: string): boolean {
    this.skipWhitespace();
    if (this.expression.slice(this.pos, this.pos + op.length) === op) {
      this.pos += op.length;
      return true;
    }
    return false;
  }

  private matchAnyOperator(ops: string[]): boolean {
    // Sort by length descending to match longest first
    const sortedOps = [...ops].sort((a, b) => b.length - a.length);
    for (const op of sortedOps) {
      if (this.matchOperator(op)) {
        return true;
      }
    }
    return false;
  }

  private expect(ch: string): void {
    this.skipWhitespace();
    if (this.pos >= this.expression.length || this.expression[this.pos] !== ch) {
      throw new Error(`Expected '${ch}' at position ${this.pos}`);
    }
    this.pos++;
  }

  private skipWhitespace(): void {
    while (this.pos < this.expression.length && /\s/.test(this.expression[this.pos])) {
      this.pos++;
    }
  }
}

/**
 * Main Template Parser
 */
export class TemplateParser {
  private content: string;
  private diagnostics: Diagnostic[] = [];
  private listElements: Set<string> = new Set();
  private loopVariables: Map<string, string> = new Map();

  constructor(content: string) {
    this.content = content;
  }

  parse(): Diagnostic[] {
    this.diagnostics = [];
    this.listElements = new Set();
    this.loopVariables = new Map();

    // First pass: collect list elements from wr-for tags
    this.collectListElements();

    // Validate expressions
    this.validateExpressions();

    // Validate tags
    this.validateTags();

    // Validate tag closures
    this.validateTagClosures();

    return this.diagnostics;
  }

  getListElements(): Set<string> {
    return this.listElements;
  }

  getLoopVariables(): Map<string, string> {
    return this.loopVariables;
  }

  private collectListElements(): void {
    const pattern = /<wr-for\s+([^>]*)>/g;
    let match;

    while ((match = pattern.exec(this.content)) !== null) {
      const attributesStr = match[1];

      // Extract list attribute
      const listMatch = /list=['"]([^'"]+)['"]/.exec(attributesStr);
      if (listMatch) {
        const listElement = listMatch[1];
        this.listElements.add(listElement);

        // Extract variable attribute
        const varMatch = /variable=['"]([^'"]+)['"]/.exec(attributesStr);
        if (varMatch) {
          this.loopVariables.set(varMatch[1], listElement);
        }
      }
    }
  }

  private validateExpressions(): void {
    const pattern = /%([^%]*)%/g;
    let match;

    while ((match = pattern.exec(this.content)) !== null) {
      const expression = match[1];
      const startPos = match.index;

      // Skip %% (escaped percent)
      if (expression === '') {
        continue;
      }

      // Parse expression with list element context
      const parser = new ExpressionParser(
        expression,
        this.listElements,
        new Set(this.loopVariables.keys())
      );
      const result = parser.parse();

      if (!result.isValid) {
        const { line, character } = this.getLineColumn(startPos);
        this.diagnostics.push({
          range: {
            start: { line, character },
            end: { line, character: character + expression.length + 2 }
          },
          severity: 1,
          message: `Expression error: ${result.errorMessage}`,
          code: 'expr-error'
        });
      }

      // Check for additional errors from the parser
      for (const error of parser.getErrors()) {
        const { line, character } = this.getLineColumn(startPos);
        this.diagnostics.push({
          range: {
            start: { line, character },
            end: { line, character: character + expression.length + 2 }
          },
          severity: 1,
          message: error.message,
          code: 'list-function-error'
        });
      }
    }
  }

  private validateTags(): void {
    const pattern = /<wr-(\w+)([^>]*)>/g;
    let match;

    while ((match = pattern.exec(this.content)) !== null) {
      const tagName = 'wr-' + match[1];
      const attributesStr = match[2];
      const startPos = match.index;

      if (!VALID_TAGS.has(tagName)) {
        const { line, character } = this.getLineColumn(startPos);
        this.diagnostics.push({
          range: {
            start: { line, character },
            end: { line, character: character + tagName.length + 2 }
          },
          severity: 1,
          message: `Unknown tag: ${tagName}`,
          code: 'unknown-tag'
        });
        continue;
      }

      // Validate attributes
      this.validateTagAttributes(tagName, attributesStr, startPos);
    }
  }

  private validateTagAttributes(tagName: string, attributesStr: string, startPos: number): void {
    // Match both single and double quoted attributes
    const attrPattern = /(\w+)='([^']*)'|(\w+)="([^"]*)"/g;
    let match;

    while ((match = attrPattern.exec(attributesStr)) !== null) {
      const attrName = match[1] || match[3];
      const attrValue = match[2] || match[4];

      // Check if attribute is valid for this tag
      const validAttrs = TAG_ATTRIBUTES[tagName] || [];
      if (!validAttrs.includes(attrName)) {
        const { line, character } = this.getLineColumn(startPos + match.index);
        this.diagnostics.push({
          range: {
            start: { line, character },
            end: { line, character: character + attrName.length }
          },
          severity: 2,
          message: `Unknown attribute '${attrName}' for tag '${tagName}'`,
          code: 'unknown-attribute'
        });
      }

      // Validate condition attribute
      if (attrName === 'condition' && attrValue) {
        const parser = new ExpressionParser(
          attrValue,
          this.listElements,
          new Set(this.loopVariables.keys())
        );
        const result = parser.parse();

        if (!result.isValid) {
          const { line, character } = this.getLineColumn(startPos);
          this.diagnostics.push({
            range: {
              start: { line, character },
              end: { line, character: character + attrValue.length }
            },
            severity: 1,
            message: `Condition syntax error: ${result.errorMessage}`,
            code: 'condition-syntax-error'
          });
        }

        // Check for list function errors
        for (const error of parser.getErrors()) {
          const { line, character } = this.getLineColumn(startPos);
          this.diagnostics.push({
            range: {
              start: { line, character },
              end: { line, character: character + attrValue.length }
            },
            severity: 1,
            message: error.message,
            code: 'list-function-error'
          });
        }
      }
    }
  }

  private validateTagClosures(): void {
    const openPattern = /<wr-(\w+)(?:\s|>)/g;
    const closePattern = /<\/wr-(\w+)>/g;

    // Collect all tag events with positions
    const events: Array<{ type: 'open' | 'close'; tagName: string; pos: number }> = [];

    let match;
    while ((match = openPattern.exec(this.content)) !== null) {
      events.push({ type: 'open', tagName: 'wr-' + match[1], pos: match.index });
    }

    while ((match = closePattern.exec(this.content)) !== null) {
      events.push({ type: 'close', tagName: 'wr-' + match[1], pos: match.index });
    }

    // Sort events by position
    events.sort((a, b) => a.pos - b.pos);

    // Stack-based validation
    const tagStack: Array<{ tagName: string; pos: number }> = [];

    for (const event of events) {
      if (event.type === 'open') {
        if (!NO_CLOSE_TAGS.has(event.tagName)) {
          tagStack.push({ tagName: event.tagName, pos: event.pos });
        }
      } else {
        if (NO_CLOSE_TAGS.has(event.tagName)) {
          continue;
        }

        // Find matching opening tag in stack
        let found = false;
        for (let i = tagStack.length - 1; i >= 0; i--) {
          if (tagStack[i].tagName === event.tagName) {
            tagStack.splice(i, 1);
            found = true;
            break;
          }
        }

        if (!found) {
          const { line, character } = this.getLineColumn(event.pos);
          this.diagnostics.push({
            range: {
              start: { line, character },
              end: { line, character: character + event.tagName.length + 3 }
            },
            severity: 1,
            message: `Closing tag '${event.tagName}' without matching opening tag`,
            code: 'unmatched-closing-tag'
          });
        }
      }
    }

    // Check for unclosed tags
    for (const { tagName, pos } of tagStack) {
      const { line, character } = this.getLineColumn(pos);
      this.diagnostics.push({
        range: {
          start: { line, character },
          end: { line, character: character + tagName.length + 2 }
        },
        severity: 1,
        message: `Unclosed tag '${tagName}'`,
        code: 'unclosed-tag'
      });
    }
  }

  private getLineColumn(pos: number): { line: number; character: number } {
    let line = 0;
    let character = 0;

    for (let i = 0; i < Math.min(pos, this.content.length); i++) {
      if (this.content[i] === '\n') {
        line++;
        character = 0;
      } else {
        character++;
      }
    }

    return { line, character };
  }
}

// Export completion items
export const TAG_COMPLETIONS = Array.from(VALID_TAGS).map(tag => ({
  label: tag,
  kind: 14, // Keyword
  detail: `WebRelease tag: ${tag}`,
  documentation: getTagDocumentation(tag)
}));

export const FUNCTION_COMPLETIONS = Array.from(BUILT_IN_FUNCTIONS).map(func => ({
  label: func,
  kind: 3, // Function
  detail: `WebRelease function: ${func}()`,
  insertText: `${func}()`
}));

function getTagDocumentation(tag: string): string {
  const docs: Record<string, string> = {
    'wr-if': 'Conditional rendering. Use with wr-then and wr-else.',
    'wr-then': 'Content to render when wr-if condition is true.',
    'wr-else': 'Content to render when wr-if condition is false.',
    'wr-for': 'Loop over a list, string, or number of times.',
    'wr-switch': 'Switch statement for multiple conditions.',
    'wr-case': 'Case within a wr-switch block.',
    'wr-default': 'Default case within a wr-switch block.',
    'wr-variable': 'Define a variable.',
    'wr-append': 'Append value to a variable.',
    'wr-clear': 'Clear a variable.',
    'wr-break': 'Break out of a loop.',
    'wr-return': 'Return a value.',
    'wr-error': 'Raise an error.',
    'wr-conditional': 'Conditional block.',
    'wr-cond': 'Condition within wr-conditional.',
    'wr-comment': 'Comment block (not rendered).'
  };
  return docs[tag] || '';
}
