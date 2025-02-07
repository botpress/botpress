import { describe, it, expect } from 'vitest'

import { inspect } from './inspect.js'
import * as _ from 'lodash-es'
import { init } from './utils.js'
import { beforeEach } from 'node:test'

const makeBigObject = () => {
  const obj: Record<string, any> = {}
  for (let i = 0; i < 100; i++) {
    obj[`key${i}`] = `value${i}`
  }
  return obj
}

const OPTIONS = { tokens: 1_000 }

describe('Inspect Array', () => {
  beforeEach(async () => {
    await init()
  })

  it('short arrays shows all elements', () => {
    const items = [1, 'hello', null, new Date('2020-10-12'), makeBigObject()]
    expect(inspect(items, 'shortArray', OPTIONS)).toMatchInlineSnapshot(`
      "// const shortArray: Array
      // Full Array Preview
      --------------
      [0]              number 1
      [1]              <string> 'hello'
      [2]              <nil>
      [3]              <date> 2020-10-12T00:00:00.000Z
      [4]              <object> {"'key0'":"value0","'key1'":"value1","'key2'":"value2","'key3'":"value3","'key4'":"value4","'key5'":"value5","'key6'":"value6","'key7'":"value7","'key8'":"value8","'key9'":"value9","'key10'":"value10","'key11'":"value11","'key12'":"value12","'key13'":"value13","'key14'":"value14","'key15'":"value15","'key16'":"value16","'key17'":"value17","'key18'":"value18","'key19'":"value19","'key20'":"value20","'key21'":"value21","'key22'":"value22","'key23'":"value23","'key24'":"value24","'key25'":"value25","'key26'":"value26","'key27'":"value27","'key28'":"value28","'key29'":"value29","'key30'":"value30","'key31'":"value31","'key32'":"value32","'key33'":"value33","'key34'":"value34","'key35'":"value35","'key36'":"value36","'key37'":"value37","'key38'":"value38","'key39'":"value39","'key40'":"value40","'key41'":"value41","'key42'":"value42","'key43'":"value43","'key44'":"value44","'key45'":"value45","'key46'":"value46","'key47'":"value47","'key48'":"value48","'key49'":"value49","'key50'":"value50","'key51'":"value51","'key52'":"value52","'key53'":"value53","'key54'":"value54","'key55'":"value55","'key56'":"value56","'key57'":"value57","'key58'":"value58","'key59'":"value59","'key60'":"value60","'key61'":"value61","'key62'":"value62","'key63'":"value63","'key64'":"value64","'key65'":"value65","'key66'":"value66","'key67'":"value67","'key68'":"value68","'key69'":"value69","'key70'":"value70","'key71'":"value71","'key72'":"value72","'key73'":"value73","'key74'":"value74","'key75'":"value75","'key76'":"value76","'key77'":"value77","'key78'":"value78","'key79'":"value79","'key80'":"value80","'key81'":"value81","'key82'":"value82","'key83'":"value83","'key84'":"value84","'key85'":"value85","'key86'":"value86","'key87'":"value87","'key88'":"value88","'key89'":"value89","'key90'":"value90","'key91'":"value91","'key92'":"value92","'key93'":"value93","'key94'":"value94","'key95'":"value95","'key96'":"value96","'key97'":"value97","'key98'":"value98","'key99'":"value99"}"
    `)
  })

  it('arrays with large payloads are not part of aggregate stats', () => {
    const items = ['1' + 'a'.repeat(1000), 'hello', '9' + 'b'.repeat(1000), null, '3', '4', '5', '6', 7, 8, 9]
    expect(inspect(items, 'shortArray', OPTIONS)).toMatchInlineSnapshot(`
      "// const shortArray: Array
      // Analysis Summary
      --------------
      Total Items:     11
      Unique Items:    11
      Types:           {"string":7,"null":1,"number":3}
      Minimum Values:  [<string> '3', <string> '4', <string> '5']
      Maximum Values:  [number 7, number 8, number 9]
      Memory Usage:    2KB
      Nil Values:      1
      // Array Preview (truncated)
      --------------
      [0]              <string> '1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      [1]              <string> 'hello'
      [2]              <string> '9bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      [3]              <nil>
      [4]              <string> '3'
      [5]              <string> '4'
      [6]              <string> '5'
      [7]              <string> '6'
      [8]              number 7
      [9]              number 8
      [10]             number 9"
    `)
  })

  it('long arrays are not truncated anymore', () => {
    const items = [1, 'hello', null, new Date('2020-10-12'), ..._.range(1, 250).map((i) => `value${i}`)]
    expect(inspect(items, 'shortArray', OPTIONS)).toMatchInlineSnapshot(`
      "// const shortArray: Array
      // Analysis Summary
      --------------
      Total Items:     253
      Unique Items:    253
      Types:           {"number":1,"string":250,"null":1,"date":1}
      Minimum Values:  [<date> 2020-10-12T00:00:00.000Z, <string> 'hello', <string> 'value1']
      Maximum Values:  [<string> 'value98', <string> 'value99', number 1]
      Memory Usage:    2.61KB
      Nil Values:      1
      // Array Preview (truncated)
      --------------
      [0]              number 1
      [1]              <string> 'hello'
      [2]              <nil>
      [3]              <date> 2020-10-12T00:00:00.000Z
      [4]              <string> 'value1'
      [5]              <string> 'value2'
      [6]              <string> 'value3'
      [7]              <string> 'value4'
      [8]              <string> 'value5'
      [9]              <string> 'value6'
      [10]             <string> 'value7'
      [11]             <string> 'value8'
      [12]             <string> 'value9'
      [13]             <string> 'value10'
      [14]             <string> 'value11'
      [15]             <string> 'value12'
      [16]             <string> 'value13'
      [17]             <string> 'value14'
      [18]             <string> 'value15'
      [19]             <string> 'value16'
      [20]             <string> 'value17'
      [21]             <string> 'value18'
      [22]             <string> 'value19'
      [23]             <string> 'value20'
      [24]             <string> 'value21'
      [25]             <string> 'value22'
      [26]             <string> 'value23'
      [27]             <string> 'value24'
      [28]             <string> 'value25'
      [29]             <string> 'value26'
      [30]             <string> 'value27'
      [31]             <string> 'value28'
      [32]             <string> 'value29'
      [33]             <string> 'value30'
      [34]             <string> 'value31'
      [35]             <string> 'value32'
      [36]             <string> 'value33'
      [37]             <string> 'value34'
      [38]             <string> 'value35'
      [39]             <string> 'value36'
      [40]             <string> 'value37'
      [41]             <string> 'value38'
      [42]             <string> 'value39'
      [43]             <string> 'value40'
      [44]             <string> 'value41'
      [45]             <string> 'value42'
      [46]             <string> 'value43'
      [47]             <string> 'value44'
      [48]             <string> 'value45'
      [49]             <string> 'value46'
      [50]             <string> 'value47'
      [51]             <string> 'value48'
      [52]             <string> 'value49'
      [53]             <string> 'value50'
      [54]             <string> 'value51'
      [55]             <string> 'value52'
      [56]             <string> 'value53'
      [57]             <string> 'value54'
      [58]             <string> 'value55'
      [59]             <string> 'value56'
      [60]             <string> 'value57'
      [61]             <string> 'value58'
      [62]             <string> 'value59'
      [63]             <string> 'value60'
      [64]             <string> 'value61'
      [65]             <string> 'value62'
      [66]             <string> 'value63'
      [67]             <string> 'value64'
      [68]             <string> 'value65'
      [69]             <string> 'value66'
      [70]             <string> 'value67'
      [71]             <string> 'value68'
      [72]             <string> 'value69'
      [73]             <string> 'value70'
      [74]             <string> 'value71'
      [75]             <string> 'value72'
      [76]             <string> 'value73'
      [77]             <string> 'value74'
      [78]             <string> 'value75'
      [79]             <string> 'value76'
      [80]             <string> 'value77'
      [81]             <string> 'value78'
      [82]             <string> 'value79'
      [83]             <string> 'value80'
      [84]             <string> 'value81'
      [85]             <string> 'value82'
      [86]             <string> 'value83'
      [87]             <string> 'value84'
      [88]             <string> 'value85'
      [89]             <string> 'value86'
      [90]             <string> 'value87'
      [91]             <string> 'value88'
      [92]             <string> 'value89'
      [93]             <string> 'value90'
      [94]             <string> 'value91'
      [95]             <string> 'value92'
      [96]             <string> 'value93'
      [97]             <string> 'value94'
      [98]             <string> 'value95'
      [99]             <string> 'value96'
      [100]            <string> 'value97'
      [101]            <string> 'value98'
      [102]            <string> 'value99'
      [103]            <string> 'value100'
      [104]            <string> 'value101'
      [105]            <string> 'value102'
      [106]            <string> 'value103'
      [107]            <string> 'value104'
      [108]            <string> 'value105'
      [109]            <string> 'value106'
      [110]            <string> 'value107'
      [111]            <string> 'value108'
      [112]            <string> 'value109'
      [113]            <string> 'value110'
      [114]            <string> 'value111'
      [115]            <string> 'value112'
      [116]            <string> 'value113'
      [117]            <string> 'value114'
      [118]            <string> 'value115'
      [119]            <string> 'value116'
      [120]            <string> 'value117'
      [121]            <string> 'value118'
      [122]            <string> 'value119'
      [123]            <string> 'value120'
      [124]            <string> 'value121'
      [125]            <string> 'value122'
      [126]            <string> 'value123'
      [127]            <string> 'value124'
      [128]            <string> 'value125'
      [129]            <string> 'value126'
      [130]            <string> 'value127'
      [131]            <string> 'value128'
      [132]            <string> 'value129'
      [133]            <string> 'value130'
      [134]            <string> 'value131'
      [135]            <string> 'value132'
      [136]            <string> 'value133'
      [137]            <string> 'value134'
      [138]            <string> 'value135'
      [139]            <string> 'value136'
      [140]            <string> 'value137'
      [141]            <string> 'value138'
      [142]            <string> 'value139'
      [143]            <string> 'value140'
      [144]            <string> 'value141'
      [145]            <string> 'value142'
      [146]            <string> 'value143'
      [147]            <string> 'value144'
      [148]            <string> 'value145'
      [149]            <string> 'value146'
      [150]            <string> 'value147'
      [151]            <string> 'value148'
      [152]            <string> 'value149'
      [153]            <string> 'value150'
      [154]            <string> 'value151'
      [155]            <string> 'value152'
      [156]            <string> 'value153'
      [157]            <string> 'value154'
      [158]            <string> 'value155'
      [159]            <string> 'value156'
      [160]            <string> 'value157'
      [161]            <string> 'value158'
      [162]            <string> 'value159'
      [163]            <string> 'value160'
      [164]            <string> 'value161'
      [165]            <string> 'value162'
      [166]            <string> 'value163'
      [167]            <string> 'value164'
      [168]            <string> 'value165'
      [169]            <string> 'value166'
      [170]            <string> 'value167'
      [171]            <string> 'value168'
      [172]            <string> 'value169'
      [173]            <string> 'value170'
      [174]            <string> 'value171'
      [175]            <string> 'value172'
      [176]            <string> 'value173'
      [177]            <string> 'value174'
      [178]            <string> 'value175'
      [179]            <string> 'value176'
      [180]            <string> 'value177'
      [181]            <string> 'value178'
      [182]            <string> 'value179'
      [183]            <string> 'value180'
      [184]            <string> 'value181'
      [185]            <string> 'value182'
      [186]            <string> 'value183'
      [187]            <string> 'value184'
      [188]            <string> 'value185'
      [189]            <string> 'value186'
      [190]            <string> 'value187'
      [191]            <string> 'value188'
      [192]            <string> 'value189'
      [193]            <string> 'value190'
      [194]            <string> 'value191'
      [195]            <string> 'value192'
      [196]            <string> 'value193'
      [197]            <string> 'value194'
      [198]            <string> 'value195'
      [199]            <string> 'value196'
      [200]            <string> 'value197'
      [201]            <string> 'value198'
      [202]            <string> 'value199'
      [203]            <string> 'value200'
      [204]            <string> 'value201'
      [205]            <string> 'value202'
      [206]            <string> 'value203'
      [207]            <string> 'value204'
      [208]            <string> 'value205'
      [209]            <string> 'value206'
      [210]            <string> 'value207'
      [211]            <string> 'value208'
      [212]            <string> 'value209'
      [213]            <string> 'value210'
      [214]            <string> 'value211'
      [215]            <string> 'value212'
      [216]            <string> 'value213'
      [217]            <string> 'value214'
      [218]            <string> 'value215'
      [219]            <string> 'value216'
      [220]            <string> 'value217'
      [221]            <string> 'value218'
      [222]            <string> 'value219'
      [223]            <string> 'value220'
      [224]            <string> 'value221'
      [225]            <string> 'value222'
      [226]            <string> 'value223'
      [227]            <string> 'value224'
      [228]            <string> 'value225'
      [229]            <string> 'value226'
      [230]            <string> 'value227'
      [231]            <string> 'value228'
      [232]            <string> 'value229'
      [233]            <string> 'value230'
      [234]            <string> 'value231'
      [235]            <string> 'value232'
      [236]            <string> 'value233'
      [237]            <string> 'value234'
      [238]            <string> 'value235'
      [239]            <string> 'value236'
      [240]            <string> 'value237'
      [241]            <string> 'value238'
      [242]            <string> 'value239'
      [243]            <string> 'value240'
      [244]            <string> 'value241'
      [245]            <string> 'value242'
      [246]            <string> 'value243'
      [247]            <string> 'value244'
      [248]            <string> 'value245'
      [249]            <string> 'value246'
      [250]            <string> 'value247'
      [251]            <string> 'value248'
      [252]            <string> 'value249'"
    `)
  })

  it('empty array', () => {
    const items = []
    expect(inspect(items, 'emptyArr', OPTIONS)).toMatchInlineSnapshot(`
      "// const emptyArr: Array
      // Array Is Empty (0 element)"
    `)
  })
})

describe('Inspect Object', () => {
  it('short object', () => {
    const obj = { name: 'John', age: 21, dob: new Date('2000-01-01') }
    expect(inspect(obj, 'smallObject', OPTIONS)).toMatchInlineSnapshot(`
      "// const smallObject: object
      // Full Object Preview
      --------------
      {
        "name": "John",
        "age": 21,
        "dob": 2000-01-01T00:00:00.000Z
      }"
    `)
  })

  it('big object', () => {
    const obj = { name: 'John', age: 21, dob: new Date('2000-01-01'), ...makeBigObject(), otherName: 'John' }
    expect(inspect(obj, 'bigObject', OPTIONS)).toMatchInlineSnapshot(`
      "// const bigObject: object

      // Analysis Summary
      --------------
      Total Entries:   104
      Keys:            <array> '[\\"name\\",\\"age\\",\\"dob\\",\\"key0\\",\\"key1\\",\\"key2\\",\\"key3\\",\\"key4\\",\\"key5\\",\\"key6\\",\\"key7\\",\\"key8\\",\\"key9\\",\\"key10\\",\\"key11\\",\\"key12\\",\\"key13\\",\\"key14\\",\\"key15\\",\\"key16\\",\\"key17\\",\\"key18\\",\\"key19\\",\\"key20\\",\\"key21\\",\\"key22\\",\\"key23\\",\\"key24\\",\\"key25\\",\\"key26\\",\\"key27\\",\\"key28\\",\\"key29\\",\\"key30\\",\\"key31\\",\\"key32\\",\\"key33\\",\\"key34\\",\\"key35\\",\\"key36\\",\\"key37\\",\\"key38\\",\\"key39\\",\\"key40\\",\\"key41\\",\\"key42\\",\\"key43\\",\\"key44\\",\\"key45\\",\\"key46\\",\\"key47\\",\\"key48\\",\\"key49\\",\\"key50\\",\\"key51\\",\\"key52\\",\\"key53\\",\\"key54\\",\\"key55\\",\\"key56\\",\\"key57\\",\\"key58\\",\\"key59\\",\\"key60\\",\\"key61\\",\\"key62\\",\\"key63\\",\\"key64\\",\\"key65\\",\\"key66\\",\\"key67\\",\\"key68\\",\\"key69\\",\\"key70\\",\\"key71\\",\\"key72\\",\\"key73\\",\\"key74\\",\\"key75\\",\\"key76\\",\\"key77\\",\\"key78\\",\\"key79\\",\\"key80\\",\\"key81\\",\\"key82\\",\\"key83\\",\\"key84\\",\\"key85\\",\\"key86\\",\\"key87\\",\\"key88\\",\\"key89\\",\\"key90\\",\\"key91\\",\\"key92\\",\\"key93\\",\\"key94\\",\\"key95\\",\\"key96\\",\\"key97\\",\\"key98\\",\\"key99\\",\\"otherName\\"]'
      Popular Types:   <object> {"'string'":102}
      Unique Values:   103
      Nil Values:      0
      Memory Usage:    1.81KB
      // Object Preview (truncated)
      --------------
      {
        "name": "John",
        "age": 21,
        "dob": 2000-01-01T00:00:00.000Z,
        "key0": "value0",
        "key1": "value1",
        "key2": "value2",
        "key3": "value3",
        "key4": "value4",
        "key5": "value5",
        "key6": "value6",
        "key7": "value7",
        "key8": "value8",
        "key9": "value9",
        "key10": "value10",
        "key11": "value11",
        "key12": "value12",
        "key13": "value13",
        "key14": "value14",
        "key15": "value15",
        "key16": "value16",
      ... (84 more keys)
      }"
    `)
  })

  it('object with large values', () => {
    const obj = { name: 'John', age: 21, large: 'Hello, world\n'.repeat(5000), dob: new Date('2000-01-01') }
    expect(inspect(obj, 'smallObject', OPTIONS)).toMatchInlineSnapshot(`
      "// const smallObject: object
      // Full Object Preview
      --------------
      {
        "name": "John",
        "age": 21,
        "large": "Hello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\nHello, world\\n"
    `)
  })

  it('empty objects', () => {
    const obj = {}
    expect(inspect(obj, 'smallObject', OPTIONS)).toMatchInlineSnapshot(`
      "// const smallObject: object
      // Empty Object {}"
    `)
  })

  it('object with nested values and deep large text', () => {
    const obj = {
      name: 'John',
      age: 21,
      dob: new Date('2000-01-01'),
      that: { IS: { such_a_: { deeply: { nested: { obj: 'Hello, world'.repeat(10000) } } } } }
    }
    expect(inspect(obj, 'smallObject', OPTIONS)).toMatchInlineSnapshot(`
      "// const smallObject: object
      // Full Object Preview
      --------------
      {
        "name": "John",
        "age": 21,
        "dob": 2000-01-01T00:00:00.000Z,
        "that": {
          "IS": {
            "such_a_": {
              "deeply": {
                "nested": {
                  "obj": "Hello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello, worldHello"
    `)
  })
})

describe('Inspect Text', () => {
  it('short text', () => {
    const text = 'Hello, World'
    expect(inspect(text, 'shortText', OPTIONS)).toMatchInlineSnapshot(`
      "// const shortText: string
      <string> 'Hello, World'"
    `)
  })

  it('truncated text', () => {
    const text = 'Hello, World'.repeat(100)
    expect(inspect(text, 'longText', OPTIONS)).toMatchInlineSnapshot(
      `
      "// const longText: string
      <string> 'Hello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, WorldHello, World'"
    `
    )
  })

  it('long text', () => {
    const text = 'Hello, World '.repeat(5000)
    expect(inspect(text, 'superLongText', OPTIONS)).toMatchInlineSnapshot(`"Error: length is not defined"`)
  })

  it('long text with emails, urls etc', () => {
    let text = 'Hello, World \n'.repeat(1000)
    text += '\nsylvain.perron@botpress.com\nhttps://botpress.com\nhello@world.com\nhttps://hi.com/mypage/image.png'
    text += '\nyooy\n'.repeat(1000)

    expect(inspect(text, 'superLongText', OPTIONS)).toMatchInlineSnapshot(`"Error: length is not defined"`)
  })
})
