(function($) {
  var applyTagAttributes, asyncTest, localizableTagWithDataLocalize, localizableTagWithRel, module, selectTag, test, testOpts;
  module = QUnit.module;
  test = QUnit.test;
  testOpts = {};
  asyncTest = function(desc, testFn) {
    return test(desc, function(assert) {
      var deferredAssertions, done;
      done = assert.async();
      deferredAssertions = testFn(assert);
      return deferredAssertions.then(function() {
        return done();
      });
    });
  };
  localizableTagWithRel = function(tag, localizeKey, attributes) {
    var t;
    t = $("<" + tag + ">").attr("rel", "localize[" + localizeKey + "]");
    return applyTagAttributes(t, attributes);
  };
  localizableTagWithDataLocalize = function(tag, localizeKey, attributes) {
    var t;
    t = $("<" + tag + ">").attr("data-localize", localizeKey);
    return applyTagAttributes(t, attributes);
  };
  applyTagAttributes = function(tag, attributes) {
    var k, v;
    if (attributes.text != null) {
      tag.text(attributes.text);
      delete attributes.text;
    }
    if (attributes.val != null) {
      tag.val(attributes.val);
      delete attributes.val;
    }
    for (k in attributes) {
      v = attributes[k];
      tag.attr(k, v);
    }
    return tag;
  };
  module("Basic Usage", {
    beforeEach: function() {
      return testOpts = {
        language: "ja",
        pathPrefix: "lang"
      };
    }
  });
  asyncTest("basic tag text substitution", function(assert) {
    var t;
    t = localizableTagWithRel("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success");
    });
  });
  asyncTest("basic tag text substitution using data-localize instead of rel", function(assert) {
    var t;
    t = localizableTagWithDataLocalize("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success");
    });
  });
  asyncTest("basic tag text substitution with nested key", function(assert) {
    var t;
    t = localizableTagWithRel("p", "test.nested", {
      text: "nested fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.text(), "nested success");
    });
  });
  asyncTest("basic tag text substitution for special title key", function(assert) {
    var t;
    t = localizableTagWithDataLocalize("p", "with_title", {
      text: "with_title element fail",
      title: "with_title title fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      assert.equal(t.text(), "with_title text success");
      return assert.equal(t.attr("title"), "with_title title success");
    });
  });
  asyncTest("input tag value substitution", function(assert) {
    var t;
    t = localizableTagWithRel("input", "test.input", {
      val: "input fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.val(), "input success");
    });
  });
  asyncTest("input test value after second localization without key", function(assert) {
    var d, t;
    t = localizableTagWithRel("input", "test.input", {
      val: "input fail"
    });
    d = $.Deferred();
    t.localize("test", testOpts).localizePromise.then(function() {
      return t.localize("test2", testOpts).localizePromise.then(function() {
        assert.equal(t.val(), "input success");
        return d.resolve();
      });
    });
    return d;
  });
  asyncTest("input tag placeholder substitution", function(assert) {
    var t;
    t = localizableTagWithRel("input", "test.input", {
      placeholder: "placeholder fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.attr("placeholder"), "input success");
    });
  });
  asyncTest("textarea tag placeholder substitution", function(assert) {
    var t;
    t = localizableTagWithRel("textarea", "test.input", {
      placeholder: "placeholder fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.attr("placeholder"), "input success");
    });
  });
  asyncTest("titled input tag value substitution", function(assert) {
    var t;
    t = localizableTagWithRel("input", "test.input_as_obj", {
      val: "input_as_obj fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.val(), "input_as_obj value success");
    });
  });
  asyncTest("titled input tag title substitution", function(assert) {
    var t;
    t = localizableTagWithRel("input", "test.input_as_obj", {
      val: "input_as_obj fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.attr("title"), "input_as_obj title success");
    });
  });
  asyncTest("titled input tag placeholder substitution", function(assert) {
    var t;
    t = localizableTagWithRel("input", "test.input_as_obj", {
      placeholder: "placeholder fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.attr("placeholder"), "input_as_obj value success");
    });
  });
  asyncTest("image tag src, alt, and title substitution", function(assert) {
    var t;
    t = localizableTagWithRel("img", "test.ruby_image", {
      src: "ruby_square.gif",
      alt: "a square ruby",
      title: "A Square Ruby"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      assert.equal(t.attr("src"), "ruby_round.gif");
      assert.equal(t.attr("alt"), "a round ruby");
      return assert.equal(t.attr("title"), "A Round Ruby");
    });
  });
  asyncTest("link tag href substitution", function(assert) {
    var t;
    t = localizableTagWithRel("a", "test.link", {
      href: "http://fail",
      text: "fail"
    });
    return t.localize("test", testOpts).localizePromise.then(function() {
      assert.equal(t.attr("href"), "http://success");
      return assert.equal(t.text(), "success");
    });
  });
  asyncTest("chained call", function(assert) {
    var t;
    t = localizableTagWithRel("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", testOpts).localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success");
    });
  });
  asyncTest("alternative file extension", function(assert) {
    var t;
    t = localizableTagWithRel("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", $.extend({
      fileExtension: "foo"
    }, testOpts)).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success foo");
    });
  });
  selectTag = null;
  module("Basic Usage for <options", {
    beforeEach: function() {
      testOpts = {
        language: "ja",
        pathPrefix: "lang"
      };
      return selectTag = $('<select> <optgroup rel="localize[test.optgroup]" label="optgroup fail"> <option rel="localize[test.option]" value="1">option fail</option> </optgroup> </select>');
    }
  });
  asyncTest("optgroup tag label substitution", function(assert) {
    var t;
    t = selectTag.find("optgroup");
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.attr("label"), "optgroup success");
    });
  });
  asyncTest("option tag text substitution", function(assert) {
    var t;
    t = selectTag.find("option");
    return t.localize("test", testOpts).localizePromise.then(function() {
      return assert.equal(t.text(), "option success");
    });
  });
  module("Options");
  asyncTest("fallback language loads", function(assert) {
    var opts, t;
    opts = {
      language: "fo",
      fallback: "ja",
      pathPrefix: "lang"
    };
    t = localizableTagWithRel("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success");
    });
  });
  asyncTest("pathPrefix loads lang files from custom path", function(assert) {
    var opts, t;
    opts = {
      language: "fo",
      pathPrefix: "/test/lang/custom"
    };
    t = localizableTagWithRel("p", "path_prefix", {
      text: "pathPrefix fail"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "pathPrefix success");
    });
  });
  asyncTest("custom callback is fired", function(assert) {
    var opts, t;
    opts = {
      language: "ja",
      pathPrefix: "lang"
    };
    opts.callback = function(data, defaultCallback) {
      data.custom_callback = "custom callback success";
      return defaultCallback(data);
    };
    t = localizableTagWithRel("p", "custom_callback", {
      text: "custom callback fail"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "custom callback success");
    });
  });
  asyncTest("language with country code", function(assert) {
    var opts, t;
    opts = {
      language: "ja-XX",
      pathPrefix: "lang"
    };
    t = localizableTagWithRel("p", "message", {
      text: "country code fail"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "country code success");
    });
  });
  asyncTest("three-letter language code", function(assert) {
    var opts, t;
    opts = {
      language: "ast",
      pathPrefix: "lang"
    };
    t = localizableTagWithRel("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success");
    });
  });
  asyncTest("language-country code with no language-only file", function(assert) {
    var opts, t;
    opts = {
      language: "zh-CN",
      pathPrefix: "lang"
    };
    t = localizableTagWithRel("p", "basic", {
      text: "basic fail"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "basic success zh-CN");
    });
  });
  module("Language optimization");
  asyncTest("skipping language using string match", function(assert) {
    var opts, t;
    opts = {
      language: "en",
      pathPrefix: "lang",
      skipLanguage: "en"
    };
    t = localizableTagWithRel("p", "en_message", {
      text: "en not loaded"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "en not loaded");
    });
  });
  asyncTest("skipping language using regex match", function(assert) {
    var opts, t;
    opts = {
      language: "en-US",
      pathPrefix: "lang",
      skipLanguage: /^en/
    };
    t = localizableTagWithRel("p", "en_us_message", {
      text: "en-US not loaded"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "en-US not loaded");
    });
  });
  asyncTest("skipping language using array match", function(assert) {
    var opts, t;
    opts = {
      language: "en",
      pathPrefix: "lang",
      skipLanguage: ["en", "en-US"]
    };
    t = localizableTagWithRel("p", "en_message", {
      text: "en not loaded"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "en not loaded");
    });
  });
  return asyncTest("skipping region language using array match", function(assert) {
    var opts, t;
    opts = {
      language: "en-US",
      pathPrefix: "lang",
      skipLanguage: ["en", "en-US"]
    };
    t = localizableTagWithRel("p", "en_us_message", {
      text: "en-US not loaded"
    });
    return t.localize("test", opts).localizePromise.then(function() {
      return assert.equal(t.text(), "en-US not loaded");
    });
  });
})(jQuery);
