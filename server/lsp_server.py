"""
WebRelease Template Language Server
"""

import logging
from typing import Optional, List, Dict, Any
from pygls.server import LanguageServer
from pygls.lsp.methods import (
    TEXT_DOCUMENT_DID_OPEN,
    TEXT_DOCUMENT_DID_CHANGE,
    TEXT_DOCUMENT_DID_CLOSE,
    TEXT_DOCUMENT_COMPLETION,
    TEXT_DOCUMENT_HOVER,
)
from lsprotocol.types import (
    DidOpenTextDocumentParams,
    DidChangeTextDocumentParams,
    DidCloseTextDocumentParams,
    CompletionParams,
    CompletionItem,
    CompletionItemKind,
    HoverParams,
    Hover,
    MarkupContent,
    MarkupKind,
    Diagnostic,
    DiagnosticSeverity,
    Position,
    Range,
)

from parser import TemplateParser, ExpressionParser

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create language server
server = LanguageServer("webrelease-lsp", "v0.1.0")

# Store document contents
documents: Dict[str, str] = {}


@server.feature(TEXT_DOCUMENT_DID_OPEN)
def did_open(params: DidOpenTextDocumentParams):
    """Handle document open"""
    uri = params.text_document.uri
    content = params.text_document.text
    
    documents[uri] = content
    logger.debug(f"Document opened: {uri}")
    
    # Validate and publish diagnostics
    _validate_document(uri, content)


@server.feature(TEXT_DOCUMENT_DID_CHANGE)
def did_change(params: DidChangeTextDocumentParams):
    """Handle document change"""
    uri = params.text_document.uri
    
    # Update document content
    for change in params.content_changes:
        if hasattr(change, 'range') and change.range:
            # Incremental change
            # For simplicity, we'll just replace the whole document
            documents[uri] = change.text
        else:
            # Full document change
            documents[uri] = change.text
    
    logger.debug(f"Document changed: {uri}")
    
    # Validate and publish diagnostics
    _validate_document(uri, documents.get(uri, ""))


@server.feature(TEXT_DOCUMENT_DID_CLOSE)
def did_close(params: DidCloseTextDocumentParams):
    """Handle document close"""
    uri = params.text_document.uri
    
    if uri in documents:
        del documents[uri]
    
    logger.debug(f"Document closed: {uri}")


@server.feature(TEXT_DOCUMENT_COMPLETION)
def completion(params: CompletionParams) -> List[CompletionItem]:
    """Handle completion requests"""
    uri = params.text_document.uri
    line = params.position.line
    character = params.position.character
    
    content = documents.get(uri, "")
    lines = content.split('\n')
    
    if line >= len(lines):
        return []
    
    current_line = lines[line]
    
    # Determine context
    completions = []
    
    # Check if we're in a tag
    if '<wr-' in current_line[:character]:
        # Tag name completion
        completions.extend(_get_tag_completions(current_line, character))
    
    # Check if we're in an attribute
    if '=' in current_line[:character] and '"' in current_line[:character]:
        # Attribute value completion
        completions.extend(_get_attribute_value_completions(current_line, character))
    
    # Check if we're in an expression
    if '%' in current_line[:character]:
        # Expression completion
        completions.extend(_get_expression_completions(current_line, character))
    
    return completions


@server.feature(TEXT_DOCUMENT_HOVER)
def hover(params: HoverParams) -> Optional[Hover]:
    """Handle hover requests"""
    uri = params.text_document.uri
    line = params.position.line
    character = params.position.character
    
    content = documents.get(uri, "")
    lines = content.split('\n')
    
    if line >= len(lines):
        return None
    
    current_line = lines[line]
    
    # Find the word at cursor
    start = character
    while start > 0 and (current_line[start-1].isalnum() or current_line[start-1] in '_-'):
        start -= 1
    
    end = character
    while end < len(current_line) and (current_line[end].isalnum() or current_line[end] in '_-'):
        end += 1
    
    word = current_line[start:end]
    
    # Get hover information
    hover_info = _get_hover_info(word, current_line, character)
    
    if hover_info:
        return Hover(
            contents=MarkupContent(
                kind=MarkupKind.Markdown,
                value=hover_info
            )
        )
    
    return None


def _validate_document(uri: str, content: str):
    """Validate document and publish diagnostics"""
    parser = TemplateParser(content)
    parse_diagnostics = parser.parse()
    
    # Convert to LSP diagnostics
    lsp_diagnostics = []
    for diag in parse_diagnostics:
        severity = DiagnosticSeverity.Error if diag.severity == 1 else DiagnosticSeverity.Warning
        
        lsp_diag = Diagnostic(
            range=Range(
                start=Position(line=diag.range.start.line, character=diag.range.start.character),
                end=Position(line=diag.range.end.line, character=diag.range.end.character),
            ),
            severity=severity,
            message=diag.message,
            code=diag.code,
        )
        lsp_diagnostics.append(lsp_diag)
    
    # Publish diagnostics
    server.publish_diagnostics(uri, lsp_diagnostics)


def _get_tag_completions(line: str, character: int) -> List[CompletionItem]:
    """Get tag name completions"""
    completions = []
    
    tags = [
        ('wr-if', 'Conditional tag (if-then-else)'),
        ('wr-then', 'Then branch of wr-if'),
        ('wr-else', 'Else branch of wr-if'),
        ('wr-switch', 'Switch statement'),
        ('wr-case', 'Case in switch'),
        ('wr-default', 'Default case in switch'),
        ('wr-for', 'Loop tag'),
        ('wr-break', 'Break from loop'),
        ('wr-variable', 'Define variable'),
        ('wr-append', 'Append to variable'),
        ('wr-clear', 'Clear variable'),
        ('wr-return', 'Return from method'),
        ('wr-error', 'Error handling'),
        ('wr-conditional', 'Conditional tag'),
        ('wr-cond', 'Condition tag'),
        ('wr-comment', 'Comment tag'),
    ]
    
    for tag, doc in tags:
        completions.append(CompletionItem(
            label=tag,
            kind=CompletionItemKind.Keyword,
            documentation=doc,
            insert_text=tag,
        ))
    
    return completions


def _get_attribute_value_completions(line: str, character: int) -> List[CompletionItem]:
    """Get attribute value completions"""
    completions = []
    
    # Get the attribute name
    attr_start = line.rfind('=', 0, character)
    if attr_start == -1:
        return []
    
    attr_name_end = attr_start
    while attr_name_end > 0 and line[attr_name_end-1].isspace():
        attr_name_end -= 1
    
    attr_name_start = attr_name_end
    while attr_name_start > 0 and (line[attr_name_start-1].isalnum() or line[attr_name_start-1] == '-'):
        attr_name_start -= 1
    
    attr_name = line[attr_name_start:attr_name_end]
    
    # Provide completions based on attribute
    if attr_name == 'condition':
        # Suggest common condition patterns
        completions.extend([
            CompletionItem(label='isNotNull()', kind=CompletionItemKind.Function),
            CompletionItem(label='isNull()', kind=CompletionItemKind.Function),
            CompletionItem(label='isNumber()', kind=CompletionItemKind.Function),
        ])
    elif attr_name in ['list', 'string', 'times']:
        # Suggest element references
        completions.append(CompletionItem(
            label='element_name',
            kind=CompletionItemKind.Variable,
            documentation='Reference to template element',
        ))
    
    return completions


def _get_expression_completions(line: str, character: int) -> List[CompletionItem]:
    """Get expression completions"""
    completions = []
    
    # Built-in functions
    functions = [
        ('pageTitle', 'Get page title'),
        ('currentTime', 'Get current time'),
        ('formatDate', 'Format date'),
        ('isNull', 'Check if null'),
        ('isNotNull', 'Check if not null'),
        ('isNumber', 'Check if number'),
        ('number', 'Convert to number'),
        ('string', 'Convert to string'),
        ('length', 'Get length'),
        ('substring', 'Get substring'),
        ('indexOf', 'Find index'),
        ('contains', 'Check contains'),
        ('startsWith', 'Check starts with'),
        ('endsWith', 'Check ends with'),
        ('toUpperCase', 'Convert to uppercase'),
        ('toLowerCase', 'Convert to lowercase'),
        ('trim', 'Trim whitespace'),
        ('replace', 'Replace text'),
        ('split', 'Split string'),
        ('join', 'Join array'),
        ('round', 'Round number'),
        ('floor', 'Floor number'),
        ('ceil', 'Ceiling number'),
        ('abs', 'Absolute value'),
        ('min', 'Minimum value'),
        ('max', 'Maximum value'),
        ('divide', 'Divide numbers'),
        ('setScale', 'Set decimal places'),
    ]
    
    for func_name, doc in functions:
        completions.append(CompletionItem(
            label=func_name + '()',
            kind=CompletionItemKind.Function,
            documentation=doc,
            insert_text=func_name + '()',
        ))
    
    return completions


def _get_hover_info(word: str, line: str, character: int) -> Optional[str]:
    """Get hover information for a word"""
    
    # Built-in functions documentation
    functions_doc = {
        'pageTitle': 'Get the page title',
        'currentTime': 'Get current time as a timestamp',
        'formatDate': 'Format a date: formatDate(time, format)',
        'isNull': 'Check if value is null',
        'isNotNull': 'Check if value is not null',
        'isNumber': 'Check if value is a number',
        'number': 'Convert value to number',
        'string': 'Convert value to string',
        'length': 'Get length of string or array',
        'substring': 'Get substring: substring(str, start, end)',
        'indexOf': 'Find index of substring',
        'contains': 'Check if contains substring',
        'startsWith': 'Check if starts with string',
        'endsWith': 'Check if ends with string',
        'toUpperCase': 'Convert to uppercase',
        'toLowerCase': 'Convert to lowercase',
        'trim': 'Trim whitespace',
        'replace': 'Replace text: replace(str, from, to)',
        'split': 'Split string: split(str, delimiter)',
        'join': 'Join array: join(array, delimiter)',
        'round': 'Round number',
        'floor': 'Floor number',
        'ceil': 'Ceiling number',
        'abs': 'Absolute value',
        'min': 'Minimum value: min(a, b)',
        'max': 'Maximum value: max(a, b)',
        'divide': 'Divide numbers: divide(a, b, scale, mode)',
        'setScale': 'Set decimal places: setScale(num, scale)',
    }
    
    # Tags documentation
    tags_doc = {
        'wr-if': 'Conditional tag: `<wr-if condition="expr">...</wr-if>`',
        'wr-then': 'Then branch of wr-if',
        'wr-else': 'Else branch of wr-if',
        'wr-for': 'Loop tag: `<wr-for list="items" variable="item">...</wr-for>`',
        'wr-switch': 'Switch statement: `<wr-switch value="expr">...</wr-switch>`',
        'wr-case': 'Case in switch: `<wr-case value="val">...</wr-case>`',
        'wr-variable': 'Define variable: `<wr-variable name="var" value="expr"/>`',
        'wr-break': 'Break from loop',
        'wr-error': 'Error handling: `<wr-error condition="expr" message="msg"/>`',
    }
    
    if word in functions_doc:
        return functions_doc[word]
    elif word in tags_doc:
        return tags_doc[word]
    
    return None


if __name__ == '__main__':
    import sys
    
    # Start server
    logger.info("Starting WebRelease Template Language Server")
    server.start_tcp("localhost", 8080)
