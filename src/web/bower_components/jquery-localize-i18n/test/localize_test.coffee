do ($ = jQuery) ->

  module = QUnit.module
  test = QUnit.test
  testOpts = {}

  asyncTest = (desc, testFn) ->
    test desc, (assert) ->
      done = assert.async()
      deferredAssertions = testFn(assert)
      deferredAssertions.then -> done()

  localizableTagWithRel = (tag, localizeKey, attributes) ->
    t = $("<#{tag}>").attr("rel", "localize[#{localizeKey}]")
    applyTagAttributes(t, attributes)

  localizableTagWithDataLocalize = (tag, localizeKey, attributes) ->
    t = $("<#{tag}>").attr("data-localize", localizeKey)
    applyTagAttributes(t, attributes)

  applyTagAttributes = (tag, attributes) ->
    if attributes.text?
      tag.text(attributes.text)
      delete attributes.text
    if attributes.val?
      tag.val(attributes.val)
      delete attributes.val
    tag.attr(k,v) for k, v of attributes
    tag

  module "Basic Usage",
    beforeEach: ->
      testOpts = language: "ja", pathPrefix: "lang"

  asyncTest "basic tag text substitution", (assert) ->
    t = localizableTagWithRel("p", "basic", text: "basic fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.text(), "basic success"

  asyncTest "basic tag text substitution using data-localize instead of rel", (assert) ->
    t = localizableTagWithDataLocalize("p", "basic", text: "basic fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.text(), "basic success"

  asyncTest "basic tag text substitution with nested key", (assert) ->
    t = localizableTagWithRel("p", "test.nested", text: "nested fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.text(), "nested success"

  asyncTest "basic tag text substitution for special title key", (assert) ->
    t = localizableTagWithDataLocalize("p", "with_title", text: "with_title element fail", title: "with_title title fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.text(), "with_title text success"
      assert.equal t.attr("title"), "with_title title success"

  asyncTest "input tag value substitution", (assert) ->
    t = localizableTagWithRel("input", "test.input", val: "input fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.val(), "input success"

  asyncTest "input test value after second localization without key", (assert) ->
    t = localizableTagWithRel("input", "test.input", val: "input fail")
    d = $.Deferred()
    t.localize("test", testOpts).localizePromise.then ->
      t.localize("test2", testOpts).localizePromise.then ->
        assert.equal t.val(), "input success"
        d.resolve()
    d

  asyncTest "input tag placeholder substitution", (assert) ->
    t = localizableTagWithRel("input", "test.input", placeholder: "placeholder fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("placeholder"), "input success"

  asyncTest "textarea tag placeholder substitution", (assert) ->
    t = localizableTagWithRel("textarea", "test.input", placeholder: "placeholder fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("placeholder"), "input success"

  asyncTest "titled input tag value substitution", (assert) ->
    t = localizableTagWithRel("input", "test.input_as_obj", val: "input_as_obj fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.val(), "input_as_obj value success"

  asyncTest "titled input tag title substitution", (assert) ->
    t = localizableTagWithRel("input", "test.input_as_obj", val: "input_as_obj fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("title"), "input_as_obj title success"

  asyncTest "titled input tag placeholder substitution", (assert) ->
    t = localizableTagWithRel("input", "test.input_as_obj", placeholder: "placeholder fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("placeholder"), "input_as_obj value success"

  asyncTest "image tag src, alt, and title substitution", (assert) ->
    t = localizableTagWithRel("img", "test.ruby_image", src: "ruby_square.gif", alt: "a square ruby", title: "A Square Ruby")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("src"), "ruby_round.gif"
      assert.equal t.attr("alt"), "a round ruby"
      assert.equal t.attr("title"), "A Round Ruby"

  asyncTest "link tag href substitution", (assert) ->
    t = localizableTagWithRel("a", "test.link", href: "http://fail", text: "fail")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("href"), "http://success"
      assert.equal t.text(), "success"

  asyncTest "chained call", (assert) ->
    t = localizableTagWithRel("p", "basic", text: "basic fail")
    t.localize("test", testOpts).localize("test", testOpts).localizePromise.then ->
      assert.equal t.text(), "basic success"

  asyncTest "alternative file extension", (assert) ->
    t = localizableTagWithRel("p", "basic", text: "basic fail")
    t.localize("test", $.extend({ fileExtension: "foo" }, testOpts)).localizePromise.then ->
      assert.equal t.text(), "basic success foo"

  selectTag = null
  module "Basic Usage for <options",
    beforeEach: ->
      testOpts = language: "ja", pathPrefix: "lang"
      selectTag = $('<select>
          <optgroup rel="localize[test.optgroup]" label="optgroup fail">
            <option rel="localize[test.option]" value="1">option fail</option>
          </optgroup>
        </select>')

  asyncTest "optgroup tag label substitution", (assert) ->
    t = selectTag.find("optgroup")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.attr("label"), "optgroup success"

  asyncTest "option tag text substitution", (assert) ->
    t = selectTag.find("option")
    t.localize("test", testOpts).localizePromise.then ->
      assert.equal t.text(), "option success"

  module "Options"

  asyncTest "fallback language loads", (assert) ->
    opts = language: "fo", fallback: "ja", pathPrefix: "lang"
    t = localizableTagWithRel("p", "basic", text: "basic fail")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "basic success"

  asyncTest "pathPrefix loads lang files from custom path", (assert) ->
    opts =  language: "fo", pathPrefix: "/test/lang/custom"
    t = localizableTagWithRel("p", "path_prefix", text: "pathPrefix fail")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "pathPrefix success"

  asyncTest "custom callback is fired", (assert) ->
    opts = language: "ja", pathPrefix: "lang"
    opts.callback = (data, defaultCallback) ->
      data.custom_callback = "custom callback success"
      defaultCallback(data)
    t = localizableTagWithRel("p", "custom_callback", text: "custom callback fail")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "custom callback success"

  asyncTest "language with country code", (assert) ->
    opts = language: "ja-XX", pathPrefix: "lang"
    t = localizableTagWithRel("p", "message", text: "country code fail")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "country code success"

  # Ref: https://github.com/coderifous/jquery-localize/issues/50
  asyncTest "three-letter language code", (assert) ->
    opts = language: "ast", pathPrefix: "lang"
    t = localizableTagWithRel("p", "basic", text: "basic fail")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "basic success"

  # Ref: https://github.com/coderifous/jquery-localize/issues/47
  asyncTest "language-country code with no language-only file", (assert) ->
    opts = language: "zh-CN", pathPrefix: "lang"
    t = localizableTagWithRel("p", "basic", text: "basic fail")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "basic success zh-CN"

  module "Language optimization"

  asyncTest "skipping language using string match", (assert) ->
    opts = language: "en", pathPrefix: "lang", skipLanguage: "en"
    t = localizableTagWithRel("p", "en_message", text: "en not loaded")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "en not loaded"

  asyncTest "skipping language using regex match", (assert) ->
    opts = language: "en-US", pathPrefix: "lang", skipLanguage: /^en/
    t = localizableTagWithRel("p", "en_us_message", text: "en-US not loaded")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "en-US not loaded"

  asyncTest "skipping language using array match", (assert) ->
    opts = language: "en", pathPrefix: "lang", skipLanguage: ["en", "en-US"]
    t = localizableTagWithRel("p", "en_message", text: "en not loaded")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "en not loaded"

  asyncTest "skipping region language using array match", (assert) ->
    opts = language: "en-US", pathPrefix: "lang", skipLanguage: ["en", "en-US"]
    t = localizableTagWithRel("p", "en_us_message", text: "en-US not loaded")
    t.localize("test", opts).localizePromise.then ->
      assert.equal t.text(), "en-US not loaded"
