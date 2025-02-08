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
      "<message-001 role="user" name="Alice">
      Hello
      </message-001>
      <message-002 role="assistant" name="Bob">
      Hi
      </message-002>
      <message-003 role="user" name="Alice">
      How are you?
      </message-003>"
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
      "<message-001 role="user" name="Alice">
      Hello 0
      </message-001>
      <message-002 role="assistant" name="Bob">
      Hi 0
      </message-002>
      <message-003 role="user" name="Alice">
      Hello 1
      </message-003>
      <message-004 role="assistant" name="Bob">
      Hi 1
      </message-004>
      <message-005 role="user" name="Alice">
      Hello 2
      </message-005>
      <message-006 role="assistant" name="Bob">
      Hi 2
      </message-006>
      <message-007 role="user" name="Alice">
      Hello 3
      </message-007>
      <message-008 role="assistant" name="Bob">
      Hi 3
      </message-008>
      <message-009 role="user" name="Alice">
      Hello 4
      </message-009>
      <message-010 role="assistant" name="Bob">
      Hi 4
      </message-010>
      <message-011 role="user" name="Alice">
      Hello 5
      </message-011>
      <message-012 role="assistant" name="Bob">
      Hi 5
      </message-012>
      <message-013 role="user" name="Alice">
      Hello 6
      </message-013>
      <message-014 role="assistant" name="Bob">
      Hi 6
      </message-014>
      <message-015 role="user" name="Alice">
      Hello 7
      </message-015>
      <message-016 role="assistant" name="Bob">
      Hi 7
      </message-016>
      <message-017 role="user" name="Alice">
      Hello 8
      </message-017>
      <message-018 role="assistant" name="Bob">
      Hi 8
      </message-018>
      <message-019 role="user" name="Alice">
      Hello 9
      </message-019>
      <message-020 role="assistant" name="Bob">
      Hi 9
      </message-020>
      <message-021 role="user" name="Alice">
      Hello 10
      </message-021>
      <message-022 role="assistant" name="Bob">
      Hi 10
      </message-022>
      <message-023 role="user" name="Alice">
      Hello 11
      </message-023>
      <message-024 role="assistant" name="Bob">
      Hi 11
      </message-024>
      <message-025 role="user" name="Alice">
      Hello 12
      </message-025>
      <message-026 role="assistant" name="Bob">
      Hi 12
      </message-026>
      <message-027 role="user" name="Alice">
      Hello 13
      </message-027>
      <message-028 role="assistant" name="Bob">
      Hi 13
      </message-028>
      <message-029 role="user" name="Alice">
      Hello 14
      </message-029>
      <message-030 role="assistant" name="Bob">
      Hi 14
      </message-030>
      <message-031 role="user" name="Alice">
      Hello 15
      </message-031>
      <message-032 role="assistant" name="Bob">
      Hi 15
      </message-032>
      <message-033 role="user" name="Alice">
      Hello 16
      </message-033>
      <message-034 role="assistant" name="Bob">
      Hi 16
      </message-034>
      <message-035 role="user" name="Alice">
      Hello 17
      </message-035>
      <message-036 role="assistant" name="Bob">
      Hi 17
      </message-036>
      <message-037 role="user" name="Alice">
      Hello 18
      </message-037>
      <message-038 role="assistant" name="Bob">
      Hi 18
      </message-038>
      <message-039 role="user" name="Alice">
      Hello 19
      </message-039>
      <message-040 role="assistant" name="Bob">
      Hi 19
      </message-040>
      <message-041 role="user" name="Alice">
      Hello 20
      </message-041>
      <message-042 role="assistant" name="Bob">
      Hi 20
      </message-042>
      <message-043 role="user" name="Alice">
      Hello 21
      </message-043>
      <message-044 role="assistant" name="Bob">
      Hi 21
      </message-044>
      <message-045 role="user" name="Alice">
      Hello 22
      </message-045>
      <message-046 role="assistant" name="Bob">
      Hi 22
      </message-046>
      <message-047 role="user" name="Alice">
      Hello 23
      </message-047>
      <message-048 role="assistant" name="Bob">
      Hi 23
      </message-048>
      <message-049 role="user" name="Alice">
      Hello 24
      </message-049>
      <message-050 role="assistant" name="Bob">
      Hi 24
      </message-050>
      <message-051 role="user" name="Alice">
      Hello 25
      </message-051>
      <message-052 role="assistant" name="Bob">
      Hi 25
      </message-052>
      <message-053 role="user" name="Alice">
      Hello 26
      </message-053>
      <message-054 role="assistant" name="Bob">
      Hi 26
      </message-054>
      <message-055 role="user" name="Alice">
      Hello 27
      </message-055>
      <message-056 role="assistant" name="Bob">
      Hi 27
      </message-056>
      <message-057 role="user" name="Alice">
      Hello 28
      </message-057>
      <message-058 role="assistant" name="Bob">
      Hi 28
      </message-058>
      <message-059 role="user" name="Alice">
      Hello 29
      </message-059>
      <message-060 role="assistant" name="Bob">
      Hi 29
      </message-060>
      <message-061 role="user" name="Alice">
      Hello 30
      </message-061>
      <message-062 role="assistant" name="Bob">
      Hi 30
      </message-062>
      <message-063 role="user" name="Alice">
      Hello 31
      </message-063>
      <message-064 role="assistant" name="Bob">
      Hi 31
      </message-064>
      <message-065 role="user" name="Alice">
      Hello 32
      </message-065>
      <message-066 role="assistant" name="Bob">
      Hi 32
      </message-066>
      <message-067 role="user" name="Alice">
      Hello 33
      </message-067>
      <message-068 role="assistant" name="Bob">
      Hi 33
      </message-068>
      <message-069 role="user" name="Alice">
      Hello 34
      </message-069>
      <message-070 role="assistant" name="Bob">
      Hi 34
      </message-070>
      <message-071 role="user" name="Alice">
      Hello 35
      </message-071>
      <message-072 role="assistant" name="Bob">
      Hi 35
      </message-072>
      <message-073 role="user" name="Alice">
      Hello 36
      </message-073>
      <message-074 role="assistant" name="Bob">
      Hi 36
      </message-074>
      <message-075 role="user" name="Alice">
      Hello 37
      </message-075>
      <message-076 role="assistant" name="Bob">
      Hi 37
      </message-076>
      <message-077 role="user" name="Alice">
      Hello 38
      </message-077>
      <message-078 role="assistant" name="Bob">
      Hi 38
      </message-078>
      <message-079 role="user" name="Alice">
      Hello 39
      </message-079>
      <message-080 role="assistant" name="Bob">
      Hi 39
      </message-080>
      <message-081 role="user" name="Alice">
      Hello 40
      </message-081>
      <message-082 role="assistant" name="Bob">
      Hi 40
      </message-082>
      <message-083 role="user" name="Alice">
      Hello 41
      </message-083>
      <message-084 role="assistant" name="Bob">
      Hi 41
      </message-084>
      <message-085 role="user" name="Alice">
      Hello 42
      </message-085>
      <message-086 role="assistant" name="Bob">
      Hi 42
      </message-086>
      <message-087 role="user" name="Alice">
      Hello 43
      </message-087>
      <message-088 role="assistant" name="Bob">
      Hi 43
      </message-088>
      <message-089 role="user" name="Alice">
      Hello 44
      </message-089>
      <message-090 role="assistant" name="Bob">
      Hi 44
      </message-090>
      <message-091 role="user" name="Alice">
      Hello 45
      </message-091>
      <message-092 role="assistant" name="Bob">
      Hi 45
      </message-092>
      <message-093 role="user" name="Alice">
      Hello 46
      </message-093>
      <message-094 role="assistant" name="Bob">
      Hi 46
      </message-094>
      <message-095 role="user" name="Alice">
      Hello 47
      </message-095>
      <message-096 role="assistant" name="Bob">
      Hi 47
      </message-096>
      <message-097 role="user" name="Alice">
      Hello 48
      </message-097>
      <message-098 role="assistant" name="Bob">
      Hi 48
      </message-098>
      <message-099 role="user" name="Alice">
      Hello 49
      </message-099>
      <message-100 role="assistant" name="Bob">
      Hi 49
      </message-100>
      <message-101 role="user" name="Alice">
      Hello 50
      </message-101>
      <message-102 role="assistant" name="Bob">
      Hi 50
      </message-102>
      <message-103 role="user" name="Alice">
      Hello 51
      </message-103>
      <message-104 role="assistant" name="Bob">
      Hi 51
      </message-104>
      <message-105 role="user" name="Alice">
      Hello 52
      </message-105>
      <message-106 role="assistant" name="Bob">
      Hi 52
      </message-106>
      <message-107 role="user" name="Alice">
      Hello 53
      </message-107>
      <message-108 role="assistant" name="Bob">
      Hi 53
      </message-108>
      <message-109 role="user" name="Alice">
      Hello 54
      </message-109>
      <message-110 role="assistant" name="Bob">
      Hi 54
      </message-110>
      <message-111 role="user" name="Alice">
      Hello 55
      </message-111>
      <message-112 role="assistant" name="Bob">
      Hi 55
      </message-112>
      <message-113 role="user" name="Alice">
      Hello 56
      </message-113>
      <message-114 role="assistant" name="Bob">
      Hi 56
      </message-114>
      <message-115 role="user" name="Alice">
      Hello 57
      </message-115>
      <message-116 role="assistant" name="Bob">
      Hi 57
      </message-116>
      <message-117 role="user" name="Alice">
      Hello 58
      </message-117>
      <message-118 role="assistant" name="Bob">
      Hi 58
      </message-118>
      <message-119 role="user" name="Alice">
      Hello 59
      </message-119>
      <message-120 role="assistant" name="Bob">
      Hi 59
      </message-120>
      <message-121 role="user" name="Alice">
      Hello 60
      </message-121>
      <message-122 role="assistant" name="Bob">
      Hi 60
      </message-122>
      <message-123 role="user" name="Alice">
      Hello 61
      </message-123>
      <message-124 role="assistant" name="Bob">
      Hi 61
      </message-124>
      <message-125 role="user" name="Alice">
      Hello 62
      </message-125>
      <message-126 role="assistant" name="Bob">
      Hi 62
      </message-126>
      <message-127 role="user" name="Alice">
      Hello 63
      </message-127>
      <message-128 role="assistant" name="Bob">
      Hi 63
      </message-128>
      <message-129 role="user" name="Alice">
      Hello 64
      </message-129>
      <message-130 role="assistant" name="Bob">
      Hi 64
      </message-130>
      <message-131 role="user" name="Alice">
      Hello 65
      </message-131>
      <message-132 role="assistant" name="Bob">
      Hi 65
      </message-132>
      <message-133 role="user" name="Alice">
      Hello 66
      </message-133>
      <message-134 role="assistant" name="Bob">
      Hi 66
      </message-134>
      <message-135 role="user" name="Alice">
      Hello 67
      </message-135>
      <message-136 role="assistant" name="Bob">
      Hi 67
      </message-136>
      <message-137 role="user" name="Alice">
      Hello 68
      </message-137>
      <message-138 role="assistant" name="Bob">
      Hi 68
      </message-138>
      <message-139 role="user" name="Alice">
      Hello 69
      </message-139>
      <message-140 role="assistant" name="Bob">
      Hi 69
      </message-140>
      <message-141 role="user" name="Alice">
      Hello 70
      </message-141>
      <message-142 role="assistant" name="Bob">
      Hi 70
      </message-142>
      <message-143 role="user" name="Alice">
      Hello 71
      </message-143>
      <message-144 role="assistant" name="Bob">
      Hi 71
      </message-144>
      <message-145 role="user" name="Alice">
      Hello 72
      </message-145>
      <message-146 role="assistant" name="Bob">
      Hi 72
      </message-146>
      <message-147 role="user" name="Alice">
      Hello 73
      </message-147>
      <message-148 role="assistant" name="Bob">
      Hi 73
      </message-148>
      <message-149 role="user" name="Alice">
      Hello 74
      </message-149>
      <message-150 role="assistant" name="Bob">
      Hi 74
      </message-150>
      <message-151 role="user" name="Alice">
      Hello 75
      </message-151>
      <message-152 role="assistant" name="Bob">
      Hi 75
      </message-152>
      <message-153 role="user" name="Alice">
      Hello 76
      </message-153>
      <message-154 role="assistant" name="Bob">
      Hi 76
      </message-154>
      <message-155 role="user" name="Alice">
      Hello 77
      </message-155>
      <message-156 role="assistant" name="Bob">
      Hi 77
      </message-156>
      <message-157 role="user" name="Alice">
      Hello 78
      </message-157>
      <message-158 role="assistant" name="Bob">
      Hi 78
      </message-158>
      <message-159 role="user" name="Alice">
      Hello 79
      </message-159>
      <message-160 role="assistant" name="Bob">
      Hi 79
      </message-160>
      <message-161 role="user" name="Alice">
      Hello 80
      </message-161>
      <message-162 role="assistant" name="Bob">
      Hi 80
      </message-162>
      <message-163 role="user" name="Alice">
      Hello 81
      </message-163>
      <message-164 role="assistant" name="Bob">
      Hi 81
      </message-164>
      <message-165 role="user" name="Alice">
      Hello 82
      </message-165>
      <message-166 role="assistant" name="Bob">
      Hi 82
      </message-166>
      <message-167 role="user" name="Alice">
      Hello 83
      </message-167>
      <message-168 role="assistant" name="Bob">
      Hi 83
      </message-168>
      <message-169 role="user" name="Alice">
      Hello 84
      </message-169>
      <message-170 role="assistant" name="Bob">
      Hi 84
      </message-170>
      <message-171 role="user" name="Alice">
      Hello 85
      </message-171>
      <message-172 role="assistant" name="Bob">
      Hi 85
      </message-172>
      <message-173 role="user" name="Alice">
      Hello 86
      </message-173>
      <message-174 role="assistant" name="Bob">
      Hi 86
      </message-174>
      <message-175 role="user" name="Alice">
      Hello 87
      </message-175>
      <message-176 role="assistant" name="Bob">
      Hi 87
      </message-176>
      <message-177 role="user" name="Alice">
      Hello 88
      </message-177>
      <message-178 role="assistant" name="Bob">
      Hi 88
      </message-178>
      <message-179 role="user" name="Alice">
      Hello 89
      </message-179>
      <message-180 role="assistant" name="Bob">
      Hi 89
      </message-180>
      <message-181 role="user" name="Alice">
      Hello 90
      </message-181>
      <message-182 role="assistant" name="Bob">
      Hi 90
      </message-182>
      <message-183 role="user" name="Alice">
      Hello 91
      </message-183>
      <message-184 role="assistant" name="Bob">
      Hi 91
      </message-184>
      <message-185 role="user" name="Alice">
      Hello 92
      </message-185>
      <message-186 role="assistant" name="Bob">
      Hi 92
      </message-186>
      <message-187 role="user" name="Alice">
      Hello 93
      </message-187>
      <message-188 role="assistant" name="Bob">
      Hi 93
      </message-188>
      <message-189 role="user" name="Alice">
      Hello 94
      </message-189>
      <message-190 role="assistant" name="Bob">
      Hi 94
      </message-190>
      <message-191 role="user" name="Alice">
      Hello 95
      </message-191>
      <message-192 role="assistant" name="Bob">
      Hi 95
      </message-192>
      <message-193 role="user" name="Alice">
      Hello 96
      </message-193>
      <message-194 role="assistant" name="Bob">
      Hi 96
      </message-194>
      <message-195 role="user" name="Alice">
      Hello 97
      </message-195>
      <message-196 role="assistant" name="Bob">
      Hi 97
      </message-196>
      <message-197 role="user" name="Alice">
      Hello 98
      </message-197>
      <message-198 role="assistant" name="Bob">
      Hi 98
      </message-198>
      <message-199 role="user" name="Alice">
      Hello 99
      </message-199>
      <message-200 role="assistant" name="Bob">
      Hi 99
      </message-200>"
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
      "<message-001 role="user" name="Alice">
      Hello
      </message-001>
      <message-002 role="assistant" name="Bob">
      Hi
      </message-002>"
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
      "<message-001 role="user" name="Alice">
      Hello [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [t
      ... (truncated)
      </message-001>
      <message-002 role="user" name="Alice">
      World [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [t
      ... (truncated)
      </message-002>
      <message-003 role="assistant" name="Bob">
      Hey [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [token] [tok
      ... (truncated)
      </message-003>"
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
      "<message-001 role="user" name="Alice">
      Hello
      World
      </message-001>
      <message-002 role="assistant" name="Bob">
      Hi
      There
      </message-002>"
    `)
  })
})
