import { z } from '@bpinternal/zui'
import { beforeAll, beforeEach, afterAll, assert, describe, expect, it } from 'vitest'
import * as llmz from '../src/runtime/execute.js'
import { Tool } from '../src/tool.js'
import { Exit } from '../src/exit.js'
import { ThinkSignal } from '../src/errors.js'
import { ExecutionResult, SuccessExecutionResult } from '../src/result.js'
import { getCachedCognitiveClient } from './__tests__/index.js'
import { Component } from '../src/component.js'
import { Chat, MessageDelta } from '../src/chat.js'
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

        Here is an example of a component that manages state for a user profile:

        \`\`\`jsx
        import React, { useState, useEffect } from 'react';

        function UserProfile({ userId }) {
          // Initialize state using the useState hook
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

        ### Key Concepts:
        *   **\`useState\`**: This hook returns a pair: the current state value and a function that lets you update it.
        *   **\`useEffect\`**: Used for side effects, such as fetching data when the component mounts or when a specific dependency (like \`userId\`) changes.
        *   **JSX Expressions**: Use curly braces \`{}\` to embed JavaScript expressions directly within your HTML-like markup.
        *   **Updating State**: Always use the setter function (e.g., \`setUser\`) to update state rather than mutating the state variable directly.

        Does this help, or would you like to see a simpler example, such as a counter?",
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
          "Let me look up the documentation on HTML forms for you...",
          "To create an HTML form, you use the \`<form>\` element, which acts as a container for various input elements like text fields, passwords, and submit buttons.

        Here is a complete example of a form that includes basic validation, styling for valid/invalid inputs, and a simple JavaScript check:

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

        ### Key Components Used:
        *   **\`<form>\`**: The main wrapper. The \`action\` attribute defines where to send the data, and \`method="POST"\` is used for secure data submission.
        *   **\`<input type="text">\`**: A standard text field. The \`required\` attribute ensures the field isn't empty, and \`pattern\` uses a Regular Expression to validate the email format.
        *   **\`<input type="password">\`**: Masks the characters entered by the user.
        *   **\`<button type="submit">\`**: Triggers the form submission.
        *   **CSS Pseudo-classes**: \`:invalid\` and \`:valid\` are used to provide immediate visual feedback to the user based on the input constraints.",
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
          "Advanced TypeScript types allow you to create highly flexible and type-safe code by manipulating types dynamically. Based on the documentation, here are some of the key advanced features:

        ### 1. Generic Constraints
        Generic constraints use the \`extends\` keyword to limit what types a generic parameter can be. For example, ensuring a type has at least an \`id\` property:
        \`\`\`typescript
        class ApiClient<T extends { id: string }> {
          // T must be an object with a string id
        }
        \`\`\`

        ### 2. Conditional Types
        Conditional types allow you to choose one type over another based on a condition, similar to a ternary operator in JavaScript:
        \`\`\`typescript
        // If T[K] is a string, return string; otherwise, return number
        transform<K extends keyof T>(key: K): T[K] extends string ? string : number {
          return this.data[key] as any;
        }
        \`\`\`

        ### 3. Mapped Types & Template Literal Types
        Mapped types allow you to create new types based on existing ones. When combined with template literal types, you can dynamically generate property names:
        \`\`\`typescript
        type EventMap = {
          click: MouseEvent;
          keypress: KeyboardEvent;
        };

        // Generates types like 'onClick' and 'onKeypress'
        type EventHandlers = {
          [K in keyof EventMap as \`on\${Capitalize<K>}\`]: (e: EventMap[K]) => void;
        };
        \`\`\`

        ### 4. Template Literal Inference
        You can use the \`infer\` keyword within template literal types to extract specific parts of a string type:
        \`\`\`typescript
        type RouteParams<T extends string> = T extends \`\${infer Start}/:\${infer Param}/\${infer Rest}\`
          ? { [K in Param]: string } & RouteParams<\`\${Start}/\${Rest}\`>
          : {};
        \`\`\`

        ### 5. Decorators
        Decorators provide a way to add annotations and a meta-programming syntax for class declarations and members:
        \`\`\`typescript
        function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
          // Logic to log method calls
        }

        class ApiClient {
          @Log
          async fetch(id: string) { /* ... */ }
        }
        \`\`\`

        Would you like to dive deeper into any of these specific concepts?",
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
          "Let me look up the documentation on how to write SQL queries for you...",
          "Writing SQL queries involves using a structured language to communicate with a database. Depending on what you want to do (retrieve, insert, or manipulate data), the syntax varies.

        ### 1. Basic Data Retrieval (\`SELECT\`)
        The most common operation is the \`SELECT\` statement, used to fetch data from a table.

        **Example: Basic Selection**
        \`\`\`sql
        SELECT name, email 
        FROM users 
        WHERE created_at >= '2024-01-01' 
          AND name != 'Admin';
        \`\`\`

        ### 2. Advanced Queries
        For more complex data analysis, you can use **Common Table Expressions (CTEs)** and **Window Functions** to organize your data before the final selection.

        **Example: Ranking Users**
        \`\`\`sql
        WITH ranked_users AS (
          SELECT
            id,
            name,
            email,
            created_at,
            ROW_NUMBER() OVER (PARTITION BY DATE(created_at) ORDER BY id) as daily_rank
          FROM users
          WHERE email LIKE '%@gmail.com'
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
        To add new records to a table, use the \`INSERT INTO\` statement. Note that strings must be enclosed in single quotes.

        **Example: Inserting Records**
        \`\`\`sql
        INSERT INTO messages (content, metadata) VALUES
          ('User said: "Hello!"', '{"sender": "user", "timestamp": "2024-01-01"}'),
          ('It''s a nice day', '{"type": "greeting"}');
        \`\`\`
        *Tip: To include a single quote inside a string (like in "It's"), use two single quotes (\`''\`) to escape it.*

        ### 4. Working with JSON
        Many modern databases (like PostgreSQL) allow you to query JSON data directly using special operators.

        **Example: JSON Extraction**
        \`\`\`sql
        SELECT
          data->>'name' as name,
          data->'address'->>'city' as city
        FROM documents
        WHERE data @> '{"status": "active"}';
        \`\`\`

        ### Quick Syntax Reference:
        *   **Strings**: Use single quotes (e.g., \`'text'\`).
        *   **Identifiers**: Use double quotes for column or table names if they contain spaces or reserved words (e.g., \`"column_name"\`).
        *   **Comments**: Use \`--\` for single-line comments or \`/* ... */\` for multi-line blocks.
        *   **Operators**: 
            *   \`!=\` : Not equal to
            *   \`>=\` / \`<=\` : Greater than or equal / Less than or equal
            *   \`->\` / \`->>\` : JSON object/text extraction

        Would you like me to explain a specific part of this syntax or help you write a query for a particular goal?",
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
          "Let me look up the documentation on how to write Bash scripts for you...",
          "Writing Bash scripts allows you to automate repetitive tasks in a Unix-like environment. Here is a guide based on the documentation.

        ### 1. The Shebang
        Every Bash script should start with a "shebang" line. This tells the system which interpreter to use to execute the script.
        \`\`\`bash
        #!/bin/bash
        \`\`\`

        ### 2. Basic Concepts
        *   **Variables**: Defined without spaces around the \`=\` sign. Use \`$\` to access them.
            *   Example: \`NAME="John Doe"\` $\\rightarrow$ \`echo $NAME\`
        *   **Command Substitution**: Use \`$(command)\` to save the output of a command into a variable.
            *   Example: \`TIMESTAMP=$(date +%Y-%m-%d)\`
        *   **Quotes**: Use double quotes (\`"\`) if you want variables to be expanded, and single quotes (\`'\`) to treat everything as literal text.

        ### 3. Control Structures
        **Conditionals**: Use \`if\` statements with double brackets \`[[ ]]\` for more robust testing.
        \`\`\`bash
        if [[ -f "file.txt" ]]; then
          echo "The file exists."
        fi
        \`\`\`

        **Loops**: Use \`for\` loops to iterate over lists or arrays.
        \`\`\`bash
        FILES=("file1.txt" "file2.txt")
        for file in "\${FILES[@]}"; do
          echo "Processing $file"
        done
        \`\`\`

        ### 4. Putting it all together
        Here is a comprehensive example showing functions, error handling, and string manipulation:

        \`\`\`bash
        #!/bin/bash

        # Variable and string manipulation
        NAME="John Doe"
        echo "Hello \${NAME}!"
        echo "Uppercase: \${NAME^^}"

        # A function to process files with error handling
        process_file() {
          local file="$1"
          if [[ ! -r "$file" ]]; then
            echo "Error: Cannot read '$file'" >&2
            return 1
          fi
          echo "Success: $file"
        }

        # Using the function
        process_file "test.txt"
        \`\`\`

        ### 5. Running your script
        To run your script, you first need to give it execution permissions:
        1. \`chmod +x myscript.sh\`
        2. \`./myscript.sh\`

        Do you have a specific task you are trying to automate with a script?",
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
          "Let me look up the documentation on Python string formatting for you...",
          "Python offers several ways to format strings, with **f-strings** being the most modern and preferred method. Here are the primary ways to handle string formatting:

        ### 1. F-Strings (Formatted String Literals)
        Introduced in Python 3.6, f-strings are fast and easy to read. You simply prefix the string with \`f\` and use curly braces \`{}\` to embed expressions.

        \`\`\`python
        name = "Alice"
        age = 30
        # Basic interpolation
        print(f"Hello {name}! You are {age} years old.")

        # Expressions inside braces
        print(f"Next year: {age + 1}")
        print(f"Uppercase: {name.upper()}")
        \`\`\`

        ### 2. Format Specifiers
        You can control how values are displayed (like decimal places or padding) using a colon \`:\` inside the braces.

        \`\`\`python
        price = 19.99
        print(f"Price: \${price:.2f}")      # 2 decimal places
        print(f"Hex: {255:#x}")            # Hexadecimal format
        print(f"Percentage: {0.846:.1%}")  # Percentage format
        \`\`\`

        ### 3. The \`.format()\` Method
        This is useful for templates where the values are provided later.

        \`\`\`python
        template = "Hello {name}, you have {count} messages"
        print(template.format(name="Charlie", count=5))
        \`\`\`

        ### 4. Special String Types
        *   **Raw Strings (\`r""\`)**: Used primarily for regular expressions or Windows file paths to treat backslashes as literal characters.
            \`\`\`python
            pattern = r"\\d{3}-\\d{3}-\\d{4}"
            path = r"C:\\Users\\Name\\Documents"
            \`\`\`
        *   **Triple-Quoted Strings (\`""" """\`)**: Used for multi-line strings.
            \`\`\`python
            sql_query = """
            SELECT * FROM users
            WHERE name = 'Alice'
            """
            \`\`\`

        ### Summary Table
        | Type | Syntax | Best Use Case |
        | :--- | :--- | :--- |
        | **F-String** | \`f"Text {var}"\` | Most general purpose formatting |
        | **.format()** | \`"Text {}".format(var)\` | Reusable templates |
        | **Raw String** | \`r"C:\\path"\` | Regex and file paths |
        | **Triple Quote**| \`"""Text"""\` | Multi-line text/docs |",
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
          "Let me find the documentation on how to work with JSON for you...",
          "To work with JSON, you need to follow a specific structure of key-value pairs and arrays. Here is a comprehensive example and a guide on the rules:

        ### JSON Structure Example
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

        ### Key Escaping Rules
        When working with strings in JSON, certain characters must be escaped using a backslash (\`\\\`):

        *   **Quotes**: Use \`\\"\` to include a double quote inside a string.
        *   **Backslash**: Use \`\\\\\` to represent a single backslash.
        *   **Control Characters**: 
            *   \`\\n\` for a newline
            *   \`\\t\` for a tab
            *   \`\\r\` for carriage return
        *   **Unicode**: Use \`\\uXXXX\` (where XXXX is the hex code) to represent unicode characters.

        Do you have a specific project or language you are using JSON with?",
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
          "CSS selectors are used to "find" (or select) the HTML elements you want to style. They can range from simple type selectors to complex combinations.

        ### 1. Basic Selectors
        While the advanced documentation focuses on complex patterns, the foundation consists of:
        - **Element Selector**: Selects elements based on the element name.
          \`\`\`css
          p { color: red; } /* Selects all <p> elements */
          \`\`\`
        - **Class Selector**: Selects elements with a specific class attribute.
          \`\`\`css
          .button { background: blue; } /* Selects all elements with class="button" */
          \`\`\`
        - **ID Selector**: Selects a unique element with a specific ID.
          \`\`\`css
          #header { height: 100px; } /* Selects the element with id="header" */
          \`\`\`

        ### 2. Advanced Selectors
        For more precise targeting, you can use these advanced patterns:

        **Attribute Selectors**
        Target elements based on their attributes or the value of those attributes:
        - \`a[href^="https://"]\`: Selects links starting with "https://".
        - \`a[href$=".pdf"]\`: Selects links ending with ".pdf".
        - \`div[data-theme~="dark"]\`: Selects elements where the attribute contains the word "dark".

        **Pseudo-classes and Pseudo-elements**
        Target elements based on their state or specific parts of the element:
        - \`:nth-child(2n+1)\`: Selects every odd element.
        - \`:not(.active)\`: Selects elements that do *not* have the class "active".
        - \`::first-letter\`: Styles only the first letter of a block of text.
        - \`::before\` / \`::after\`: Inserts content before or after an element.

        **Combinators**
        Define the relationship between selectors:
        - \`nav > ul\`: The child combinator (selects \`ul\` that is a direct child of \`nav\`).
        - \`div.container:has(> img)\`: The \`:has()\` relational pseudo-class (selects the container only if it contains an image).

        ### Example: Putting it all together
        \`\`\`css
        /* Select a link inside a list item that is NOT active, when hovered */
        nav > ul > li:not(.active) a:hover {
          text-decoration: underline;
          color: var(--primary-color);
        }
        \`\`\`

        Do you have a specific HTML structure you are trying to target?",
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
          "Let me look up the Markdown syntax documentation for you...",
          "Here is a guide on how to use Markdown syntax:

        ### Headings
        Use the \`#\` symbol followed by a space. More \`#\` symbols create smaller headings.
        \`# Heading 1\`
        \`## Heading 2\`
        \`### Heading 3\`

        ### Text Formatting
        - **Bold**: Wrap text in double asterisks \`**bold**\` or double underscores \`__bold__\`.
        - *Italic*: Wrap text in single asterisks \`*italic*\` or single underscores \`_italic_\`.
        - ~~Strikethrough~~: Wrap text in double tildes \`~~strikethrough~~\`.
        - \`Inline Code\`: Wrap text in single backticks \`\` \`code\` \`\`.

        ### Lists
        **Ordered Lists**:
        1. First item
        2. Second item

        **Unordered Lists**:
        - Item A
        - Item B
          - Nested Item

        ### Links and Images
        - **Links**: \`[Link Text](https://example.com "Optional Title")\`
        - **Images**: \`![Alt Text](https://example.com/image.png)\`
        - **Auto-links**: \`<https://example.com>\`

        ### Code Blocks
        For multi-line code blocks, use triple backticks. You can specify the language for syntax highlighting:

        \`\`\`javascript
        const greeting = \`Hello World!\`;
        console.log(greeting);
        \`\`\`

        ### Blockquotes
        Use the \`>\` symbol at the start of the line:
        > This is a blockquote.
        > > This is a nested blockquote.

        ### Tables
        Use pipes \`|\` and dashes \`-\` to create tables:

        | Header 1 | Header 2 |
        |----------|----------|
        | Cell 1    | Cell 2    |
        | Cell 3    | Cell 4    |

        ### Special Characters
        If you need to display a character that is normally used for formatting (like \`*\` or \`#\`), escape it with a backslash \`\\\`. For example: \`\\*not italic\\*\`.

        Do you have any specific questions about these features?",
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
          "<p>Here are the search results I found for you:</p>
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
          "Let me fetch that content for you...",
          "<div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px;">
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
          <section>
            <p><em>Let me find some <strong>HTML templating</strong> examples for you...</em></p>
          </section>
        </div>",
          "<div>
          <section>
            <p>Here are the <strong>HTML templating</strong> examples you requested:</p>
            <article>
              <div class="example">
          <h3>Example 1: Basic Usage</h3>
          <code>const html = '&lt;div&gt;{content}&lt;/div&gt;';</code>
          <p>This creates a <strong>template string</strong> with HTML.</p>
        </div>
            </article>
            <article>
              <section>
          <h3>Example 2: JSX Component</h3>
          <pre>
        function Button({ label }) {
          return &lt;button onClick={() =&gt; alert(\`Clicked \${label}!\`)}&gt;{label}&lt;/button&gt;;
        }
          </pre>
          <p>Notice the <em>curly braces</em> for expressions: <code>{label}</code></p>
        </section>
            </article>
            <article>
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
            </article>
          </section>
        </div>",
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
          "Let me fetch some HTML templates with template literals for you...",
          "Here are several real-world examples of HTML templates using template literal syntax. These are designed to be copy-paste ready for your educational use.

        <section>
          <h3>1. Component-Based Template</h3>
          <p>This pattern is common for user interfaces where data is injected into a reusable card component.</p>
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
          <p>Using <code>text/template</code> prevents the browser from rendering the content immediately, allowing JavaScript to clone and populate it.</p>
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
          <p>This demonstrates safe patterns, such as providing fallback values (OR operator) and basic sanitization (replace method) to prevent XSS attacks.</p>
          <pre><code>&lt;div class="dynamic-content"&gt;
          &lt;h1&gt;\${title || 'Untitled'}&lt;/h1&gt;
          &lt;div class="body"&gt;\${content?.replace(/&lt;script&gt;/g, '&amp;lt;script&amp;gt;')}&lt;/div&gt;
          &lt;a href="/edit?id=\${id}&amp;action=update"&gt;Edit&lt;/a&gt;
        &lt;/div&gt;</code></pre>
        </section>

        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc;">
          <strong>Educational Tip:</strong> Always remember to sanitize user-provided data (like the <code>.replace()</code> example above) before injecting it into your HTML to ensure the application remains secure.
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
          "Let me fetch the shopping cart widget code for you...",
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

describe('message streaming', { retry: 0, timeout: 60_000 }, () => {
  const StreamMarkdown = new Component({
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

  it('streams message chunks to the client as they arrive from cognitive', async () => {
    const deltas: MessageDelta[] = []
    const messagesSent: string[] = []

    const transcript = new TranscriptArray([
      {
        role: 'user',
        content: 'Please tell me a short story (about two paragraphs) about a brave corgi named Biscuit.',
      },
    ])

    const chat = new Chat({
      transcript,
      components: [StreamMarkdown],
      handler: async (component) => {
        messagesSent.push(component.children.map((c) => (typeof c === 'string' ? c : '')).join(''))
      },
      onMessageDelta: (delta) => {
        deltas.push(delta)
      },
    })

    const result = await llmz.executeContext({
      instructions: 'Answer the user request directly.',
      chat,
      options: { loop: 3 },
      client,
    })

    assertSuccess(result)
    expect(messagesSent.length).toBeGreaterThanOrEqual(1)

    // The message body arrived progressively, split across many stream chunks
    expect(deltas.length).toBeGreaterThan(1)

    // Each streamed message is fully reconstructible from its chunks and matches
    // the final message delivered to the handler
    const deltasById = new Map<string, MessageDelta[]>()
    for (const delta of deltas) {
      deltasById.set(delta.id, [...(deltasById.get(delta.id) ?? []), delta])
    }
    for (const [, messageDeltas] of deltasById) {
      const joined = messageDeltas.map((d) => d.delta).join('')
      expect(messageDeltas.at(-1)!.content).toBe(joined)
      expect(messagesSent).toContain(joined)
    }

    // Token timings are recorded on the iteration
    const llmMeta = result.iterations[0]!.llm
    expect(llmMeta?.time_to_first_token).toBeTypeOf('number')
    expect(llmMeta?.time_to_last_token).toBeTypeOf('number')
    expect(llmMeta!.time_to_first_token!).toBeGreaterThanOrEqual(0)
    expect(llmMeta!.time_to_last_token!).toBeGreaterThanOrEqual(llmMeta!.time_to_first_token!)

    // Token usage is measured per iteration and aggregated on the result
    const usage = result.iterations[0]!.tokens!
    expect(usage.input).toBeGreaterThan(0)
    expect(usage.output).toBeGreaterThan(0)
    expect(usage.limit).toBeGreaterThan(0)
    expect(usage.context.total).toBeLessThan(usage.limit!)
    expect(usage.context.framework).toBeGreaterThan(0)
    expect(usage.context.instructions).toBeGreaterThan(0)
    expect(usage.context.transcript).toBeGreaterThan(0)
    expect(usage.context.protocol).toBeGreaterThan(0)
    expect(result.tokens.total).toBe(usage.total)
  })
})
