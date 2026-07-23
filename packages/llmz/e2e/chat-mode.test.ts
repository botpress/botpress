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
          "Let me look up the documentation for creating React components with state for you...",
          "To create a React component with state, you should use the \`useState\` hook. This allows you to add local state to functional components.

        Here is an example of a component that manages state for a user profile:

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

        ### Key Concepts:
        - **\`useState\`**: This hook returns a pair: the current state value and a function that lets you update it. For example, \`const [user, setUser] = useState(null);\` initializes the state as \`null\`.
        - **\`useEffect\`**: This hook is used for side effects, such as fetching data from an API when the component mounts or when a dependency (like \`userId\`) changes.
        - **JSX Expressions**: Use curly braces \`{}\` to embed JavaScript expressions (like variables or function calls) directly into your HTML-like markup.

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
          "Let me look up the documentation on how to create HTML forms for you...",
          "To create an HTML form, you use the \`<form>\` element, which acts as a container for various input elements like text fields, passwords, and submit buttons.

        Here is a comprehensive example that includes basic structure, built-in validation, and a bit of CSS for visual feedback:

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
        - **\`<form>\`**: The main container. The \`action\` attribute specifies where to send the form data, and \`method="POST"\` is used for secure data submission.
        - **\`<input type="text">\`**: Creates a single-line text field. The \`required\` attribute ensures the field isn't left empty.
        - **\`pattern\`**: Uses a Regular Expression to validate the format (in this case, ensuring the input looks like an email address).
        - **\`<input type="password">\`**: Masks the characters entered for security.
        - **\`<button type="submit">\`**: The button that triggers the form submission.
        - **CSS Pseudo-classes**: \`input:invalid\` and \`input:valid\` allow you to provide immediate visual feedback to the user based on the validation rules.

        Would you like to know more about specific input types or how to handle the form data on a server?",
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
          "Advanced TypeScript types allow you to create highly flexible and type-safe code by leveraging the type system to perform logic and transformations. Based on the documentation, here are some of the key advanced features:

        ### 1. Generic Constraints
        Generic constraints allow you to limit the types that a generic type parameter can accept using the \`extends\` keyword. This ensures that the type passed in has specific properties.

        \`\`\`typescript
        class ApiClient<T extends { id: string }> {
          async fetch(id: string): Promise<T | null> {
            const response = await fetch(\`/api/items/\${id}\`);
            return response.json();
          }
        }
        \`\`\`

        ### 2. Conditional Types
        Conditional types allow you to choose one type over another based on a condition, similar to an \`if/else\` statement for types.

        \`\`\`typescript
        // If T[K] is a string, return string; otherwise, return number
        transform<K extends keyof T>(
          key: K
        ): T[K] extends string ? string : number {
          return this.data[key] as any;
        }
        \`\`\`

        ### 3. Mapped Types and Template Literals
        Mapped types allow you to create a new type based on another existing type. Combined with template literal types, you can dynamically generate property names.

        \`\`\`typescript
        type EventMap = {
          click: MouseEvent;
          keypress: KeyboardEvent;
        };

        // Generates: { onClick: (e: MouseEvent) => void; onKeypress: (e: KeyboardEvent) => void; }
        type EventHandlers = {
          [K in keyof EventMap as \`on\${Capitalize<K>}\`]: (e: EventMap[K]) => void;
        };
        \`\`\`

        ### 4. Template Literal Types with Inference
        You can use the \`infer\` keyword within template literal types to "extract" parts of a string type, which is incredibly useful for parsing routes or complex string patterns.

        \`\`\`typescript
        type RouteParams<T extends string> = T extends \`\${infer Start}/:\${infer Param}/\${infer Rest}\`
          ? { [K in Param]: string } & RouteParams<\`\${Start}/\${Rest}\`>
          : {};
        \`\`\`

        ### 5. Decorators
        Decorators are a special kind of declaration that can be attached to a class, method, or property to modify its behavior.

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
          "I can help you with that! Since SQL is a broad language, I'll start by retrieving some general documentation on how to write queries to give you a solid foundation.",
          "Writing SQL queries involves using specific keywords to communicate with a database. Depending on what you want to do, the syntax varies. Here is a guide based on common operations:

        ### 1. Basic Data Retrieval (\`SELECT\`)
        The most common task is retrieving data. You specify which columns you want and which table they come from.

        \`\`\`sql
        SELECT name, email 
        FROM users 
        WHERE created_at >= '2024-01-01' 
          AND name != 'Admin';
        \`\`\`

        ### 2. Advanced Queries (CTEs and Window Functions)
        For more complex analysis, you can use **Common Table Expressions (CTEs)** using the \`WITH\` clause to create temporary result sets, and **Window Functions** (like \`ROW_NUMBER()\`) to perform calculations across a set of table rows.

        **Example:**
        \`\`\`sql
        WITH ranked_users AS (
          SELECT
            id,
            name,
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
        To add new records, use the \`INSERT INTO\` statement. Note that strings must be enclosed in single quotes.

        \`\`\`sql
        INSERT INTO messages (content, metadata) VALUES
          ('User said: "Hello!"', '{"sender": "user"}'),
          ('It''s a nice day', '{"type": "greeting"}');
        \`\`\`

        ### 4. Working with JSON (PostgreSQL)
        Many modern databases support JSON. In PostgreSQL, you can use special operators:
        - \`->>\` : Get JSON object field as text.
        - \`@>\` : Check if the JSON column contains a specific JSON object.

        \`\`\`sql
        SELECT
          data->>'name' as name,
          data->'address'->>'city' as city
        FROM documents
        WHERE data @> '{"status": "active"}';
        \`\`\`

        ### Quick Syntax Tips:
        - **Strings**: Always use single quotes (\`'text'\`).
        - **Escaping**: To include a single quote inside a string, use two single quotes (\`''\`).
        - **Identifiers**: Use double quotes (\`"column_name"\`) if your column name contains spaces or is a reserved keyword.
        - **Comments**: Use \`--\` for single-line comments or \`/* ... */\` for multi-line comments.

        Would you like to see examples for a specific database (like MySQL or SQLite) or learn about a particular operation like \`JOIN\` or \`UPDATE\`?",
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
          "Writing a Bash script is a great way to automate repetitive tasks in a Unix-like environment. Here is a comprehensive guide based on the documentation.

        ### 1. Getting Started
        Every Bash script should start with a **shebang** line. This tells the system which interpreter to use to execute the file.

        \`\`\`bash
        #!/bin/bash
        \`\`\`

        ### 2. Basic Concepts

        **Variables and Strings**
        You can define variables without spaces around the \`=\` sign. Use \`\${}\` for parameter expansion to avoid ambiguity.
        \`\`\`bash
        NAME="John Doe"
        echo "Hello \${NAME}!"
        # String manipulation
        echo "Uppercase: \${NAME^^}"  # Converts to uppercase
        echo "Lowercase: \${NAME,,}"  # Converts to lowercase
        \`\`\`

        **Command Substitution**
        Use \`$(command)\` to capture the output of a command into a variable.
        \`\`\`bash
        TIMESTAMP=$(date +%Y-%m-%d)
        LINES=$(wc -l < input.txt)
        \`\`\`

        ### 3. Control Flow

        **Conditionals**
        Use \`[[ ... ]]\` for tests. Common operators include \`-f\` (file exists) and \`-z\` (string is empty).
        \`\`\`bash
        if [[ -f "config.txt" ]]; then
          echo "Configuration file found."
        else
          echo "Configuration file missing."
        fi
        \`\`\`

        **Loops**
        You can iterate over lists or arrays using a \`for\` loop.
        \`\`\`bash
        FILES=("file1.txt" "file2.txt" "file3.txt")
        for file in "\${FILES[@]}"; do
          echo "Processing: $file"
        done
        \`\`\`

        ### 4. Advanced Techniques

        **Functions**
        Functions help organize your code and handle errors locally.
        \`\`\`bash
        process_file() {
          local file="$1"
          if [[ ! -r "$file" ]]; then
            echo "Error: Cannot read '$file'" >&2
            return 1
          fi
          echo "Success: $file"
        }
        \`\`\`

        **Here Documents**
        Use \`<< 'EOF'\` to write multi-line text to a file without expanding variables.
        \`\`\`bash
        cat << 'EOF' > output.txt
        This is a here document.
        Variables like $HOME are not expanded here.
        EOF
        \`\`\`

        ### 5. Running Your Script
        1. Save your code to a file, e.g., \`myscript.sh\`.
        2. Make the script executable: \`chmod +x myscript.sh\`.
        3. Run it: \`./myscript.sh\`.

        Would you like help writing a specific script for a task you have in mind?",
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
          "Let me look up the documentation for Python string formatting for you...",
          "Python offers several ways to format strings. The most modern and preferred method is using **f-strings**, but there are other useful types depending on your needs.

        ### 1. F-Strings (Formatted String Literals)
        Introduced in Python 3.6, f-strings are the most readable and efficient way to format strings. You prefix the string with \`f\` and use curly braces \`{}\` to embed expressions.

        \`\`\`python
        name = "Alice"
        age = 30

        # Simple interpolation
        print(f"Hello {name}! You are {age} years old.")

        # Expressions inside braces
        print(f"Next year: {age + 1}")
        print(f"Uppercase: {name.upper()}")

        # Format specifiers (e.g., 2 decimal places)
        price = 19.99
        print(f"Price: \${price:.2f}")
        print(f"Percentage: {0.846:.1%}")
        \`\`\`

        ### 2. The \`.format()\` Method
        This is useful when the string template is defined separately from the values being inserted.

        \`\`\`python
        template = "Hello {name}, you have {count} messages"
        result = template.format(name="Charlie", count=5)
        print(result)
        \`\`\`

        ### 3. Raw Strings
        Prefixing a string with \`r\` tells Python to treat backslashes as literal characters rather than escape characters. This is essential for regular expressions or Windows file paths.

        \`\`\`python
        # Using raw strings for regex patterns
        pattern = r"\\d{3}-\\d{3}-\\d{4}"
        path = r"C:\\Users\\Documents"
        \`\`\`

        ### 4. Triple-Quoted Strings
        Use \`"""\` or \`'''\` for strings that span multiple lines.

        \`\`\`python
        sql_query = """
        SELECT *
        FROM users
        WHERE name = 'Alice'
          AND age > 30
        """
        \`\`\`

        ### Summary Table
        | Type | Syntax | Best Use Case |
        | :--- | :--- | :--- |
        | **F-string** | \`f"..."\` | General purpose, high performance, readability. |
        | **.format()** | \`"{}".format()\` | Templates defined outside the immediate context. |
        | **Raw string** | \`r"..."\` | Regular expressions and system paths. |
        | **Triple Quote**| \`"""..."""\` | Multi-line strings and docstrings. |

        Would you like to see how to handle more complex formatting, such as alignment or padding?",
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
          "Let me find the documentation and examples for working with JSON for you...",
          "Working with JSON involves following a specific structure and set of escaping rules. Here is a comprehensive example and a guide on how to format your data.

        ### JSON Structure Example
        JSON is composed of key-value pairs and arrays. Here is an example showing various data types:

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

        ### Key Rules for Working with JSON

        **1. Data Types**
        - **Strings**: Must be wrapped in double quotes (\`"string"\`).
        - **Numbers**: Can be integers or floating-point (e.g., \`42.5e-10\`).
        - **Booleans**: Use \`true\` or \`false\` (lowercase).
        - **Null**: Use \`null\` (lowercase).
        - **Arrays**: Ordered lists wrapped in square brackets \`[...]\`.
        - **Objects**: Sets of key-value pairs wrapped in curly braces \`{...}\`.

        **2. Escaping Special Characters**
        To include characters that would otherwise break the JSON structure, use the following escape sequences:
        - **Double Quotes**: Use \`\\"\`
        - **Backslash**: Use \`\\\\\`
        - **Newlines**: Use \`\\n\`
        - **Tabs**: Use \`\\t\`
        - **Unicode**: Use \`\\uXXXX\` (e.g., \`\\u0041\` for 'A')

        Do you have a specific use case or a piece of data you need help formatting into JSON?",
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
          "CSS selectors are used to "find" (or select) the HTML elements you want to style. They can range from simple element selectors to complex combinations.

        ### 1. Basic Selectors
        *   **Element Selector**: Targets elements by their tag name.
            \`\`\`css
            p { color: black; } /* Targets all <p> elements */
            \`\`\`
        *   **Class Selector**: Targets elements with a specific class attribute (starts with a \`.\`).
            \`\`\`css
            .button { background: blue; } /* Targets all elements with class="button" */
            \`\`\`
        *   **ID Selector**: Targets a unique element with a specific ID (starts with a \`#\`).
            \`\`\`css
            #header { height: 100px; } /* Targets the element with id="header" */
            \`\`\`

        ### 2. Advanced Selectors
        For more precise targeting, you can use advanced selectors:

        *   **Attribute Selectors**: Target elements based on their attributes.
            *   \`a[href^="https://"]\`: Starts with "https://"
            *   \`a[href$=".pdf"]\`: Ends with ".pdf"
            *   \`div[data-theme~="dark"]\`: Contains the word "dark" in a space-separated list.

        *   **Pseudo-classes & Pseudo-elements**: Target elements in a specific state or specific parts of an element.
            *   \`:nth-child(2n+1)\`: Selects odd-numbered children.
            *   \`:not(.active)\`: Selects elements that do **not** have the "active" class.
            *   \`::first-letter\`: Styles only the first letter of a block of text.
            *   \`::before\` / \`::after\`: Inserts content before or after an element.

        *   **Combinators**: Define the relationship between elements.
            *   \`div > p\`: Child selector (direct children only).
            *   \`div p\`: Descendant selector (any child, grandchild, etc.).
            *   \`div + p\`: Adjacent sibling selector (the very next element).
            *   \`div ~ p\`: General sibling selector (any sibling following the element).

        ### 3. Complex Example
        You can chain these together for very specific targeting:
        \`\`\`css
        /* Target links inside list items that are NOT active, 
           specifically within a nav element, when hovered */
        nav > ul > li:not(.active) a:hover { 
          text-decoration: underline; 
        }

        /* Target a container only if it contains an image */
        div.container:has(> img) { 
          padding: 20px; 
        }
        \`\`\`

        Would you like to see how to use these selectors with a specific HTML structure?",
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
        **Unordered Lists**: Use \`-\`, \`*\`, or \`+\` followed by a space.
        - Item 1
        - Item 2

        **Ordered Lists**: Use numbers followed by a period.
        1. First item
        2. Second item

        ### Links and Images
        - **Links**: \`[Link Text](https://example.com "Optional Title")\`
        - **Images**: \`![Alt Text](https://example.com/image.png)\`

        ### Code Blocks
        Use triple backticks (\`\`\`) followed by an optional language identifier for syntax highlighting:

        \`\`\`javascript
        const greeting = \`Hello world!\`;
        \`\`\`

        ### Blockquotes
        Use the \`>\` symbol:
        > This is a blockquote.

        ### Tables
        Use pipes \`|\` and dashes \`-\` to create columns and headers:

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
          "<p>Here are the results I found for you:</p>
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
          "<div class="article">
          <h1>Article Title &amp; Subtitle</h1>
          <p>This article discusses <strong>important topics</strong> like:</p>
          <ul>
            <li>How to use &lt;script&gt; tags safely</li>
            <li>Understanding &quot;quoted&quot; text</li>
            <li>Working with &apos;single quotes&apos;</li>
            <li>Math: 5 &gt; 3 &amp;&amp; 2 &lt; 4</li>
          </ul>
          <a href="/read?id=123&amp;ref=home">Read more &rarr;</a>
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
          <p><strong>Let me find some <em>HTML templating</em> examples for you...</strong></p>
        </div>",
          "<div class="tutorial-container">
          <section>
            <p><strong>Here are the requested code examples for HTML templating:</strong></p>
            <div class="examples-wrapper">
              <div class="example">
          <h3>Example 1: Basic Usage</h3>
          <code>const html = '&lt;div&gt;{content}&lt;/div&gt;';</code>
          <p>This creates a <strong>template string</strong> with HTML.</p>
        </div>
              <section>
          <h3>Example 2: JSX Component</h3>
          <pre>
        function Button({ label }) {
          return &lt;button onClick={() =&gt; alert(\`Clicked \${label}!\`)}&gt;{label}&lt;/button&gt;;
        }
          </pre>
          <p>Notice the <em>curly braces</em> for expressions: <code>{label}</code></p>
        </section>
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
          "Let me fetch some HTML templates for you...",
          "Here are several real-world examples of HTML templates using template literal syntax. These patterns demonstrate how to handle dynamic IDs, conditional defaults, and basic sanitization.

        <section>
          <h3>1. Component Template</h3>
          <p>This pattern uses a <code>&lt;template&gt;</code> tag, ideal for cloning elements in a SPA.</p>
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
          <p>Using <code>text/template</code> prevents the browser from executing the content immediately.</p>
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
          <p>This example demonstrates <strong>safe patterns</strong> like providing fallback values and basic string replacement for security.</p>
          <pre><code>&lt;div class="dynamic-content"&gt;
          &lt;h1&gt;\${title || 'Untitled'}&lt;/h1&gt;
          &lt;div class="body"&gt;\${content?.replace(/&lt;script&gt;/g, '&amp;lt;script&amp;gt;')}&lt;/div&gt;
          &lt;a href="/edit?id=\${id}&amp;action=update"&gt;Edit&lt;/a&gt;
        &lt;/div&gt;</code></pre>
        </section>

        Would you like to see how to implement a JavaScript function to render these templates?",
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
          "Here is the complete, ready-to-use code for the shopping cart widget.

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
