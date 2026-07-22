import { z } from '@bpinternal/zui'
import { beforeAll, beforeEach, afterAll, assert, describe, expect, it } from 'vitest'
import * as llmz from '../src/runtime/execute.js'
import { Tool } from '../src/tool.js'
import { Exit } from '../src/exit.js'
import { ThinkSignal } from '../src/errors.js'
import { ExecutionResult, SuccessExecutionResult } from '../src/result.js'
import { getCachedCognitiveClient } from './__tests__/index.js'
import { Component } from '../src/component.js'
import { Chat } from '../src/chat.js'
import { TranscriptArray } from '../src/transcript.js'

const client = getCachedCognitiveClient()

function assertSuccess(result: ExecutionResult): asserts result is SuccessExecutionResult {
  assert(
    result instanceof SuccessExecutionResult,
    `Expected result to be success but got ${result.status}\n${result.isError() ? result.error : ''}`.trim()
  )
}

describe('chat mode code snippets', { retry: 0, timeout: 60_000 }, () => {
  let unsub = () => {}
  let chat: Chat
  let messagesSent: string[]
  let transcript: TranscriptArray

  beforeAll(() => {
    unsub = client.on('error', (req, err) => {
      console.error('Error from cognitive client', req, err)
    })
  })

  afterAll(() => {
    unsub()
  })

  const MarkdownComponent = new Component({
    name: 'Markdown',
    type: 'leaf',
    description: 'Renders markdown content',
    leaf: {
      props: z.object({}),
    },
    examples: [
      {
        code: '<Markdown>Here is some text.</Markdown>',
        description: 'Simple markdown component',
        name: 'Simple Markdown',
      },
    ],
  })

  beforeEach(() => {
    messagesSent = []
    transcript = new TranscriptArray()
    chat = new Chat({
      transcript,
      components: [MarkdownComponent],
      handler: async (component) => {
        const appendTextChildren = (c: any) => {
          if (typeof c === 'string') {
            return c
          }
          if (Array.isArray(c.children)) {
            return c.children.map(appendTextChildren).flat()
          }
          return []
        }

        messagesSent.push(appendTextChildren(component).join(''))
      },
    })
  })

  describe('HTML and JavaScript code snippets', () => {
    it('should handle React component with JSX, hooks, and template literals', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets documentation for a topic',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
Here's how to create a React component with state:

\`\`\`jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h1>{user?.name || "Unknown"}</h1>
      <p>Email: {user?.email}</p>
      <button onClick={() => alert(\`Hello \${user.name}!\`)}>
        Greet User
      </button>
    </div>
  );
}

export default UserProfile;
\`\`\`

Key points:
- Use \`useState\` for local state
- Use \`useEffect\` for side effects
- Template literals use \${} for interpolation
- JSX uses {} for JavaScript expressions
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I create a React component with state?',
      })

      const result = await llmz.executeContext({
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        chat,
        options: { loop: 5 },
        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      // Should have yielded components with the code snippet
      expect(messagesSent.length).toBeGreaterThan(0)
      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me look up the documentation on creating React components with state for you...",
          "To create a React component with state, you typically use the \`useState\` hook. This allows you to add local state to functional components.

        Here is a complete example of a component that manages state for a user profile, including a loading state and data fetching:

        \`\`\`jsx
        import React, { useState, useEffect } from 'react';

        function UserProfile({ userId }) {
          // Declare state variables using the useState hook
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
            // Side effect: fetch user data when the component mounts or userId changes
            fetch(\`/api/users/\${userId}\`)
              .then(res => res.json())
              .then(data => {
                setUser(data);
                setLoading(false);
              });
          }, [userId]);

          if (loading) return <div>Loading...</div>;

          return (
            <div className="user-profile">
              <h1>{user?.name || "Unknown"}</h1>
              <p>Email: {user?.email}</p>
              <button onClick={() => alert(\`Hello \${user.name}!\`)}>
                Greet User
              </button>
            </div>
          );
        }

        export default UserProfile;
        \`\`\`

        ### Key Concepts:
        1. **\`useState\`**: This hook returns a pair: the current state value and a function that lets you update it. For example, \`const [user, setUser] = useState(null);\` initializes the state to \`null\`.
        2. **\`useEffect\`**: Used for side effects like API calls. The dependency array \`[userId]\` ensures the effect runs whenever the \`userId\` prop changes.
        3. **JSX Expressions**: Use curly braces \`{}\` to embed JavaScript expressions (like variable names or logic) directly into your HTML-like markup.
        4. **Conditional Rendering**: You can use standard JavaScript \`if\` statements or ternary operators to return different JSX based on the current state (e.g., showing a "Loading..." message).",
        ]
      `)
    })

    it('should handle HTML with special characters and attributes', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets HTML documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
HTML Form with validation:

\`\`\`html
<form action="/submit" method="POST" onsubmit="return validate()">
  <input
    type="text"
    name="email"
    placeholder="Enter email"
    required
    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
  />
  <input type="password" name="pwd" minlength="8" required />
  <button type="submit">Submit &rarr;</button>
</form>

<script>
function validate() {
  const email = document.querySelector('input[name="email"]').value;
  if (!email.includes('@')) {
    alert("Invalid email!");
    return false;
  }
  return true;
}
</script>

<style>
input:invalid {
  border: 2px solid red;
}
input:valid {
  border: 2px solid green;
}
</style>
\`\`\`

Special characters handled:
- Quotes: " and '
- Greater/less than: < >
- Ampersands: &rarr; &lt; &gt;
- Brackets: [] {} ()
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I create HTML forms?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me look up the documentation on how to create HTML forms for you...",
          "To create HTML forms, you use the \`<form>\` element, which acts as a container for various input elements like text fields, passwords, and submit buttons.

        Here is a comprehensive example of an HTML form that includes basic validation, styling for valid/invalid inputs, and a simple JavaScript validation function:

        \`\`\`html
        <form action="/submit" method="POST" onsubmit="return validate()">
          <input
            type="text"
            name="email"
            placeholder="Enter email"
            required
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
          />
          <input type="password" name="pwd" minlength="8" required />
          <button type="submit">Submit &rarr;</button>
        </form>

        <script>
        function validate() {
          const email = document.querySelector('input[name="email"]').value;
          if (!email.includes('@')) {
            alert("Invalid email!");
            return false;
          }
          return true;
        }
        </script>

        <style>
        input:invalid {
          border: 2px solid red;
        }
        input:valid {
          border: 2px solid green;
        }
        </style>
        \`\`\`

        ### Key Components Explained:
        - **\`<form>\`**: The main wrapper. The \`action\` attribute defines where to send the data, and \`method="POST"\` specifies the HTTP method.
        - **\`<input type="text">\`**: Used for single-line text. The \`required\` attribute ensures the field isn't empty, and \`pattern\` allows you to use Regular Expressions for validation (like checking for a valid email format).
        - **\`<input type="password">\`**: Masks the characters entered by the user.
        - **\`<button type="submit">\`**: The button that triggers the form submission.
        - **CSS Pseudo-classes**: \`:invalid\` and \`:valid\` are used in the style block to provide immediate visual feedback to the user based on the input requirements.
        - **JavaScript Validation**: The \`onsubmit\` attribute calls a \`validate()\` function to perform additional checks before the form is actually sent to the server.",
        ]
      `)
    })

    it('should handle TypeScript with generics, decorators, and complex types', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets TypeScript documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
TypeScript Advanced Types:

\`\`\`typescript
// Generic constraints with template literals
type RouteParams<T extends string> = T extends \`\${infer Start}/:\${infer Param}/\${infer Rest}\`
  ? { [K in Param]: string } & RouteParams<\`\${Start}/\${Rest}\`>
  : {};

// Decorator example
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(\`Calling \${propertyKey} with\`, args);
    return original.apply(this, args);
  };
}

class ApiClient<T extends { id: string }> {
  @Log
  async fetch(id: string): Promise<T | null> {
    const response = await fetch(\`/api/items/\${id}\`);
    return response.json();
  }

  // Conditional types
  transform<K extends keyof T>(
    key: K
  ): T[K] extends string ? string : number {
    return this.data[key] as any;
  }
}

// Mapped types with template literals
type EventMap = {
  click: MouseEvent;
  keypress: KeyboardEvent;
};

type EventHandlers = {
  [K in keyof EventMap as \`on\${Capitalize<K>}\`]: (e: EventMap[K]) => void;
};
\`\`\`

Features demonstrated:
- Template literal types with \${} syntax
- Generic constraints: <T extends ...>
- Decorators with @ symbol
- Mapped types and conditional types
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'What are advanced TypeScript types?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me look up the documentation on advanced TypeScript types for you...",
          "Advanced TypeScript types allow you to create highly flexible, reusable, and type-safe code by leveraging the type system to perform logic and transformations.

        Here are some of the key advanced features:

        ### 1. Generic Constraints
        Constraints allow you to restrict the types that a generic type parameter can accept using the \`extends\` keyword.
        \`\`\`typescript
        class ApiClient<T extends { id: string }> {
          async fetch(id: string): Promise<T | null> {
            const response = await fetch(\`/api/items/\${id}\`);
            return response.json();
          }
        }
        \`\`\`

        ### 2. Conditional Types
        Conditional types allow you to select one of two types based on a condition, similar to a ternary operator in JavaScript.
        \`\`\`typescript
        // If T[K] is a string, return string; otherwise, return number
        transform<K extends keyof T>(
          key: K
        ): T[K] extends string ? string : number {
          return this.data[key] as any;
        }
        \`\`\`

        ### 3. Mapped Types and Template Literals
        Mapped types allow you to create new types based on existing ones. When combined with template literal types, you can dynamically generate property names.
        \`\`\`typescript
        type EventMap = {
          click: MouseEvent;
          keypress: KeyboardEvent;
        };

        // Creates a type with keys like 'onClick' and 'onKeypress'
        type EventHandlers = {
          [K in keyof EventMap as \`on\${Capitalize<K>}\`]: (e: EventMap[K]) => void;
        };
        \`\`\`

        ### 4. Template Literal Types with Inference
        You can use the \`infer\` keyword within template literal types to extract specific parts of a string type.
        \`\`\`typescript
        type RouteParams<T extends string> = T extends \`\${infer Start}/:\${infer Param}/\${infer Rest}\`
          ? { [K in Param]: string } & RouteParams<\`\${Start}/\${Rest}\`>
          : {};
        \`\`\`

        ### 5. Decorators
        Decorators are a special kind of declaration that can be attached to a class, method, accessor, property, or parameter to modify its behavior.
        \`\`\`typescript
        function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
          const original = descriptor.value;
          descriptor.value = function(...args: any[]) {
            console.log(\`Calling \${propertyKey} with\`, args);
            return original.apply(this, args);
          };
        }

        class ApiClient {
          @Log
          async fetch(id: string) { /* ... */ }
        }
        \`\`\`",
        ]
      `)
    })

    it('should handle SQL with quotes, operators, and special syntax', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets SQL documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async () => {
          const content = `
SQL Query Examples:

\`\`\`sql
-- Complex SELECT with CTEs and window functions
WITH ranked_users AS (
  SELECT
    id,
    name,
    email,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY id) as daily_rank
  FROM users
  WHERE email LIKE '%@gmail.com'
    AND name != 'Admin'
    AND created_at >= '2024-01-01'
)
SELECT
  *,
  CASE
    WHEN daily_rank = 1 THEN 'First of day'
    WHEN daily_rank <= 10 THEN 'Top 10'
    ELSE 'Other'
  END as rank_category
FROM ranked_users
WHERE daily_rank <= 100;

-- Insert with string escaping
INSERT INTO messages (content, metadata) VALUES
  ('User said: "Hello!"', '{"sender": "user", "timestamp": "2024-01-01"}'),
  ('It''s a nice day', '{"type": "greeting"}'),
  ('Path: C:\\Users\\Documents\\file.txt', NULL);

-- JSON operations (PostgreSQL)
SELECT
  data->>'name' as name,
  data->'address'->>'city' as city,
  jsonb_array_elements(data->'tags') as tag
FROM documents
WHERE data @> '{"status": "active"}';
\`\`\`

Key syntax:
- Single quotes for strings: 'text'
- Double quotes for identifiers: "column_name"
- Escaped quotes: ''
- Operators: -> ->> @> >= <= !=
- Comments: -- and /* */
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I write SQL queries?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "I can help you with that! To give you the most accurate guidance and examples, I'll look up the SQL documentation for you.",
          "Writing SQL queries involves using a structured language to communicate with a database. Depending on what you want to do (retrieve, add, or modify data), you will use different commands.

        ### 1. Basic Data Retrieval (\`SELECT\`)
        The most common task is retrieving data using the \`SELECT\` statement. 

        **Example: Basic Filter and Selection**
        \`\`\`sql
        SELECT id, name, email 
        FROM users 
        WHERE email LIKE '%@gmail.com' 
          AND name != 'Admin' 
          AND created_at >= '2024-01-01';
        \`\`\`

        ### 2. Advanced Querying
        For more complex analysis, you can use **Common Table Expressions (CTEs)** and **Window Functions** to organize your data.

        **Example: Ranking users per day**
        \`\`\`sql
        WITH ranked_users AS (
          SELECT
            id,
            name,
            ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY id) as daily_rank
          FROM users
        )
        SELECT
          *,
          CASE
            WHEN daily_rank = 1 THEN 'First of day'
            WHEN daily_rank <= 10 THEN 'Top 10'
            ELSE 'Other'
          END as rank_category
        FROM ranked_users
        WHERE daily_rank <= 100;
        \`\`\`

        ### 3. Inserting Data (\`INSERT\`)
        To add new records, use the \`INSERT INTO\` command. Remember that strings must be enclosed in single quotes.

        **Example: Adding messages**
        \`\`\`sql
        INSERT INTO messages (content, metadata) VALUES
          ('User said: "Hello!"', '{"sender": "user", "timestamp": "2024-01-01"}'),
          ('It''s a nice day', '{"type": "greeting"}');
        \`\`\`
        *Note: To include a single quote inside a string, use two single quotes (e.g., \`''\`).*

        ### 4. Working with JSON (PostgreSQL)
        Modern SQL databases often handle JSON data. You can use special operators to extract values.

        **Example: Extracting JSON fields**
        \`\`\`sql
        SELECT
          data->>'name' as name,
          data->'address'->>'city' as city
        FROM documents
        WHERE data @> '{"status": "active"}';
        \`\`\`

        ### Key Syntax Cheat Sheet:
        - **Strings**: Use single quotes (\`'text'\`).
        - **Identifiers**: Use double quotes for column or table names if they contain spaces or reserved words (\`"column_name"\`).
        - **Comments**: Use \`--\` for single-line comments or \`/* */\` for multi-line blocks.
        - **Operators**: 
            - \`>=\`, \`<=\`, \`!=\` (Comparison)
            - \`LIKE\` (Pattern matching)
            - \`->\`, \`->>\`, \`@>\` (JSON operations in Postgres)",
        ]
      `)
    })

    it('should handle Bash scripts with variables, quotes, and special characters', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets Bash documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async () => {
          const content = `
Bash Scripting Examples:

\`\`\`bash
#!/bin/bash

# Variables and parameter expansion
NAME="John Doe"
FILE_PATH="/home/\${USER}/documents"
TIMESTAMP=\\$(date +%Y-%m-%d_%H:%M:%S)

# String manipulation
echo "Hello \${NAME}!"
echo "Uppercase: \${NAME^^}"
echo "Lowercase: \${NAME,,}"
echo "Replace: \${NAME/John/Jane}"

# Conditionals with test operators
if [[ "\${NAME}" =~ ^[A-Z] ]] && [[ -f "\${FILE_PATH}" ]]; then
  echo "Name starts with capital and file exists"
elif [[ ! -z "\${NAME}" ]]; then
  echo "Name is not empty"
fi

# Arrays and loops
FILES=("file1.txt" "file2.txt" "file with spaces.txt")
for file in "\${FILES[@]}"; do
  if [[ -f "\$file" ]]; then
    echo "Processing: '\$file'"
    cat "\$file" | grep -E "pattern|another" > "output_\${file}"
  fi
done

# Command substitution and pipes
LINES=\$(wc -l < input.txt)
RESULT=\$(cat file.txt | sed 's/old/new/g' | awk '{print \$1}')

# Here documents
cat << 'EOF' > output.txt
This is a here document.
Variables like \$HOME are not expanded.
Special chars: < > | & ; ' " \` \$
EOF

# Function with error handling
process_file() {
  local file="\$1"
  if [[ ! -r "\$file" ]]; then
    echo "Error: Cannot read '\$file'" >&2
    return 1
  fi
  echo "Success: \$file"
}
\`\`\`

Important syntax:
- Variables: \$VAR or \${VAR}
- Command substitution: \$(command)
- Quotes: "double" 'single' \\\`backticks\\\`
- Special chars: \$ \` ! & | < > ; ( ) { } [ ]
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I write Bash scripts?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me look up the documentation on how to write Bash scripts for you.",
          "Writing Bash scripts is a powerful way to automate tasks in Unix-like environments. To get started, you create a text file and begin it with a "shebang" (\`#!/bin/bash\`), which tells the system to use the Bash interpreter to execute the script.

        ### Basic Structure and Examples

        Here is a comprehensive example demonstrating key Bash concepts:

        \`\`\`bash
        #!/bin/bash

        # 1. Variables and parameter expansion
        NAME="John Doe"
        FILE_PATH="/home/\${USER}/documents"
        TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S)

        # String manipulation
        echo "Hello \${NAME}!"
        echo "Uppercase: \${NAME^^}"
        echo "Lowercase: \${NAME,,}"
        echo "Replace: \${NAME/John/Jane}"

        # 2. Conditionals
        # Use [[ ]] for more robust testing
        if [[ "\${NAME}" =~ ^[A-Z] ]] && [[ -f "\${FILE_PATH}" ]]; then
          echo "Name starts with capital and file exists"
        elif [[ ! -z "\${NAME}" ]]; then
          echo "Name is not empty"
        fi

        # 3. Arrays and Loops
        FILES=("file1.txt" "file2.txt" "file with spaces.txt")
        for file in "\${FILES[@]}"; do
          if [[ -f "$file" ]]; then
            echo "Processing: '$file'"
            cat "$file" | grep -E "pattern|another" > "output_\${file}"
          fi
        done

        # 4. Command substitution and pipes
        # Capture the output of a command into a variable
        LINES=$(wc -l < input.txt)
        RESULT=$(cat file.txt | sed 's/old/new/g' | awk '{print $1}')

        # 5. Here documents (Writing multi-line text to a file)
        cat << 'EOF' > output.txt
        This is a here document.
        Variables like $HOME are not expanded.
        Special chars: < > | & ; ' " \` $
        EOF

        # 6. Functions with error handling
        process_file() {
          local file="$1"
          if [[ ! -r "$file" ]]; then
            echo "Error: Cannot read '$file'" >&2
            return 1
          fi
          echo "Success: $file"
        }
        \`\`\`

        ### Key Syntax Cheat Sheet

        *   **Variables**: Access them using \`$VAR\` or \`\${VAR}\`.
        *   **Command Substitution**: Use \`$(command)\` to save the output of a command to a variable.
        *   **Quotes**: 
            *   \`"Double quotes"\` allow variable expansion.
            *   \`'Single quotes'\` treat everything as a literal string.
        *   **Special Characters**: Be careful with characters like \`$\`, \`\` \` \`\`, \`!\`, \`&\`, \`|\`, \`<\`, \`>\`, \`;\`, \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, and \`]\`, as they have special meanings in Bash.

        ### How to Run Your Script

        1.  **Create the file**: \`nano myscript.sh\`
        2.  **Make it executable**: \`chmod +x myscript.sh\`
        3.  **Run it**: \`./myscript.sh\`",
        ]
      `)
    })

    it('should handle Python with f-strings, raw strings, and triple quotes', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets Python documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
Python String Formatting:

\`\`\`python
import re
from datetime import datetime

# F-strings with expressions
name = "Alice"
age = 30
print(f"Hello {name}! You are {age} years old.")
print(f"Next year: {age + 1}")
print(f"Uppercase: {name.upper()}")

# F-strings with format specs
price = 19.99
print(f"Price: \${price:.2f}")
print(f"Hex: {255:#x}")
print(f"Percentage: {0.846:.1%}")

# Raw strings for regex
pattern = r"\\d{3}-\\d{3}-\\d{4}"
phone = "555-123-4567"
if re.match(pattern, phone):
    print(f"Valid phone: {phone}")

# Triple-quoted strings
sql_query = """
SELECT *
FROM users
WHERE name = '{name}'
  AND age > {age}
  AND email LIKE '%@gmail.com'
"""

# Mixed quotes
message = f'''User said: "{name} is here!"'''
path = r"C:\\Users\\{name}\\Documents"

# Dictionary formatting
user = {"name": "Bob", "role": "admin"}
print(f"User: {user['name']} ({user.get('role', 'user')})")

# Template strings
template = "Hello {name}, you have {count} messages"
result = template.format(name="Charlie", count=5)

# Special characters in strings
special = "Tab:\\t Newline:\\n Quote:\\" Backslash:\\\\"
regex = r"Match: \\s+ or \\d{2,4} or [a-zA-Z]+"
\`\`\`

String types:
- F-strings: f"{var}" with {expressions}
- Raw strings: r"\\path\\to\\file"
- Triple quotes: """multi-line"""
- Format: "{0}".format(val)
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I use Python string formatting?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me look up the documentation for Python string formatting to provide you with the most accurate guide and examples.",
          "Python offers several ways to format strings. The most modern and preferred method is using **f-strings**, but there are other options depending on your needs.

        ### 1. F-Strings (Formatted String Literals)
        Introduced in Python 3.6, f-strings are the fastest and most readable way to format strings. You simply prefix the string with \`f\` and use curly braces \`{}\` to embed expressions.

        **Basic Usage:**
        \`\`\`python
        name = "Alice"
        age = 30
        print(f"Hello {name}! You are {age} years old.")
        # Output: Hello Alice! You are 30 years old.
        \`\`\`

        **Expressions inside F-Strings:**
        You can perform calculations or call methods directly inside the braces.
        \`\`\`python
        print(f"Next year: {age + 1}")        # Output: Next year: 31
        print(f"Uppercase: {name.upper()}")   # Output: Uppercase: ALICE
        \`\`\`

        **Format Specifiers:**
        F-strings allow you to control precision, padding, and number formats.
        \`\`\`python
        price = 19.99
        print(f"Price: \${price:.2f}")       # 2 decimal places: Price: $19.99
        print(f"Hex: {255:#x}")             # Hexadecimal: Hex: 0xff
        print(f"Percentage: {0.846:.1%}")   # Percentage: Percentage: 84.6%
        \`\`\`

        ### 2. The \`.format()\` Method
        This method is useful when the string template is defined separately from the values.

        \`\`\`python
        template = "Hello {name}, you have {count} messages"
        result = template.format(name="Charlie", count=5)
        print(result) 
        # Output: Hello Charlie, you have 5 messages
        \`\`\`

        ### 3. Special String Types
        - **Raw Strings (\`r""\`)**: Used primarily for regular expressions or file paths to treat backslashes \`\\\` as literal characters.
          \`\`\`python
          path = r"C:\\Users\\Name\\Documents"
          \`\`\`
        - **Triple-Quoted Strings (\`""" """\`)**: Used for multi-line strings.
          \`\`\`python
          sql_query = """
          SELECT *
          FROM users
          WHERE name = 'Alice'
          """
          \`\`\`

        ### Summary Table
        | Method | Syntax | Best For |
        | :--- | :--- | :--- |
        | **F-Strings** | \`f"Hello {var}"\` | Most general use cases, readability, and speed. |
        | **.format()** | \`"{}".format(var)\` | Templating where the string is defined elsewhere. |
        | **Raw Strings** | \`r"C:\\path"\` | Regex and Windows file paths. |
        | **Triple Quotes** | \`""" text """\` | Multi-line strings and docstrings. |",
        ]
      `)
    })

    it('should handle JSON with nested objects, arrays, and escaped characters', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets JSON examples',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
JSON Structure Examples:

\`\`\`json
{
  "user": {
    "id": "usr_123",
    "name": "John O'Brien",
    "email": "john@example.com",
    "roles": ["admin", "user"],
    "metadata": {
      "created": "2024-01-01T00:00:00Z",
      "tags": ["premium", "early-adopter"],
      "preferences": {
        "theme": "dark",
        "notifications": true
      }
    }
  },
  "messages": [
    {
      "id": 1,
      "text": "Hello \\"world\\"!",
      "author": "Alice",
      "timestamp": "2024-01-01T12:00:00Z"
    },
    {
      "id": 2,
      "text": "Path: C:\\\\Users\\\\Documents\\\\file.txt",
      "author": "Bob",
      "html": "<p>This is <strong>bold</strong></p>"
    }
  ],
  "config": {
    "apiUrl": "https://api.example.com/v1",
    "regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$",
    "template": "User {name} has {count} items",
    "escapes": "Tab:\\t Newline:\\n Quote:\\" Backslash:\\\\"
  },
  "special_chars": {
    "unicode": "Hello \\u0041\\u0042\\u0043",
    "emoji": "🎉 \\uD83D\\uDE80",
    "null_value": null,
    "boolean": true,
    "number": 42.5e-10
  }
}
\`\`\`

Escaping rules:
- Quotes: \\\\" inside strings
- Backslash: \\\\\\\\ for single \\\\
- Special: \\\\n \\\\t \\\\r \\\\b \\\\f
- Unicode: \\\\uXXXX
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I work with JSON?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me find the documentation and examples for working with JSON for you.",
          "To work with JSON, you need to follow a specific structure consisting of key-value pairs and arrays. Below is a comprehensive example and a guide on how to handle special characters.

        ### JSON Structure Example
        Here is an example of a complex JSON object containing various data types:

        \`\`\`json
        {
          "user": {
            "id": "usr_123",
            "name": "John O'Brien",
            "email": "john@example.com",
            "roles": ["admin", "user"],
            "metadata": {
              "created": "2024-01-01T00:00:00Z",
              "tags": ["premium", "early-adopter"],
              "preferences": {
                "theme": "dark",
                "notifications": true
              }
            }
          },
          "messages": [
            {
              "id": 1,
              "text": "Hello \\"world\\"!",
              "author": "Alice",
              "timestamp": "2024-01-01T12:00:00Z"
            },
            {
              "id": 2,
              "text": "Path: C:\\\\Users\\\\Documents\\\\file.txt",
              "author": "Bob",
              "html": "<p>This is <strong>bold</strong></p>"
            }
          ],
          "config": {
            "apiUrl": "https://api.example.com/v1",
            "regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$",
            "template": "User {name} has {count} items",
            "escapes": "Tab:\\t Newline:\\n Quote:\\" Backslash:\\\\"
          },
          "special_chars": {
            "unicode": "Hello \\u0041\\u0042\\u0043",
            "emoji": "🎉 \\uD83D\\uDE80",
            "null_value": null,
            "boolean": true,
            "number": 42.5e-10
          }
        }
        \`\`\`

        ### Key Rules and Escaping
        When working with strings in JSON, certain characters must be escaped using a backslash (\`\\\`):

        *   **Quotes**: Use \`\\"\` to include a double quote inside a string.
        *   **Backslashes**: Use \`\\\\\` to represent a single backslash.
        *   **Control Characters**:
            *   \`\\n\` for a new line.
            *   \`\\t\` for a tab.
            *   \`\\r\` for a carriage return.
            *   \`\\b\` for a backspace.
            *   \`\\f\` for a form feed.
        *   **Unicode**: Use \`\\uXXXX\` (where XXXX is the hex code) to represent unicode characters.

        ### Supported Data Types
        *   **Objects**: Wrapped in curly braces \`{}\`.
        *   **Arrays**: Wrapped in square brackets \`[]\`.
        *   **Strings**: Wrapped in double quotes \`""\`.
        *   **Numbers**: Integers or floating-point numbers (e.g., \`42.5e-10\`).
        *   **Booleans**: \`true\` or \`false\`.
        *   **Null**: \`null\`.",
        ]
      `)
    })

    it('should handle CSS with selectors, pseudo-classes, and special syntax', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets CSS documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
CSS Advanced Selectors:

\`\`\`css
/* Attribute selectors with special chars */
a[href^="https://"] { color: green; }
a[href$=".pdf"] { background: url('icon.pdf'); }
input[type="text"]:focus { border: 2px solid blue; }
div[data-theme~="dark"] { background: #000; }

/* Pseudo-classes and pseudo-elements */
li:nth-child(2n+1) { background: #f0f0f0; }
p::first-letter { font-size: 2em; }
p::before { content: "→ "; }
p::after { content: " ←"; }

/* Complex selectors */
nav > ul > li:not(.active) a:hover { text-decoration: underline; }
div.container:has(> img) { padding: 20px; }

/* CSS variables with special naming */
:root {
  --primary-color: #007bff;
  --font-stack: "Helvetica Neue", Arial, sans-serif;
  --spacing-md: calc(1rem * 1.5);
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Using variables and functions */
.button {
  background: var(--primary-color);
  font-family: var(--font-stack);
  padding: var(--spacing-md);
  box-shadow: var(--shadow);
  transform: rotate(45deg) scale(1.2);
}

/* Media queries */
@media (min-width: 768px) and (max-width: 1024px) {
  .responsive { font-size: clamp(1rem, 2vw, 2rem); }
}

/* Keyframes with percentages */
@keyframes slide-in {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0); opacity: 0.5; }
  100% { opacity: 1; }
}

/* Content with special chars */
.icon::before {
  content: "\\2192"; /* → */
}
.quote::before {
  content: "\\201C"; /* " */
}
\`\`\`

Special CSS features:
- Selectors: [ ] ~ > + : :: ( )
- Functions: calc() clamp() rgba() url()
- Variables: --custom-property
- Escapes: \\\\ for special chars
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I write CSS selectors?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me look up the documentation on CSS selectors for you...",
          "CSS selectors are used to "find" or select the HTML elements you want to style. They range from simple type selectors to complex combinations.

        ### 1. Basic Selectors
        *   **Element Selector**: Selects elements based on the element name.
            \`\`\`css
            p { color: blue; } /* All <p> elements */
            \`\`\`
        *   **Class Selector**: Selects elements with a specific class attribute (starts with a dot \`.\`).
            \`\`\`css
            .highlight { background-color: yellow; }
            \`\`\`
        *   **ID Selector**: Selects a unique element with a specific ID (starts with a hash \`#\`).
            \`\`\`css
            #main-header { font-size: 24px; }
            \`\`\`

        ### 2. Advanced Selectors
        You can use more specific selectors to target elements based on their relationship or attributes:

        *   **Attribute Selectors**: Target elements based on their attributes.
            \`\`\`css
            a[href^="https://"] { color: green; } /* Starts with https:// */
            a[href$=".pdf"] { background: url('icon.pdf'); } /* Ends with .pdf */
            \`\`\`
        *   **Pseudo-classes**: Target elements based on their state or position.
            \`\`\`css
            li:nth-child(2n+1) { background: #f0f0f0; } /* Odd numbered list items */
            input[type="text"]:focus { border: 2px solid blue; } /* When focused */
            \`\`\`
        *   **Pseudo-elements**: Style specific parts of an element.
            \`\`\`css
            p::first-letter { font-size: 2em; }
            p::before { content: "→ "; }
            \`\`\`

        ### 3. Combinators
        Combinators explain the relationship between selectors:
        *   **Descendant Selector (space)**: Selects all descendants.
        *   **Child Selector (\`>\`)**: Selects direct children only.
        *   **Adjacent Sibling Selector (\`+\`)**: Selects the element immediately following another.
        *   **General Sibling Selector (\`~\`)**: Selects all siblings following another.

        **Example of a complex selector:**
        \`\`\`css
        /* Selects <a> tags that are hovered, inside <li> tags that are NOT active, 
           which are children of <ul> tags, which are children of <nav> */
        nav > ul > li:not(.active) a:hover { 
          text-decoration: underline; 
        }
        \`\`\`

        ### 4. Modern Features
        You can also use the \`:has()\` pseudo-class to select a parent based on its children:
        \`\`\`css
        div.container:has(> img) { 
          padding: 20px; 
        }
        \`\`\`",
        ]
      `)
    })

    it('should handle Markdown with code blocks, links, and special syntax', async () => {
      const tGetDocs = new Tool({
        name: 'getDocumentation',
        description: 'Gets Markdown documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ content: z.string() }),
        handler: async ({ topic }) => {
          const content = `
Markdown Syntax Guide:

\`\`\`markdown
# Heading with \`inline code\`

## Links and Images
- [Link](https://example.com "Title")
- ![Image](https://example.com/img.png)
- [Reference link][ref]
- <https://auto-link.com>

[ref]: https://example.com "Reference"

## Text Formatting
This is **bold** and *italic* text.
This is ~~strikethrough~~ text.
Inline \`code with {braces}\` here.

## Code Blocks
\\\`\\\`\\\`javascript
const greeting = \\\`Hello \\\${name}!\\\`;
const regex = /[a-z]+/g;
const obj = { key: "value" };
\\\`\\\`\\\`

\\\`\\\`\\\`bash
echo "Current dir: \\\$(pwd)"
grep -r "pattern" .
\\\`\\\`\\\`

## Lists
1. Item with \`code\`
2. Item with **bold**
   - Nested item
   - Another with [link](url)

## Blockquotes
> This is a quote
> With multiple lines
> > Nested quote

## Tables
| Header 1 | Header 2 |
|----------|----------|
| \`code\` | **bold** |
| [link](url) | text |

## Special Characters
Escape these: \\\\ \\\` \\* \\_ \\{ \\} \\[ \\] \\( \\) \\# \\+ \\- \\. \\!

Raw HTML: <div class="custom">content</div>
\`\`\`

Markdown features:
- Backticks: \\\` and \\\`\\\`\\\`
- Brackets: [] ()
- Special: * _ # + - . !
- Escapes: \\\\char
`
          throw new ThinkSignal(content)
        },
      })

      transcript.push({
        role: 'user',
        content: 'How do I use Markdown syntax?',
      })

      const result = await llmz.executeContext({
        chat,
        instructions: 'Answer the user question by retrieving relevant documentation and providing code examples.',
        options: { loop: 5 },

        tools: [tGetDocs],
        client,
      })

      assertSuccess(result)

      // Should have no failed iterations
      //expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)

      // Should complete in 2-4 iterations
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "I'll look up the documentation on Markdown syntax for you.",
          "Here is a guide on how to use Markdown syntax based on the documentation:

        ### Headings
        Use the \`#\` symbol followed by a space:
        \`# Heading 1\`
        \`## Heading 2\`
        \`### Heading 3\`

        ### Text Formatting
        - **Bold**: Wrap text in double asterisks \`**bold**\` or double underscores \`__bold__\`.
        - *Italic*: Wrap text in single asterisks \`*italic*\` or single underscores \`_italic_\`.
        - ~~Strikethrough~~: Wrap text in double tildes \`~~strikethrough~~\`.
        - \`Inline Code\`: Wrap text in single backticks \`\` \`code\` \`\`.

        ### Lists
        **Unordered List**: Use \`-\`, \`*\`, or \`+\`.
        - Item 1
        - Item 2

        **Ordered List**: Use numbers followed by a period.
        1. First item
        2. Second item

        ### Links and Images
        - **Links**: \`[Link Text](https://example.com "Optional Title")\`
        - **Images**: \`![Alt Text](https://example.com/image.png)\`
        - **Auto-links**: \`<https://example.com>\`

        ### Code Blocks
        For multi-line code blocks, use triple backticks and specify the language:
        \`\`\`javascript
        const greeting = \`Hello World!\`;
        \`\`\`

        ### Blockquotes
        Use the \`>\` symbol:
        > This is a blockquote.

        ### Tables
        Use pipes \`|\` and dashes \`-\` to create tables:
        | Header 1 | Header 2 |
        |----------|----------|
        | Cell 1    | Cell 2    |

        ### Escaping Characters
        If you need to display a character that is normally used for formatting (like \`*\` or \`#\`), escape it with a backslash \`\\\`. For example: \`\\*not italic\\*\`.",
        ]
      `)
    })
  })

  describe('confusing HTML formatting instructions', () => {
    it('should handle instructions asking to use HTML tags with search results containing HTML', async () => {
      const tSearch = new Tool({
        name: 'searchDatabase',
        description: 'Searches the database for information',
        input: z.object({ query: z.string() }),
        output: z.object({ results: z.array(z.string()) }),
        handler: async ({ query }) => {
          // Return search results with HTML tags that should be rendered as-is
          return {
            results: [
              '<strong>Product A</strong> is available at <a href="https://example.com/productA">this link</a>',
              'The price is <em>$99.99</em> with a <span class="discount">20% discount</span>',
              '<p>Customer review: "This is <strong>amazing</strong>!" - <cite>John Doe</cite></p>',
              'Visit our <a href="https://example.com/store?ref=search&utm_source=email">online store</a> for more details',
              'Features: <ul><li>Fast shipping</li><li>Money-back guarantee</li></ul>',
            ],
          }
        },
      })

      transcript.push({
        role: 'user',
        content: 'Search for products and show me the results',
      })

      const result = await llmz.executeContext({
        instructions: `You are an assistant that MUST format all responses using rich HTML.

IMPORTANT RULES:
- Use <strong> tags for important text
- Use <em> for emphasis
- Use <a href=""> for links
- Use <p> tags for paragraphs
- When displaying search results, show them EXACTLY as they appear, preserving all HTML tags
- Do NOT escape or modify any HTML tags in the search results
- Make your responses visually rich with nested HTML elements`,
        chat,
        options: { loop: 5 },
        tools: [tSearch],
        client,
      })

      assertSuccess(result)

      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(result.iteration.code).toMatchInlineSnapshot(`undefined`)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "<p><em>Searching for available products...</em></p>",
          "<p>I have found the following product information for you:</p>
        <p><strong>Product A</strong> is available at <a href="https://example.com/productA">this link</a></p>
        <p>The price is <em>$99.99</em> with a <span class="discount">20% discount</span></p>
        <p>Customer review: "This is <strong>amazing</strong>!" - <cite>John Doe</cite></p>
        <p>Visit our <a href="https://example.com/store?ref=search&utm_source=email">online store</a> for more details</p>
        <p>Features: <ul><li>Fast shipping</li><li>Money-back guarantee</li></ul></p>",
        ]
      `)
    })

    it('should handle contradictory instructions about escaping and preserving HTML entities', async () => {
      const tGetContent = new Tool({
        name: 'getContent',
        description: 'Gets content from the database',
        input: z.object({ id: z.string() }),
        output: z.object({ html: z.string() }),
        handler: async ({ id }) => {
          return {
            html: `<div class="article">
  <h1>Article Title &amp; Subtitle</h1>
  <p>This article discusses <strong>important topics</strong> like:</p>
  <ul>
    <li>How to use &lt;script&gt; tags safely</li>
    <li>Understanding &quot;quoted&quot; text</li>
    <li>Working with &apos;single quotes&apos;</li>
    <li>Math: 5 &gt; 3 &amp;&amp; 2 &lt; 4</li>
  </ul>
  <a href="/read?id=123&amp;ref=home">Read more &rarr;</a>
</div>`,
          }
        },
      })

      transcript.push({
        role: 'user',
        content: 'Get content with ID "article-1" and display it',
      })

      const result = await llmz.executeContext({
        instructions: `You are a content display system with STRICT REQUIREMENTS:

1. Display all HTML exactly as received - DO NOT modify or escape anything
2. Preserve all HTML entities like &amp; &lt; &gt; &quot; &apos; &rarr;
3. Keep all tags intact: <div>, <h1>, <p>, <ul>, <li>, <a>, <strong>
4. Maintain proper nesting and structure
5. Show everything "as-is" without interpretation
6. Use rich HTML formatting in your own responses too
7. Wrap content in additional HTML for better presentation

CRITICAL: The user expects to see HTML tags rendered, not as plain text!`,
        chat,
        options: { loop: 5 },
        tools: [tGetContent],
        client,
      })

      assertSuccess(result)

      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(result.iteration.code).toMatchInlineSnapshot(`undefined`)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Fetching the content for you...",
          "<div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <div class="article">
          <h1>Article Title &amp; Subtitle</h1>
          <p>This article discusses <strong>important topics</strong> like:</p>
          <ul>
            <li>How to use &lt;script&gt; tags safely</li>
            <li>Understanding &quot;quoted&quot; text</li>
            <li>Working with &apos;single quotes&apos;</li>
            <li>Math: 5 &gt; 3 &amp;&amp; 2 &lt; 4</li>
          </ul>
          <a href="/read?id=123&amp;ref=home">Read more &rarr;</a>
        </div>
        </div>",
        ]
      `)
    })

    it('should handle instructions mixing code formatting with HTML rendering', async () => {
      const tGetExamples = new Tool({
        name: 'getCodeExamples',
        description: 'Gets code examples with HTML documentation',
        input: z.object({ topic: z.string() }),
        output: z.object({ examples: z.array(z.string()) }),
        handler: async ({ topic }) => {
          return {
            examples: [
              `<div class="example">
  <h3>Example 1: Basic Usage</h3>
  <code>const html = '&lt;div&gt;{content}&lt;/div&gt;';</code>
  <p>This creates a <strong>template string</strong> with HTML.</p>
</div>`,
              `<section>
  <h3>Example 2: JSX Component</h3>
  <pre>
function Button({ label }) {
  return &lt;button onClick={() =&gt; alert(\`Clicked \${label}!\`)}&gt;{label}&lt;/button&gt;;
}
  </pre>
  <p>Notice the <em>curly braces</em> for expressions: <code>{label}</code></p>
</section>`,
              `<article>
  <h3>Example 3: HTML Entities</h3>
  <p>Common entities:</p>
  <ul>
    <li>&amp;lt; for &lt;</li>
    <li>&amp;gt; for &gt;</li>
    <li>&amp;amp; for &amp;</li>
    <li>&amp;quot; for &quot;</li>
  </ul>
  <code>text.replace(/&lt;/g, '&amp;lt;').replace(/&gt;/g, '&amp;gt;')</code>
</article>`,
            ],
          }
        },
      })

      transcript.push({
        role: 'user',
        content: 'Show me code examples for HTML templating',
      })

      const result = await llmz.executeContext({
        instructions: `You are a coding tutor with these EXACT requirements:

FORMAT RULES:
- Surround ALL your responses with HTML tags like <div>, <section>, <article>
- Use <code> and <pre> tags for code snippets
- Use <strong> and <em> for emphasis
- Create nested HTML structures for better organization

CONTENT DISPLAY RULES:
- When you receive examples from tools, display them EXACTLY as-is
- Preserve all HTML tags: <div>, <code>, <pre>, <ul>, <li>, etc.
- Preserve all HTML entities: &lt; &gt; &amp; &quot; etc.
- DO NOT escape or modify the HTML - show it raw
- The examples contain both HTML structure AND code - keep both

CRITICAL: Your output must be valid HTML that includes the raw HTML from the examples!`,
        chat,
        options: { loop: 5 },
        tools: [tGetExamples],
        client,
      })

      assertSuccess(result)

      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(result.iteration.code).toMatchInlineSnapshot(`undefined`)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "<div>
          <p><em>I am looking up some <strong>HTML templating</strong> examples for you...</em></p>
        </div>",
          "<section>
          <div>
            <p>Here are the <strong style="color: #2c3e50;">HTML templating</strong> examples you requested. I have organized them below for your review:</p>
            
            <div style="margin-top: 20px; border: 1px solid #ccc; padding: 10px;">
              <div class="example">
          <h3>Example 1: Basic Usage</h3>
          <code>const html = '&lt;div&gt;{content}&lt;/div&gt;';</code>
          <p>This creates a <strong>template string</strong> with HTML.</p>
        </div>
            </div>

            <div style="margin-top: 20px; border: 1px solid #ccc; padding: 10px;">
              <section>
          <h3>Example 2: JSX Component</h3>
          <pre>
        function Button({ label }) {
          return &lt;button onClick={() =&gt; alert(\`Clicked \${label}!\`)}&gt;{label}&lt;/button&gt;;
        }
          </pre>
          <p>Notice the <em>curly braces</em> for expressions: <code>{label}</code></p>
        </section>
            </div>

            <div style="margin-top: 20px; border: 1px solid #ccc; padding: 10px;">
              <article>
          <h3>Example 3: HTML Entities</h3>
          <p>Common entities:</p>
          <ul>
            <li>&amp;lt; for &lt;</li>
            <li>&amp;gt; for &gt;</li>
            <li>&amp;amp; for &amp;</li>
            <li>&amp;quot; for &quot;</li>
          </ul>
          <code>text.replace(/&lt;/g, '&amp;lt;').replace(/&gt;/g, '&amp;gt;')</code>
        </article>
            </div>
          </div>
        </section>",
        ]
      `)
    })

    it('should handle instructions with template literals and HTML injection patterns', async () => {
      const tGetTemplates = new Tool({
        name: 'getTemplates',
        description: 'Gets HTML templates',
        input: z.object({ category: z.string() }),
        output: z.object({ templates: z.array(z.string()) }),
        handler: async ({ category }) => {
          return {
            templates: [
              `<template id="user-card">
  <div class="card" data-user="\${userId}">
    <h2>\${name}</h2>
    <p>Email: <a href="mailto:\${email}">\${email}</a></p>
    <button onclick="deleteUser('\${userId}')">Delete</button>
  </div>
</template>`,
              `<script type="text/template">
  <div class="message">
    <strong>\${author}</strong> said:
    <blockquote>\${message}</blockquote>
    <small>Posted at \${timestamp}</small>
  </div>
</script>`,
              `<div class="dynamic-content">
  <h1>\${title || 'Untitled'}</h1>
  <div class="body">\${content?.replace(/<script>/g, '&lt;script&gt;')}</div>
  <a href="/edit?id=\${id}&action=update">Edit</a>
</div>`,
            ],
          }
        },
      })

      transcript.push({
        role: 'user',
        content: 'Show me HTML templates with template literals (call getTemplates)',
      })

      const result = await llmz.executeContext({
        instructions: `You are a template engine demonstrator. Follow these rules EXACTLY:

DISPLAY FORMAT:
- Use HTML tags in your responses: <div>, <section>, <code>, <pre>
- Show templates with their \${} interpolation syntax intact
- Preserve all onclick handlers, href attributes, and data attributes
- Keep <template> and <script> tags as-is

INTERPOLATION RULES:
- Template variables use \${variableName} syntax
- Show these EXACTLY - don't evaluate or replace them
- Preserve expressions like \${content?.replace(...)}
- Keep all JavaScript code in onclick attributes

CRITICAL REQUIREMENTS:
- Output must be "copy-paste ready" HTML
- Include working template literal syntax with \${}
- Show how to inject dynamic content
- Demonstrate both safe and unsafe patterns

This is for EDUCATIONAL purposes - show real-world template patterns!`,
        chat,
        options: { loop: 5 },
        tools: [tGetTemplates],
        client,
      })

      assertSuccess(result)

      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)

      expect(result.iteration.code).toMatchInlineSnapshot(`undefined`)
      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "I will fetch those HTML templates for you.",
          "Here are several examples of HTML templates using template literals. These patterns demonstrate how to handle dynamic data, event handlers, and basic sanitization within your templates.

        <section>
          <h3>1. Component Template (Using <code>&lt;template&gt;</code>)</h3>
          <p>This pattern is ideal for defining reusable UI components that are cloned and populated via JavaScript.</p>
          <pre><code>&lt;template id="user-card"&gt;
          &lt;div class="card" data-user="\${userId}"&gt;
            &lt;h2&gt;\${name}&lt;/h2&gt;
            &lt;p&gt;Email: &lt;a href="mailto:\${email}"&gt;\${email}&lt;/a&gt;&lt;/p&gt;
            &lt;button onclick="deleteUser('\${userId}')"&gt;Delete&lt;/button&gt;
          &lt;/div&gt;
        &lt;/template&gt;</code></pre>
        </section>

        <section>
          <h3>2. Script-Based Template</h3>
          <p>Using <code>text/template</code> prevents the browser from rendering the content immediately, allowing it to be used as a string for interpolation.</p>
          <pre><code>&lt;script type="text/template"&gt;
          &lt;div class="message"&gt;
            &lt;strong&gt;\${author}&lt;/strong&gt; said:
            &lt;blockquote&gt;\${message}&lt;/blockquote&gt;
            &lt;small&gt;Posted at \${timestamp}&lt;/small&gt;
          &lt;/div&gt;
        &lt;/script&gt;</code></pre>
        </section>

        <section>
          <h3>3. Dynamic Content with Logic</h3>
          <p>Template literals allow for inline JavaScript expressions, such as default values (OR operator) and basic string manipulation for safety.</p>
          <pre><code>&lt;div class="dynamic-content"&gt;
          &lt;h1&gt;\${title || 'Untitled'}&lt;/h1&gt;
          &lt;div class="body"&gt;\${content?.replace(/&lt;script&gt;/g, '&amp;lt;script&amp;gt;')}&lt;/div&gt;
          &lt;a href="/edit?id=\${id}&amp;action=update"&gt;Edit&lt;/a&gt;
        &lt;/div&gt;</code></pre>
        </section>

        <div style="background: #f4f4f4; padding: 10px; border-left: 5px solid #ccc;">
          <strong>Educational Note:</strong> 
          Notice how <code>\${userId}</code> is used both in a <code>data-attribute</code> for state management and inside an <code>onclick</code> handler to pass a specific identifier to a function.
        </div>",
        ]
      `)
    })

    it('should handle instructions demanding raw HTML output with complex nesting', async () => {
      const tGetWidget = new Tool({
        name: 'getWidgetHtml',
        description: 'Gets HTML widget code',
        input: z.object({ widgetType: z.string() }),
        output: z.object({ html: z.string(), css: z.string(), js: z.string() }),
        handler: async ({ widgetType }) => {
          return {
            html: `<div class="widget" id="widget-\${id}">
  <header>
    <h3>\${title}</h3>
    <button class="close" onclick="closeWidget('\${id}')">&times;</button>
  </header>
  <main>
    <ul class="items">
      \${items.map(item => \`
        <li data-id="\${item.id}">
          <strong>\${item.name}</strong>
          <span class="price">\$\${item.price.toFixed(2)}</span>
          <button onclick="addToCart('\${item.id}')">Add</button>
        </li>
      \`).join('')}
    </ul>
  </main>
  <footer>
    <p>Total: <strong>\$\${total}</strong></p>
  </footer>
</div>`,
            css: `.widget { border: 1px solid #ccc; }
.widget header { background: linear-gradient(to right, #667eea 0%, #764ba2 100%); }
.widget button:hover { transform: scale(1.1); }
.price::before { content: "$"; }`,
            js: `function closeWidget(id) {
  document.getElementById(\`widget-\${id}\`).remove();
  localStorage.setItem('closed-widgets', JSON.stringify([...closedWidgets, id]));
}

function addToCart(itemId) {
  fetch(\`/api/cart/add?item=\${itemId}\`, { method: 'POST' })
    .then(res => res.json())
    .then(data => alert(\`Added \${data.name}!\`));
}`,
          }
        },
      })

      transcript.push({
        role: 'user',
        content: 'Get me a shopping cart widget',
      })

      const result = await llmz.executeContext({
        instructions: `You are a widget code generator. STRICT REQUIREMENTS:

OUTPUT FORMAT:
- Respond with complete, ready-to-use HTML/CSS/JS code
- Use <div>, <section>, <pre>, <code> tags to structure your response
- Show the HTML with ALL tags preserved: <div>, <header>, <main>, <footer>, <button>, etc.

CODE PRESERVATION:
- Keep ALL template literal syntax: \${}, \`\`, .map(), .join()
- Preserve onclick handlers and event attributes
- Show CSS with gradients, transforms, ::before selectors
- Keep JavaScript with fetch(), template strings, arrow functions
- Maintain proper nesting and indentation

DISPLAY RULES:
- The code should be IMMEDIATELY usable by copy-paste
- Show "raw" source code, not rendered output
- Include working template variable syntax
- Demonstrate real-world patterns with \${interpolation}

IMPORTANT: This is production code - show it EXACTLY as-is with all HTML tags and syntax!`,
        chat,
        options: { loop: 5 },
        tools: [tGetWidget],
        client,
      })

      assertSuccess(result)

      expect(result.iterations.filter((i) => i.isFailed()).length).toBe(0)
      expect(result.iterations.length).toBeGreaterThanOrEqual(2)
      expect(result.iterations.length).toBeLessThanOrEqual(4)
      expect(result.iteration.code).toMatchInlineSnapshot(`undefined`)
      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "Let me generate the shopping cart widget code for you...",
          "Here is the complete production code for the shopping cart widget.

        ### HTML
        <pre><code>&lt;div class="widget" id="widget-\${id}"&gt;
          &lt;header&gt;
            &lt;h3&gt;\${title}&lt;/h3&gt;
            &lt;button class="close" onclick="closeWidget('\${id}')"&gt;&times;&lt;/button&gt;
          &lt;/header&gt;
          &lt;main&gt;
            &lt;ul class="items"&gt;
              \${items.map(item =&gt; \`
                &lt;li data-id="\${item.id}"&gt;
                  &lt;strong&gt;\${item.name}&lt;/strong&gt;
                  &lt;span class="price"&gt;$\${item.price.toFixed(2)}&lt;/span&gt;
                  &lt;button onclick="addToCart('\${item.id}')"&gt;Add&lt;/button&gt;
                &lt;/li&gt;
              \`).join('')}
            &lt;/ul&gt;
          &lt;/main&gt;
          &lt;footer&gt;
            &lt;p&gt;Total: &lt;strong&gt;$\${total}&lt;/strong&gt;&lt;/p&gt;
          &lt;/footer&gt;
        &lt;/div&gt;</code></pre>

        ### CSS
        <pre><code>.widget { border: 1px solid #ccc; }
        .widget header { background: linear-gradient(to right, #667eea 0%, #764ba2 100%); }
        .widget button:hover { transform: scale(1.1); }
        .price::before { content: "$"; }</code></pre>

        ### JavaScript
        <pre><code>function closeWidget(id) {
          document.getElementById(\`widget-\${id}\`).remove();
          localStorage.setItem('closed-widgets', JSON.stringify([...closedWidgets, id]));
        }

        function addToCart(itemId) {
          fetch(\`/api/cart/add?item=\${itemId}\`, { method: 'POST' })
            .then(res => res.json())
            .then(data => alert(\`Added \${data.name}!\`));
        }</code></pre>",
        ]
      `)
    })
  })
})
