import { z } from '@bpinternal/zui'
import { beforeAll, beforeEach, afterAll, assert, describe, expect, it } from 'vitest'
import * as llmz from './llmz.js'
import { Tool } from './tool.js'
import { Exit } from './exit.js'
import { ThinkSignal } from './errors.js'
import { ExecutionResult, SuccessExecutionResult } from './result.js'
import { getCachedCognitiveClient } from './__tests__/index.js'
import { Component } from './component.js'
import { Chat } from './chat.js'
import { TranscriptArray } from './transcript.js'

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
          "
          
            Here's how you can create a React component with state: 
         
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
         
            **Key Points**: 
            - Use \`useState\` for local state management. 
            - Use \`useEffect\` for handling side effects like data fetching. 
            - Template literals (e.g., \\\`\\\${userId}\\\`) allow JavaScript interpolation in strings. 
            - JSX uses \`{}\` to embed JavaScript expressions. 
         
            Let me know if you'd like a deeper explanation or have further questions! 
          
        ",
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
          "
          
            Here's an example of how to create a basic HTML form with validation: 
         
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
         
            **Explanation**: 
            - The \`form\` tag defines the HTML form. The \`action\` attribute specifies where to send the form data, and \`method\` defines the HTTP method (e.g., POST). 
            - The \`input\` elements are used for user input. The \`type\`, \`name\`, and \`required\` attributes define the input's behavior and constraints. 
            - The \`pattern\` attribute sets a regular expression for validation (e.g., validating an email format). 
            - The \`script\` contains a \`validate\` function that performs additional JavaScript validation before submission. 
            - The \`style\` defines CSS styling for valid and invalid inputs. 
         
            Let me know if you'd like further clarification or modifications! 
          
        ",
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
          "
          
        Advanced TypeScript types introduce powerful features that allow you to write more expressive and flexible code. Here are some key advanced types and features, along with examples: 
         
        1. **Template Literal Types**: 
           Template literals allow you to construct types dynamically using string interpolations. 
           \`\`\`typescript 
           type RouteParams<T extends string> = T extends \`\${infer Start}/:\${infer Param}/\${infer Rest}\` 
             ? { [K in Param]: string } & RouteParams<\`\${Start}/\${Rest}\`> 
             : {}; 
           \`\`\` 
         
        2. **Decorators**: 
           Decorators enable you to modify or extend the behavior of classes, methods, or properties. 
           \`\`\`typescript 
           function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) { 
             const original = descriptor.value; 
             descriptor.value = function (...args: any[]) { 
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
           } 
           \`\`\` 
         
        3. **Conditional Types**: 
           Conditional types allow you to define types that depend on a condition. 
           \`\`\`typescript 
           class ApiClient<T> { 
             transform<K extends keyof T>( 
               key: K 
             ): T[K] extends string ? string : number { 
               return this.data[key] as any; 
             } 
           } 
           \`\`\` 
         
        4. **Mapped Types**: 
           Mapped types allow you to create new types by transforming existing ones. 
           \`\`\`typescript 
           type EventMap = { 
             click: MouseEvent; 
             keypress: KeyboardEvent; 
           }; 
         
           type EventHandlers = { 
             [K in keyof EventMap as \`on\${Capitalize<K>}\`]: (e: EventMap[K]) => void; 
           }; 
           \`\`\` 
         
        These features demonstrate the flexibility and power of TypeScript to handle complex scenarios, making your codebase more robust and maintainable. 
          
        ",
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
          "
          
            Here are some guidelines and examples to help you write SQL queries: 
         
            **Basic Syntax Overview**: 
            - Use single quotes \`'\` for strings: \`'text'\` 
            - Use double quotes \`"\` for identifiers: \`"column_name"\` 
            - Escape single quotes with \`''\`: \`'It''s a nice day'\` 
            - Comments can be written as: 
              - Single-line: \`-- comment\` 
              - Multi-line: \`/* comment */\` 
         
            **Examples**: 
         
            1. **Complex SELECT with CTEs and Window Functions**: 
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
            \`\`\` 
         
            2. **Insert with String Escaping**: 
            \`\`\`sql 
            INSERT INTO messages (content, metadata) VALUES 
              ('User said: "Hello!"', '{"sender": "user", "timestamp": "2024-01-01"}'), 
              ('It''s a nice day', '{"type": "greeting"}'), 
              ('Path: C:\\\\Users\\\\Documents\\\\file.txt', NULL); 
            \`\`\` 
         
            3. **JSON Operations (PostgreSQL)**: 
            \`\`\`sql 
            SELECT 
              data->>'name' as name, 
              data->'address'->>'city' as city, 
              jsonb_array_elements(data->'tags') as tag 
            FROM documents 
            WHERE data @> '{"status": "active"}'; 
            \`\`\` 
         
            Let me know if you'd like further clarification or additional examples! 
          
        ",
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
          "
          
            Here's an introduction to writing Bash scripts along with examples: 
         
            ### Bash Scripting Basics: 
            1. **Start with Shebang**: Every Bash script starts with \`#!/bin/bash\` at the top. 
            2. **Variables**: Declare variables using \`=\` (no spaces around \`=\`). 
            3. **Conditions**: Use \`if\`, \`elif\`, and \`else\` for conditionals. 
            4. **Loops**: Use \`for\`, \`while\`, and \`until\` for looping. 
            5. **Functions**: Define functions to organize reusable code. 
         
            ### Example Bash Script: 
            \`\`\`bash 
            #!/bin/bash 
         
            # Variables and parameter expansion 
            NAME="John Doe" 
            FILE_PATH="/home/\${USER}/documents" 
            TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S) 
         
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
              if [[ -f "$file" ]]; then 
                echo "Processing: '$file'" 
                cat "$file" | grep -E "pattern|another" > "output_\${file}" 
              fi 
            done 
         
            # Command substitution and pipes 
            LINES=$(wc -l < input.txt) 
            RESULT=$(cat file.txt | sed 's/old/new/g' | awk '{print $1}') 
         
            # Here documents 
            cat << 'EOF' > output.txt 
            This is a here document. 
            Variables like $HOME are not expanded. 
            Special chars: < > | & ; ' " \` $ 
            EOF 
         
            # Function with error handling 
            process_file() { 
              local file="$1" 
              if [[ ! -r "$file" ]]; then 
                echo "Error: Cannot read '$file'" >&2 
                return 1 
              fi 
              echo "Success: $file" 
            } 
            \`\`\` 
         
            Let me know if you'd like to explore any specific part of Bash scripting in more detail! 
          
        ",
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
          "
          
            Here is an overview of Python string formatting with examples: 
         
            ### F-Strings (Python 3.6+) 
            F-strings allow embedding expressions inside string literals, using curly braces \`{}\`: 
            \`\`\`python 
            name = "Alice" 
            age = 30 
            print(f"Hello {name}! You are {age} years old.") 
            print(f"Next year: {age + 1}") 
            print(f"Uppercase: {name.upper()}") 
            \`\`\` 
         
            #### Format Specifiers 
            F-strings support formatting values with specifiers: 
            \`\`\`python 
            price = 19.99 
            print(f"Price: \${price:.2f}")  # Two decimal places 
            print(f"Hex: {255:#x}")        # Hexadecimal 
            print(f"Percentage: {0.846:.1%}")  # Percentage 
            \`\`\` 
         
            ### Raw Strings 
            Useful for regular expressions or file paths: 
            \`\`\`python 
            pattern = r"\\d{3}-\\d{3}-\\d{4}" 
            phone = "555-123-4567" 
            if re.match(pattern, phone): 
                print(f"Valid phone: {phone}") 
            \`\`\` 
         
            ### Triple-Quoted Strings 
            Useful for multi-line strings: 
            \`\`\`python 
            sql_query = """ 
            SELECT * 
            FROM users 
            WHERE name = '{name}' 
              AND age > {age} 
            """ 
            \`\`\` 
         
            ### Template Strings 
            Use \`.format\` for older formatting: 
            \`\`\`python 
            template = "Hello {name}, you have {count} messages" 
            result = template.format(name="Charlie", count=5) 
            \`\`\` 
         
            ### Dictionary Formatting 
            Access dictionary keys within strings: 
            \`\`\`python 
            user = {"name": "Bob", "role": "admin"} 
            print(f"User: {user['name']} ({user.get('role', 'user')})") 
            \`\`\` 
         
            #### Special Characters 
            Escape sequences or raw strings for special characters: 
            \`\`\`python 
            path = r"C:\\Users\\Alice\\Documents" 
            special = "Tab:\\t Newline:\\n Quote:\\" Backslash:\\\\" 
            \`\`\` 
         
            Let me know if you'd like further clarification or examples! 
          
        ",
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
          "
          
            To work with JSON, you can use the following examples and concepts: 
         
            ### Example JSON Structure 
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
                  "text": "Hello \\\\\\"world\\\\\\"!", 
                  "author": "Alice", 
                  "timestamp": "2024-01-01T12:00:00Z" 
                }, 
                { 
                  "id": 2, 
                  "text": "Path: C:\\\\\\\\Users\\\\\\\\Documents\\\\\\\\file.txt", 
                  "author": "Bob", 
                  "html": "<p>This is <strong>bold</strong></p>" 
                } 
              ], 
              "config": { 
                "apiUrl": "https://api.example.com/v1", 
                "regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$", 
                "template": "User {name} has {count} items", 
                "escapes": "Tab:\\\\t Newline:\\\\n Quote:\\\\\\" Backslash:\\\\\\\\" 
              }, 
              "special_chars": { 
                "unicode": "Hello \\\\u0041\\\\u0042\\\\u0043", 
                "emoji": "🎉 \\\\uD83D\\\\uDE80", 
                "null_value": null, 
                "boolean": true, 
                "number": 42.5e-10 
              } 
            } 
            \`\`\` 
         
            ### Key Points When Working with JSON 
            - **Quotes**: Use \`\\\\"\` inside strings for escaping quotes. 
            - **Backslashes**: Use \`\\\\\\\\\` for a single backslash. 
            - **Special Characters**: Use \`\\\\n\`, \`\\\\t\`, \`\\\\r\`, \`\\\\b\`, \`\\\\f\` for newlines, tabs, etc. 
            - **Unicode**: Use \`\\\\uXXXX\` format for Unicode characters. 
         
            JSON is widely used to store and exchange data. To manipulate JSON in programming: 
            - Parse JSON strings into objects. 
            - Convert objects back into JSON strings. 
         
            Let me know if you'd like examples in a specific programming language! 
          
        ",
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
          "
          
            CSS selectors are patterns used to select and style HTML elements. Here are some examples and features of CSS selectors: 
         
            **Basic Selectors:** 
            \`\`\`css 
            /* Element selector */ 
            p { color: blue; } 
         
            /* Class selector */ 
            .my-class { font-size: 16px; } 
         
            /* ID selector */ 
            #my-id { margin: 10px; } 
            \`\`\` 
         
            **Attribute Selectors:** 
            \`\`\`css 
            /* Starts with */ 
            a[href^="https://"] { color: green; } 
         
            /* Ends with */ 
            a[href$=".pdf"] { background: url('icon.pdf'); } 
         
            /* Contains a specific value */ 
            div[data-theme~="dark"] { background: #000; } 
            \`\`\` 
         
            **Pseudo-classes and Pseudo-elements:** 
            \`\`\`css 
            /* Odd-numbered children */ 
            li:nth-child(2n+1) { background: #f0f0f0; } 
         
            /* Style first letter */ 
            p::first-letter { font-size: 2em; } 
            \`\`\` 
         
            **Complex Selectors:** 
            \`\`\`css 
            /* Hover effect on non-active list items */ 
            nav > ul > li:not(.active) a:hover { text-decoration: underline; } 
         
            /* Select parent containing an image */ 
            div.container:has(> img) { padding: 20px; } 
            \`\`\` 
         
            For more details or examples, let me know! 
          
        ",
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
          "
          
        Here's a comprehensive guide on Markdown syntax:

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
        \`\`\`javascript
        const greeting = \`Hello \${name}!\`;
        const regex = /[a-z]+/g;
        const obj = { key: "value" };
        \`\`\`

        \`\`\`bash
        echo "Current dir: $(pwd)"
        grep -r "pattern" .
        \`\`\`

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
        Escape these: \\\\ \` \\* \\_ \\{ \\} \\[ \\] \\( \\) \\# \\+ \\- \\. \\!

        Raw HTML: \`<div class="custom">content</div>\`

        Let me know if you'd like further clarification or assistance with specific Markdown features!

          
        ",
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

      expect(result.iteration.code).toMatchInlineSnapshot(`
        "// Displaying the search results to the user in a visually rich format
        yield <Message>
          <Markdown>
            Here are the results for your search:

            1. <strong>Product A</strong> is available at <a href="https://example.com/productA">this link</a>
            2. The price is <em>$99.99</em> with a <span class="discount">20% discount</span>
            3. <p>Customer review: "This is <strong>amazing</strong>!" - <cite>John Doe</cite></p>
            4. Visit our <a href="https://example.com/store?ref=search&utm_source=email">online store</a> for more details
            5. Features:
               <ul>
                 <li>Fast shipping</li>
                 <li>Money-back guarantee</li>
               </ul>
          </Markdown>
        </Message>
        return { action: 'listen' }"
      `)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "
          
            Here are the results for your search: 
         
            1. **Product A** is available at [this link](https://example.com/productA)
            2. The price is *$99.99* with a 20% discount
            3. Customer review: "This is **amazing**!" - John Doe
            4. Visit our [online store](https://example.com/store?ref=search&utm_source=email) for more details 
            5. Features: 
               - Fast shipping 
        - Money-back guarantee 

          
        ",
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

      expect(result.iteration.code).toMatchInlineSnapshot(`
        "// Displaying the fetched HTML content as-is
        yield (
          <Message>
            <Markdown>
              {\`Here is the content you requested:\`}
            </Markdown>
            <Markdown>
              {\`
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
              \`}
            </Markdown>
          </Message>
        );
        return { action: 'listen' }"
      `)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "
            
              Here is the content you requested:
            
            
              
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
              
            
          ",
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

      expect(result.iteration.code).toMatchInlineSnapshot(`
        "// Displaying the fetched code examples for HTML templating with the required HTML structure
        yield (
          <Message>
            <div>
              <h2>Code Examples for HTML Templating</h2>
              <div className="examples">
                <div className="example">
                  <h3>Example 1: Basic Usage</h3>
                  <code>const html = '&lt;div&gt;{content}&lt;/div&gt;';</code>
                  <p>
                    This creates a <strong>template string</strong> with HTML.
                  </p>
                </div>
                <section>
                  <h3>Example 2: JSX Component</h3>
                  <pre>
                    function Button({"{label}"}) {"{"}
                    return &lt;button onClick={() =&gt; alert(\`Clicked {"\${label}"}!\`)}&gt;{"{label}"}&lt;/button&gt;;
                    {"}"}
                  </pre>
                  <p>
                    Notice the <em>curly braces</em> for expressions: <code>{"{label}"}</code>
                  </p>
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
                  <code>
                    text.replace(/&lt;/g, '&amp;lt;').replace(/&gt;/g,
                    '&amp;gt;')
                  </code>
                </article>
              </div>
            </div>
          </Message>
        );
        return { action: 'listen' };"
      `)

      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "
            
              Code Examples for HTML Templating
              
                
                  Example 1: Basic Usage
                  const html = '<div>content</div>';
                  
                    This creates a **template string** with HTML. 
         
         

                
                
                  Example 2: JSX Component
                  
                    function Button({label}) {
                    return <button onClick={() => alert(\`Clicked \${label}!\`)}>{label}</button>; 
                    }
                  
                  
                    Notice the *curly braces* for expressions: {label}
                  
                
                
                  Example 3: HTML Entities
                  Common entities: 
         

                  - &lt; for < 
        - &gt; for > 
        - &amp; for & 
        - &quot; for " 

                  
                    text.replace(/</g, '&lt;').replace(/>/g, 
                    '&gt;') 
                  
                
              
            
          ",
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

      expect(result.iteration.code).toMatchInlineSnapshot(`
        "// Displaying the fetched templates with template literals to the user
        yield <Message>
          <Markdown>
            Here are some HTML templates that use template literals:

            \`\`\`html
            <template id="user-card">
              <div class="card" data-user="\${userId}">
                <h2>\${name}</h2>
                <p>Email: <a href="mailto:\${email}">\${email}</a></p>
                <button onclick="deleteUser('\${userId}')">Delete</button>
              </div>
            </template>

            <script type="text/template">
              <div class="message">
                <strong>\${author}</strong> said:
                <blockquote>\${message}</blockquote>
                <small>Posted at \${timestamp}</small>
              </div>
            </script>

            <div class="dynamic-content">
              <h1>\${title || 'Untitled'}</h1>
              <div class="body">\${content?.replace(/<script>/g, '&lt;script&gt;')}</div>
              <a href="/edit?id=\${id}&action=update">Edit</a>
            </div>
            \`\`\`

            These templates demonstrate how to inject dynamic content using JavaScript template literals.
          </Markdown>
        </Message>
        return { action: 'listen' }"
      `)
      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "
          
            Here are some HTML templates that use template literals: 
         
            \`\`\`html 
            <template id="user-card"> 
              <div class="card" data-user="\${userId}"> 
                <h2>\${name}</h2> 
                <p>Email: <a href="mailto:\${email}">\${email}</a></p> 
                <button onclick="deleteUser('\${userId}')">Delete</button> 
              </div> 
            </template> 
         
            <script type="text/template"> 
              <div class="message"> 
                <strong>\${author}</strong> said: 
                <blockquote>\${message}</blockquote> 
                <small>Posted at \${timestamp}</small> 
              </div> 
            </script> 
         
            <div class="dynamic-content"> 
              <h1>\${title || 'Untitled'}</h1> 
              <div class="body">\${content?.replace(/<script>/g, '&lt;script&gt;')}</div> 
              <a href="/edit?id=\${id}&action=update">Edit</a> 
            </div> 
            \`\`\` 
         
            These templates demonstrate how to inject dynamic content using JavaScript template literals. 
          
        ",
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
      expect(result.iteration.code).toMatchInlineSnapshot(`
        "// Sharing the complete shopping cart widget code with the user
        yield <Message type="success">
          <Markdown>
            Here is the complete shopping cart widget code, ready for use. Copy and paste it into your project:

            **HTML:**
            \`\`\`html
            <div class="widget" id="widget-\${id}">
              <header>
                <h3>\${title}</h3>
                <button class="close" onclick="closeWidget('\${id}')">&times;</button>
              </header>
              <main>
                <ul class="items">
                  \${items.map(item => \`
                    <li data-id="\${item.id}">
                      <strong>\${item.name}</strong>
                      <span class="price">$\${item.price.toFixed(2)}</span>
                      <button onclick="addToCart('\${item.id}')">Add</button>
                    </li>
                  \`).join('')}
                </ul>
              </main>
              <footer>
                <p>Total: <strong>$\${total}</strong></p>
              </footer>
            </div>
            \`\`\`

            **CSS:**
            \`\`\`css
            .widget { border: 1px solid #ccc; }
            .widget header { background: linear-gradient(to right, #667eea 0%, #764ba2 100%); }
            .widget button:hover { transform: scale(1.1); }
            .price::before { content: "$"; }
            \`\`\`

            **JavaScript:**
            \`\`\`javascript
            function closeWidget(id) {
              document.getElementById(\`widget-\${id}\`).remove();
              localStorage.setItem('closed-widgets', JSON.stringify([...closedWidgets, id]));
            }

            function addToCart(itemId) {
              fetch(\`/api/cart/add?item=\${itemId}\`, { method: 'POST' })
                .then(res => res.json())
                .then(data => alert(\`Added \${data.name}!\`));
            }
            \`\`\`
          </Markdown>
        </Message>
        return { action: 'listen' }"
      `)
      expect(messagesSent).toMatchInlineSnapshot(`
        [
          "
          
            Here is the complete shopping cart widget code, ready for use. Copy and paste it into your project: 
         
            **HTML:** 
            \`\`\`html 
            <div class="widget" id="widget-\${id}"> 
              <header> 
                <h3>\${title}</h3> 
                <button class="close" onclick="closeWidget('\${id}')">&times;</button> 
              </header> 
              <main> 
                <ul class="items"> 
                  \${items.map(item => \` 
                    <li data-id="\${item.id}"> 
                      <strong>\${item.name}</strong> 
                      <span class="price">$\${item.price.toFixed(2)}</span> 
                      <button onclick="addToCart('\${item.id}')">Add</button> 
                    </li> 
                  \`).join('')} 
                </ul> 
              </main> 
              <footer> 
                <p>Total: <strong>$\${total}</strong></p> 
              </footer> 
            </div> 
            \`\`\` 
         
            **CSS:** 
            \`\`\`css 
            .widget { border: 1px solid #ccc; } 
            .widget header { background: linear-gradient(to right, #667eea 0%, #764ba2 100%); } 
            .widget button:hover { transform: scale(1.1); } 
            .price::before { content: "$"; } 
            \`\`\` 
         
            **JavaScript:** 
            \`\`\`javascript 
            function closeWidget(id) { 
              document.getElementById(\`widget-\${id}\`).remove(); 
              localStorage.setItem('closed-widgets', JSON.stringify([...closedWidgets, id])); 
            } 
         
            function addToCart(itemId) { 
              fetch(\`/api/cart/add?item=\${itemId}\`, { method: 'POST' }) 
                .then(res => res.json()) 
                .then(data => alert(\`Added \${data.name}!\`)); 
            } 
            \`\`\` 
          
        ",
        ]
      `)
    })
  })
})
