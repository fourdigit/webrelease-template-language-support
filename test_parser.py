"""
Test WebRelease Template Parser
"""

import sys
sys.path.insert(0, '/home/ubuntu/webrelease-lsp/server')

from parser import TemplateParser, ExpressionParser, Tokenizer

def test_tokenizer():
    """Test tokenizer"""
    print("=== Testing Tokenizer ===")
    
    content = """<html>
<body>
<h1>%pageTitle()%</h1>
<p>%text%</p>
<wr-if condition="isNotNull(email)">
  <a href="mailto:%email%">%email%</a>
</wr-if>
</body>
</html>"""
    
    tokenizer = Tokenizer(content)
    tokens = tokenizer.tokenize()
    
    print(f"Total tokens: {len(tokens)}")
    for i, token in enumerate(tokens[:20]):  # Print first 20 tokens
        print(f"  {i}: {token.type.value:20} = {repr(token.value)}")
    print()


def test_expression_parser():
    """Test expression parser"""
    print("=== Testing Expression Parser ===")
    
    test_expressions = [
        "pageTitle()",
        "text",
        "1 + 1",
        "isNotNull(email)",
        "price * 1.1 > 1000",
        "都道府県 == \"東京都\"",
        "address[0].郵便番号",
        "invalid syntax !!!",
    ]
    
    for expr in test_expressions:
        parser = ExpressionParser(expr)
        is_valid, error = parser.parse()
        status = "✓" if is_valid else "✗"
        print(f"  {status} {expr:40} {error if error else ''}")
    print()


def test_template_parser():
    """Test template parser"""
    print("=== Testing Template Parser ===")
    
    # Test 1: Valid template
    print("Test 1: Valid template")
    template1 = """<html>
<body>
<h1>%pageTitle()%</h1>
<p>%text%</p>
</body>
</html>"""
    
    parser1 = TemplateParser(template1)
    diags1 = parser1.parse()
    print(f"  Diagnostics: {len(diags1)}")
    for diag in diags1:
        print(f"    - {diag.message}")
    print()
    
    # Test 2: Invalid expression
    print("Test 2: Invalid expression")
    template2 = """<html>
<body>
<p>%invalid syntax !!!%</p>
</body>
</html>"""
    
    parser2 = TemplateParser(template2)
    diags2 = parser2.parse()
    print(f"  Diagnostics: {len(diags2)}")
    for diag in diags2:
        print(f"    - {diag.message}")
    print()
    
    # Test 3: Invalid tag
    print("Test 3: Invalid tag")
    template3 = """<html>
<body>
<wr-invalid condition="test">
  Content
</wr-invalid>
</body>
</html>"""
    
    parser3 = TemplateParser(template3)
    diags3 = parser3.parse()
    print(f"  Diagnostics: {len(diags3)}")
    for diag in diags3:
        print(f"    - {diag.message}")
    print()
    
    # Test 4: Unclosed tag
    print("Test 4: Unclosed tag")
    template4 = """<html>
<body>
<wr-if condition="true">
  Content
</body>
</html>"""
    
    parser4 = TemplateParser(template4)
    diags4 = parser4.parse()
    print(f"  Diagnostics: {len(diags4)}")
    for diag in diags4:
        print(f"    - {diag.message}")
    print()
    
    # Test 5: Valid wr-for
    print("Test 5: Valid wr-for")
    template5 = """<table>
<wr-for list="items" variable="item" count="i">
  <tr>
    <td>%i%</td>
    <td>%item.name%</td>
  </tr>
</wr-for>
</table>"""
    
    parser5 = TemplateParser(template5)
    diags5 = parser5.parse()
    print(f"  Diagnostics: {len(diags5)}")
    for diag in diags5:
        print(f"    - {diag.message}")
    print()


if __name__ == '__main__':
    test_tokenizer()
    test_expression_parser()
    test_template_parser()
    
    print("=== All tests completed ===")
