import { describe, expect, it } from 'vitest'

import { TranscriptArray } from './transcript.js'

describe('transcript', () => {
  it('empty transcript', () => {
    const transcript = new TranscriptArray()
    expect(transcript.toString()).toMatchInlineSnapshot(`""`)
  })
  it('short transcript', () => {
    const transcript = new TranscriptArray()
    transcript.push({
      role: 'user',
      name: 'Alice',
      content: 'Hello',
    })
    transcript.push({
      role: 'assistant',
      name: 'Bob',
      content: 'Hi',
    })
    transcript.push({
      role: 'user',
      name: 'Alice',
      content: 'How are you?',
    })
    expect(transcript.toString()).toMatchInlineSnapshot(`
      "<user-001 role="user" name="Alice">
      Hello
      </user-001>
      <assistant-002 role="assistant" name="Bob">
      Hi
      </assistant-002>
      <user-003 role="user" name="Alice">
      How are you?
      </user-003>"
    `)
  })
  it('too-long transcript', () => {
    const transcript = new TranscriptArray()
    for (let i = 0; i < 100; i++) {
      transcript.push({
        role: 'user',
        name: 'Alice',
        content: 'Hello ' + i,
      })
      transcript.push({
        role: 'assistant',
        name: 'Bob',
        content: 'Hi ' + i,
      })
    }
    expect(transcript.toString()).toMatchInlineSnapshot(`
      "<user-001 role="user" name="Alice">
      Hello 0
      </user-001>
      <assistant-002 role="assistant" name="Bob">
      Hi 0
      </assistant-002>
      <user-003 role="user" name="Alice">
      Hello 1
      </user-003>
      <assistant-004 role="assistant" name="Bob">
      Hi 1
      </assistant-004>
      <user-005 role="user" name="Alice">
      Hello 2
      </user-005>
      <assistant-006 role="assistant" name="Bob">
      Hi 2
      </assistant-006>
      <user-007 role="user" name="Alice">
      Hello 3
      </user-007>
      <assistant-008 role="assistant" name="Bob">
      Hi 3
      </assistant-008>
      <user-009 role="user" name="Alice">
      Hello 4
      </user-009>
      <assistant-010 role="assistant" name="Bob">
      Hi 4
      </assistant-010>
      <user-011 role="user" name="Alice">
      Hello 5
      </user-011>
      <assistant-012 role="assistant" name="Bob">
      Hi 5
      </assistant-012>
      <user-013 role="user" name="Alice">
      Hello 6
      </user-013>
      <assistant-014 role="assistant" name="Bob">
      Hi 6
      </assistant-014>
      <user-015 role="user" name="Alice">
      Hello 7
      </user-015>
      <assistant-016 role="assistant" name="Bob">
      Hi 7
      </assistant-016>
      <user-017 role="user" name="Alice">
      Hello 8
      </user-017>
      <assistant-018 role="assistant" name="Bob">
      Hi 8
      </assistant-018>
      <user-019 role="user" name="Alice">
      Hello 9
      </user-019>
      <assistant-020 role="assistant" name="Bob">
      Hi 9
      </assistant-020>
      <user-021 role="user" name="Alice">
      Hello 10
      </user-021>
      <assistant-022 role="assistant" name="Bob">
      Hi 10
      </assistant-022>
      <user-023 role="user" name="Alice">
      Hello 11
      </user-023>
      <assistant-024 role="assistant" name="Bob">
      Hi 11
      </assistant-024>
      <user-025 role="user" name="Alice">
      Hello 12
      </user-025>
      <assistant-026 role="assistant" name="Bob">
      Hi 12
      </assistant-026>
      <user-027 role="user" name="Alice">
      Hello 13
      </user-027>
      <assistant-028 role="assistant" name="Bob">
      Hi 13
      </assistant-028>
      <user-029 role="user" name="Alice">
      Hello 14
      </user-029>
      <assistant-030 role="assistant" name="Bob">
      Hi 14
      </assistant-030>
      <user-031 role="user" name="Alice">
      Hello 15
      </user-031>
      <assistant-032 role="assistant" name="Bob">
      Hi 15
      </assistant-032>
      <user-033 role="user" name="Alice">
      Hello 16
      </user-033>
      <assistant-034 role="assistant" name="Bob">
      Hi 16
      </assistant-034>
      <user-035 role="user" name="Alice">
      Hello 17
      </user-035>
      <assistant-036 role="assistant" name="Bob">
      Hi 17
      </assistant-036>
      <user-037 role="user" name="Alice">
      Hello 18
      </user-037>
      <assistant-038 role="assistant" name="Bob">
      Hi 18
      </assistant-038>
      <user-039 role="user" name="Alice">
      Hello 19
      </user-039>
      <assistant-040 role="assistant" name="Bob">
      Hi 19
      </assistant-040>
      <user-041 role="user" name="Alice">
      Hello 20
      </user-041>
      <assistant-042 role="assistant" name="Bob">
      Hi 20
      </assistant-042>
      <user-043 role="user" name="Alice">
      Hello 21
      </user-043>
      <assistant-044 role="assistant" name="Bob">
      Hi 21
      </assistant-044>
      <user-045 role="user" name="Alice">
      Hello 22
      </user-045>
      <assistant-046 role="assistant" name="Bob">
      Hi 22
      </assistant-046>
      <user-047 role="user" name="Alice">
      Hello 23
      </user-047>
      <assistant-048 role="assistant" name="Bob">
      Hi 23
      </assistant-048>
      <user-049 role="user" name="Alice">
      Hello 24
      </user-049>
      <assistant-050 role="assistant" name="Bob">
      Hi 24
      </assistant-050>
      <user-051 role="user" name="Alice">
      Hello 25
      </user-051>
      <assistant-052 role="assistant" name="Bob">
      Hi 25
      </assistant-052>
      <user-053 role="user" name="Alice">
      Hello 26
      </user-053>
      <assistant-054 role="assistant" name="Bob">
      Hi 26
      </assistant-054>
      <user-055 role="user" name="Alice">
      Hello 27
      </user-055>
      <assistant-056 role="assistant" name="Bob">
      Hi 27
      </assistant-056>
      <user-057 role="user" name="Alice">
      Hello 28
      </user-057>
      <assistant-058 role="assistant" name="Bob">
      Hi 28
      </assistant-058>
      <user-059 role="user" name="Alice">
      Hello 29
      </user-059>
      <assistant-060 role="assistant" name="Bob">
      Hi 29
      </assistant-060>
      <user-061 role="user" name="Alice">
      Hello 30
      </user-061>
      <assistant-062 role="assistant" name="Bob">
      Hi 30
      </assistant-062>
      <user-063 role="user" name="Alice">
      Hello 31
      </user-063>
      <assistant-064 role="assistant" name="Bob">
      Hi 31
      </assistant-064>
      <user-065 role="user" name="Alice">
      Hello 32
      </user-065>
      <assistant-066 role="assistant" name="Bob">
      Hi 32
      </assistant-066>
      <user-067 role="user" name="Alice">
      Hello 33
      </user-067>
      <assistant-068 role="assistant" name="Bob">
      Hi 33
      </assistant-068>
      <user-069 role="user" name="Alice">
      Hello 34
      </user-069>
      <assistant-070 role="assistant" name="Bob">
      Hi 34
      </assistant-070>
      <user-071 role="user" name="Alice">
      Hello 35
      </user-071>
      <assistant-072 role="assistant" name="Bob">
      Hi 35
      </assistant-072>
      <user-073 role="user" name="Alice">
      Hello 36
      </user-073>
      <assistant-074 role="assistant" name="Bob">
      Hi 36
      </assistant-074>
      <user-075 role="user" name="Alice">
      Hello 37
      </user-075>
      <assistant-076 role="assistant" name="Bob">
      Hi 37
      </assistant-076>
      <user-077 role="user" name="Alice">
      Hello 38
      </user-077>
      <assistant-078 role="assistant" name="Bob">
      Hi 38
      </assistant-078>
      <user-079 role="user" name="Alice">
      Hello 39
      </user-079>
      <assistant-080 role="assistant" name="Bob">
      Hi 39
      </assistant-080>
      <user-081 role="user" name="Alice">
      Hello 40
      </user-081>
      <assistant-082 role="assistant" name="Bob">
      Hi 40
      </assistant-082>
      <user-083 role="user" name="Alice">
      Hello 41
      </user-083>
      <assistant-084 role="assistant" name="Bob">
      Hi 41
      </assistant-084>
      <user-085 role="user" name="Alice">
      Hello 42
      </user-085>
      <assistant-086 role="assistant" name="Bob">
      Hi 42
      </assistant-086>
      <user-087 role="user" name="Alice">
      Hello 43
      </user-087>
      <assistant-088 role="assistant" name="Bob">
      Hi 43
      </assistant-088>
      <user-089 role="user" name="Alice">
      Hello 44
      </user-089>
      <assistant-090 role="assistant" name="Bob">
      Hi 44
      </assistant-090>
      <user-091 role="user" name="Alice">
      Hello 45
      </user-091>
      <assistant-092 role="assistant" name="Bob">
      Hi 45
      </assistant-092>
      <user-093 role="user" name="Alice">
      Hello 46
      </user-093>
      <assistant-094 role="assistant" name="Bob">
      Hi 46
      </assistant-094>
      <user-095 role="user" name="Alice">
      Hello 47
      </user-095>
      <assistant-096 role="assistant" name="Bob">
      Hi 47
      </assistant-096>
      <user-097 role="user" name="Alice">
      Hello 48
      </user-097>
      <assistant-098 role="assistant" name="Bob">
      Hi 48
      </assistant-098>
      <user-099 role="user" name="Alice">
      Hello 49
      </user-099>
      <assistant-100 role="assistant" name="Bob">
      Hi 49
      </assistant-100>
      <user-101 role="user" name="Alice">
      Hello 50
      </user-101>
      <assistant-102 role="assistant" name="Bob">
      Hi 50
      </assistant-102>
      <user-103 role="user" name="Alice">
      Hello 51
      </user-103>
      <assistant-104 role="assistant" name="Bob">
      Hi 51
      </assistant-104>
      <user-105 role="user" name="Alice">
      Hello 52
      </user-105>
      <assistant-106 role="assistant" name="Bob">
      Hi 52
      </assistant-106>
      <user-107 role="user" name="Alice">
      Hello 53
      </user-107>
      <assistant-108 role="assistant" name="Bob">
      Hi 53
      </assistant-108>
      <user-109 role="user" name="Alice">
      Hello 54
      </user-109>
      <assistant-110 role="assistant" name="Bob">
      Hi 54
      </assistant-110>
      <user-111 role="user" name="Alice">
      Hello 55
      </user-111>
      <assistant-112 role="assistant" name="Bob">
      Hi 55
      </assistant-112>
      <user-113 role="user" name="Alice">
      Hello 56
      </user-113>
      <assistant-114 role="assistant" name="Bob">
      Hi 56
      </assistant-114>
      <user-115 role="user" name="Alice">
      Hello 57
      </user-115>
      <assistant-116 role="assistant" name="Bob">
      Hi 57
      </assistant-116>
      <user-117 role="user" name="Alice">
      Hello 58
      </user-117>
      <assistant-118 role="assistant" name="Bob">
      Hi 58
      </assistant-118>
      <user-119 role="user" name="Alice">
      Hello 59
      </user-119>
      <assistant-120 role="assistant" name="Bob">
      Hi 59
      </assistant-120>
      <user-121 role="user" name="Alice">
      Hello 60
      </user-121>
      <assistant-122 role="assistant" name="Bob">
      Hi 60
      </assistant-122>
      <user-123 role="user" name="Alice">
      Hello 61
      </user-123>
      <assistant-124 role="assistant" name="Bob">
      Hi 61
      </assistant-124>
      <user-125 role="user" name="Alice">
      Hello 62
      </user-125>
      <assistant-126 role="assistant" name="Bob">
      Hi 62
      </assistant-126>
      <user-127 role="user" name="Alice">
      Hello 63
      </user-127>
      <assistant-128 role="assistant" name="Bob">
      Hi 63
      </assistant-128>
      <user-129 role="user" name="Alice">
      Hello 64
      </user-129>
      <assistant-130 role="assistant" name="Bob">
      Hi 64
      </assistant-130>
      <user-131 role="user" name="Alice">
      Hello 65
      </user-131>
      <assistant-132 role="assistant" name="Bob">
      Hi 65
      </assistant-132>
      <user-133 role="user" name="Alice">
      Hello 66
      </user-133>
      <assistant-134 role="assistant" name="Bob">
      Hi 66
      </assistant-134>
      <user-135 role="user" name="Alice">
      Hello 67
      </user-135>
      <assistant-136 role="assistant" name="Bob">
      Hi 67
      </assistant-136>
      <user-137 role="user" name="Alice">
      Hello 68
      </user-137>
      <assistant-138 role="assistant" name="Bob">
      Hi 68
      </assistant-138>
      <user-139 role="user" name="Alice">
      Hello 69
      </user-139>
      <assistant-140 role="assistant" name="Bob">
      Hi 69
      </assistant-140>
      <user-141 role="user" name="Alice">
      Hello 70
      </user-141>
      <assistant-142 role="assistant" name="Bob">
      Hi 70
      </assistant-142>
      <user-143 role="user" name="Alice">
      Hello 71
      </user-143>
      <assistant-144 role="assistant" name="Bob">
      Hi 71
      </assistant-144>
      <user-145 role="user" name="Alice">
      Hello 72
      </user-145>
      <assistant-146 role="assistant" name="Bob">
      Hi 72
      </assistant-146>
      <user-147 role="user" name="Alice">
      Hello 73
      </user-147>
      <assistant-148 role="assistant" name="Bob">
      Hi 73
      </assistant-148>
      <user-149 role="user" name="Alice">
      Hello 74
      </user-149>
      <assistant-150 role="assistant" name="Bob">
      Hi 74
      </assistant-150>
      <user-151 role="user" name="Alice">
      Hello 75
      </user-151>
      <assistant-152 role="assistant" name="Bob">
      Hi 75
      </assistant-152>
      <user-153 role="user" name="Alice">
      Hello 76
      </user-153>
      <assistant-154 role="assistant" name="Bob">
      Hi 76
      </assistant-154>
      <user-155 role="user" name="Alice">
      Hello 77
      </user-155>
      <assistant-156 role="assistant" name="Bob">
      Hi 77
      </assistant-156>
      <user-157 role="user" name="Alice">
      Hello 78
      </user-157>
      <assistant-158 role="assistant" name="Bob">
      Hi 78
      </assistant-158>
      <user-159 role="user" name="Alice">
      Hello 79
      </user-159>
      <assistant-160 role="assistant" name="Bob">
      Hi 79
      </assistant-160>
      <user-161 role="user" name="Alice">
      Hello 80
      </user-161>
      <assistant-162 role="assistant" name="Bob">
      Hi 80
      </assistant-162>
      <user-163 role="user" name="Alice">
      Hello 81
      </user-163>
      <assistant-164 role="assistant" name="Bob">
      Hi 81
      </assistant-164>
      <user-165 role="user" name="Alice">
      Hello 82
      </user-165>
      <assistant-166 role="assistant" name="Bob">
      Hi 82
      </assistant-166>
      <user-167 role="user" name="Alice">
      Hello 83
      </user-167>
      <assistant-168 role="assistant" name="Bob">
      Hi 83
      </assistant-168>
      <user-169 role="user" name="Alice">
      Hello 84
      </user-169>
      <assistant-170 role="assistant" name="Bob">
      Hi 84
      </assistant-170>
      <user-171 role="user" name="Alice">
      Hello 85
      </user-171>
      <assistant-172 role="assistant" name="Bob">
      Hi 85
      </assistant-172>
      <user-173 role="user" name="Alice">
      Hello 86
      </user-173>
      <assistant-174 role="assistant" name="Bob">
      Hi 86
      </assistant-174>
      <user-175 role="user" name="Alice">
      Hello 87
      </user-175>
      <assistant-176 role="assistant" name="Bob">
      Hi 87
      </assistant-176>
      <user-177 role="user" name="Alice">
      Hello 88
      </user-177>
      <assistant-178 role="assistant" name="Bob">
      Hi 88
      </assistant-178>
      <user-179 role="user" name="Alice">
      Hello 89
      </user-179>
      <assistant-180 role="assistant" name="Bob">
      Hi 89
      </assistant-180>
      <user-181 role="user" name="Alice">
      Hello 90
      </user-181>
      <assistant-182 role="assistant" name="Bob">
      Hi 90
      </assistant-182>
      <user-183 role="user" name="Alice">
      Hello 91
      </user-183>
      <assistant-184 role="assistant" name="Bob">
      Hi 91
      </assistant-184>
      <user-185 role="user" name="Alice">
      Hello 92
      </user-185>
      <assistant-186 role="assistant" name="Bob">
      Hi 92
      </assistant-186>
      <user-187 role="user" name="Alice">
      Hello 93
      </user-187>
      <assistant-188 role="assistant" name="Bob">
      Hi 93
      </assistant-188>
      <user-189 role="user" name="Alice">
      Hello 94
      </user-189>
      <assistant-190 role="assistant" name="Bob">
      Hi 94
      </assistant-190>
      <user-191 role="user" name="Alice">
      Hello 95
      </user-191>
      <assistant-192 role="assistant" name="Bob">
      Hi 95
      </assistant-192>
      <user-193 role="user" name="Alice">
      Hello 96
      </user-193>
      <assistant-194 role="assistant" name="Bob">
      Hi 96
      </assistant-194>
      <user-195 role="user" name="Alice">
      Hello 97
      </user-195>
      <assistant-196 role="assistant" name="Bob">
      Hi 97
      </assistant-196>
      <user-197 role="user" name="Alice">
      Hello 98
      </user-197>
      <assistant-198 role="assistant" name="Bob">
      Hi 98
      </assistant-198>
      <user-199 role="user" name="Alice">
      Hello 99
      </user-199>
      <assistant-200 role="assistant" name="Bob">
      Hi 99
      </assistant-200>"
    `)
  })
  it('assistant spoke last', () => {
    const transcript = new TranscriptArray()
    transcript.push({
      role: 'user',
      name: 'Alice',
      content: 'Hello',
    })
    transcript.push({
      role: 'assistant',
      name: 'Bob',
      content: 'Hi',
    })
    expect(transcript.toString()).toMatchInlineSnapshot(`
      "<user-001 role="user" name="Alice">
      Hello
      </user-001>
      <assistant-002 role="assistant" name="Bob">
      Hi
      </assistant-002>"
    `)
  })
  it('long messages are truncated', () => {
    const transcript = new TranscriptArray()
    transcript.push({
      role: 'user',
      name: 'Alice',
      content: 'Hello ' + '[token] '.repeat(1000),
    })
    transcript.push({
      role: 'user',
      name: 'Alice',
      content: 'World ' + '[token] '.repeat(1000),
    })
    transcript.push({
      role: 'assistant',
      name: 'Bob',
      content: 'Hey ' + '[token] '.repeat(1000),
    })
    expect(transcript.toString()).toMatchInlineSnapshot(`
      "<user-001 role="user" name="Alice">
      Hello [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [t
      ... (truncated)
      </user-001>
      <user-002 role="user" name="Alice">
      World [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [t
      ... (truncated)
      </user-002>
      <assistant-003 role="assistant" name="Bob">
      Hey [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [tok
      ... (truncated)
      </assistant-003>"
    `)
  })
  it('multi-line messages', () => {
    const transcript = new TranscriptArray()
    transcript.push({
      role: 'user',
      name: 'Alice',
      content: 'Hello\nWorld',
    })
    transcript.push({
      role: 'assistant',
      name: 'Bob',
      content: 'Hi\nThere',
    })
    expect(transcript.toString()).toMatchInlineSnapshot(`
      "<user-001 role="user" name="Alice">
      Hello
      World
      </user-001>
      <assistant-002 role="assistant" name="Bob">
      Hi
      There
      </assistant-002>"
    `)
  })
})
