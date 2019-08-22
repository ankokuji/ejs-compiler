declare interface Token {
  type: TokenType;
  content: string;
}

enum TokenType {
  String,
  JsControlFlow,
  JsRuntimeOutput
}

/**
 * Compile and return the compiled function.
 *
 * @export
 * @param {string} template
 * @returns
 */
export function compile(template: string) {
  const fnBody = parse(template);
  const fn = new Function("locals", fnBody);

  return function(this: any, locals: any) {
    return fn.call(this, locals);
  };
}

/**
 * Parse template and generate function body string.
 *
 * @param {string} template
 * @returns {string}
 */
function parse(template: string): string {
  template = preprocessTemplate(template);
  const tokens = tokenize(template);
  const body = tokens.map(genCodeForToken).join("");
  return "var buffer = []; with(locals) {" + body + "} return buffer.join('');";
}

/**
 * Replace the newline character and...
 *
 * @param {string} template
 * @returns {string}
 */
function preprocessTemplate(template: string): string {
  const t = template.replace(/\n/g, "\\n");
  return t;
}

/**
 * Generate code from token.
 *
 * @param {Token} token
 * @returns {string}
 */
function genCodeForToken(token: Token): string {
  if (token.type === TokenType.JsControlFlow) {
    return token.content + ";";
  } else if (token.type === TokenType.JsRuntimeOutput) {
    return "buffer.push(" + token.content + ");";
  } else {
    return "buffer.push('" + token.content + "');";
  }
}

/**
 * Tokenize the template with 3 kind of token type.
 *
 * @export
 * @param {string} template
 * @returns {Token[]}
 */
export function tokenize(template: string): Token[] {
  const open = "<%",
    close = "%>",
    length = template.length,
    tokens = [];

  let pos = 0;

  while (pos < length) {
    let token;
    if (template.indexOf(open, pos) === pos) {
      token = createJsToken();
    } else {
      token = createStringToken();
    }

    tokens.push(token);
  }

  return tokens;

  /**
   * Create an ejs token from given string.
   *
   * @returns {Token}
   */
  function createJsToken(): Token {
    const endPos = template.indexOf(close, pos);

    if (endPos < 0) {
      throw new Error("Cannot find close tag for ejs.");
    }
    const contentWithDescriptor = template.slice(pos + open.length, endPos);

    pos = endPos + close.length;

    const [type, content] = processDescriptorOfJsToken(contentWithDescriptor);

    return {
      type,
      content
    };
  }

  /**
   * Create an ejs string token directly.
   *
   * @returns
   */
  function createStringToken() {
    let endPos = template.indexOf(open, pos);

    if (endPos < 0) {
      endPos = template.length;
    }

    const content = template.slice(pos, endPos);
    pos = endPos;
    return {
      type: TokenType.String,
      content
    };
  }
}

/**
 * Get the exact implicit type of an ejs template token.
 *
 * @param {string} contentWithDescriptor
 * @returns {[TokenType, string]}
 */
function processDescriptorOfJsToken(
  contentWithDescriptor: string
): [TokenType, string] {
  const firstChar = contentWithDescriptor[0];
  let content: string, type: TokenType;
  switch (firstChar) {
    case "=":
      content = contentWithDescriptor.slice(1).trim();
      type = TokenType.JsRuntimeOutput;
      break;
    default:
      content = contentWithDescriptor;
      type = TokenType.JsControlFlow;
      break;
  }
  return [type, content];
}
