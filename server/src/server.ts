import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  Hover,
  MarkupKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  TemplateParser,
  TAG_COMPLETIONS,
  FUNCTION_COMPLETIONS,
  Diagnostic as ParserDiagnostic
} from './parser';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Tag documentation for hover
const TAG_DOCUMENTATION: Record<string, string> = {
  'wr-if': '**wr-if** - Conditional rendering\n\nAttributes:\n- `condition`: Expression to evaluate\n\nUsage:\n```html\n<wr-if condition="expression">\n  <wr-then>Content if true</wr-then>\n  <wr-else>Content if false</wr-else>\n</wr-if>\n```',
  'wr-then': '**wr-then** - Content to render when wr-if condition is true',
  'wr-else': '**wr-else** - Content to render when wr-if condition is false',
  'wr-for': '**wr-for** - Loop construct\n\nAttributes:\n- `list`: List element to iterate\n- `string`: String to iterate (character by character)\n- `times`: Number of iterations\n- `variable`: Loop variable name\n- `count`: Total count variable\n- `index`: Index variable name\n\nUsage:\n```html\n<wr-for list="items" variable="item" index="i">\n  %item.name% (index: %i%)\n</wr-for>\n```',
  'wr-switch': '**wr-switch** - Switch statement\n\nAttributes:\n- `value`: Value to switch on\n\nUsage:\n```html\n<wr-switch value="expression">\n  <wr-case value="1">Case 1</wr-case>\n  <wr-case value="2">Case 2</wr-case>\n  <wr-default>Default case</wr-default>\n</wr-switch>\n```',
  'wr-case': '**wr-case** - Case within a wr-switch block\n\nAttributes:\n- `value`: Value to match',
  'wr-default': '**wr-default** - Default case within a wr-switch block',
  'wr-variable': '**wr-variable** - Define a variable\n\nAttributes:\n- `name`: Variable name\n- `value`: Variable value\n\nUsage:\n```html\n<wr-variable name="myVar" value="expression"></wr-variable>\n```',
  'wr-append': '**wr-append** - Append value to a variable\n\nAttributes:\n- `name`: Variable name\n- `value`: Value to append',
  'wr-clear': '**wr-clear** - Clear a variable\n\nAttributes:\n- `name`: Variable name to clear',
  'wr-break': '**wr-break** - Break out of a loop\n\nAttributes:\n- `condition`: Optional condition for breaking',
  'wr-return': '**wr-return** - Return a value\n\nAttributes:\n- `value`: Value to return',
  'wr-error': '**wr-error** - Raise an error\n\nAttributes:\n- `condition`: Condition for error\n- `message`: Error message',
  'wr-conditional': '**wr-conditional** - Conditional block\n\nAttributes:\n- `condition`: Expression to evaluate',
  'wr-cond': '**wr-cond** - Condition within wr-conditional\n\nAttributes:\n- `condition`: Expression to evaluate',
  'wr-comment': '**wr-comment** - Comment block (not rendered in output)'
};

// Function documentation for hover
const FUNCTION_DOCUMENTATION: Record<string, string> = {
  'selectedValue': '**selectedValue()** - Get the selected value from a select element\n\nReturns the value of the currently selected option.',
  'selectedName': '**selectedName()** - Get the selected name from a select element\n\nReturns the name/label of the currently selected option.',
  'selected': '**selected()** - Check if a checkbox or radio button is selected\n\nReturns true if the element is selected.',
  'isNull': '**isNull(value)** - Check if a value is null\n\nReturns true if the value is null or undefined.',
  'isNotNull': '**isNotNull(value)** - Check if a value is not null\n\nReturns true if the value is not null.',
  'length': '**length(value)** - Get the length of a string or array\n\nReturns the number of characters or elements.',
  'substring': '**substring(str, start, end)** - Extract a substring\n\nReturns a portion of the string.',
  'contains': '**contains(str, search)** - Check if string contains substring\n\nReturns true if the string contains the search value.',
  'replace': '**replace(str, search, replacement)** - Replace text in string\n\nReturns the string with replacements made.',
  'trim': '**trim(str)** - Remove whitespace from both ends\n\nReturns the trimmed string.',
  'toUpperCase': '**toUpperCase(str)** - Convert to uppercase\n\nReturns the string in uppercase.',
  'toLowerCase': '**toLowerCase(str)** - Convert to lowercase\n\nReturns the string in lowercase.'
};

connection.onInitialize((params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['<', '%', '.']
      },
      hoverProvider: true
    }
  };
});

// Validate document on open and change
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const parser = new TemplateParser(text);
  const parserDiagnostics = parser.parse();

  const diagnostics: Diagnostic[] = parserDiagnostics.map((d: ParserDiagnostic) => ({
    severity: d.severity === 1 ? DiagnosticSeverity.Error :
              d.severity === 2 ? DiagnosticSeverity.Warning :
              d.severity === 3 ? DiagnosticSeverity.Information :
              DiagnosticSeverity.Hint,
    range: {
      start: { line: d.range.start.line, character: d.range.start.character },
      end: { line: d.range.end.line, character: d.range.end.character }
    },
    message: d.message,
    source: 'webrelease',
    code: d.code
  }));

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Provide completion items
connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const text = document.getText();
  const offset = document.offsetAt(params.position);
  
  // Get text before cursor
  const textBefore = text.slice(0, offset);
  
  // Check if we're inside a tag
  if (textBefore.match(/<wr-\w*$/)) {
    // Tag name completion
    return TAG_COMPLETIONS.map(item => ({
      label: item.label,
      kind: CompletionItemKind.Keyword,
      detail: item.detail,
      documentation: item.documentation
    }));
  }
  
  // Check if we're inside an expression
  if (textBefore.match(/%[^%]*$/)) {
    // Function completion
    return FUNCTION_COMPLETIONS.map(item => ({
      label: item.label,
      kind: CompletionItemKind.Function,
      detail: item.detail,
      insertText: item.insertText
    }));
  }
  
  // Check if we're after a dot (member access)
  if (textBefore.match(/\.\w*$/)) {
    // Function completion for method calls
    return FUNCTION_COMPLETIONS.map(item => ({
      label: item.label,
      kind: CompletionItemKind.Method,
      detail: item.detail,
      insertText: item.insertText
    }));
  }

  return [];
});

// Provide hover information
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const text = document.getText();
  const offset = document.offsetAt(params.position);
  
  // Find the word at the current position
  const wordRange = getWordRangeAtPosition(text, offset);
  if (!wordRange) {
    return null;
  }
  
  const word = text.slice(wordRange.start, wordRange.end);
  
  // Check if it's a tag
  if (TAG_DOCUMENTATION[word]) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: TAG_DOCUMENTATION[word]
      }
    };
  }
  
  // Check if it's a function
  if (FUNCTION_DOCUMENTATION[word]) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: FUNCTION_DOCUMENTATION[word]
      }
    };
  }

  return null;
});

function getWordRangeAtPosition(text: string, offset: number): { start: number; end: number } | null {
  // Find word boundaries
  let start = offset;
  let end = offset;
  
  // Move start backwards
  while (start > 0 && /[\w-]/.test(text[start - 1])) {
    start--;
  }
  
  // Move end forwards
  while (end < text.length && /[\w-]/.test(text[end])) {
    end++;
  }
  
  if (start === end) {
    return null;
  }
  
  return { start, end };
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();
