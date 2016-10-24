###
Copyright (c) Jim Garvin (http://github.com/coderifous), 2008.
Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
Written by Jim Garvin (@coderifous) for use on LMGTFY.com.
http://github.com/coderifous/jquery-localize
Based off of Keith Wood's Localisation jQuery plugin.
http://keith-wood.name/localisation.html
###

do ($ = jQuery) ->

  # Ensures language code is in the format aa-AA.
  normaliseLang = (lang) ->
    lang = lang.replace(/_/, '-').toLowerCase()
    if lang.length > 3
      lang = lang.substring(0, 3) + lang.substring(3).toUpperCase()
    lang

  # Mozilla uses .language, IE uses .userLanguage
  $.defaultLanguage = normaliseLang(if navigator.languages and navigator.languages.length > 0 then navigator.languages[0] else navigator.language or navigator.userLanguage)

  $.localize = (pkg, options = {}) ->
    wrappedSet           = this
    intermediateLangData = {}
    fileExtension        = options.fileExtension || "json"
    deferred = $.Deferred()

    loadLanguage = (pkg, lang, level = 1) ->
      switch level
        when 1
          intermediateLangData = {}
          if options.loadBase
            file = pkg + ".#{fileExtension}"
            jsonCall(file, pkg, lang, level)
          else
            loadLanguage(pkg, lang, 2)
        when 2
          file = "#{pkg}-#{lang.split('-')[0]}.#{fileExtension}"
          jsonCall(file, pkg, lang, level)
        when 3
          file = "#{pkg}-#{lang.split('-').slice(0,2).join('-')}.#{fileExtension}"
          jsonCall(file, pkg, lang, level)
        else
          # ensure deferred is resolved
          deferred.resolve()

    jsonCall = (file, pkg, lang, level) ->
      file = "#{options.pathPrefix}/#{file}" if options.pathPrefix?
      successFunc = (d) ->
        $.extend(intermediateLangData, d)
        notifyDelegateLanguageLoaded(intermediateLangData)
        loadLanguage(pkg, lang, level + 1)
      errorFunc = ->
        if level == 2 && lang.indexOf('-') > -1
          # the language-only file may not exist, try the language-country file next
          # (ref: https://github.com/coderifous/jquery-localize/issues/47)
          loadLanguage(pkg, lang, level + 1)
        else if options.fallback && options.fallback != lang
          loadLanguage(pkg, options.fallback)
      ajaxOptions =
        url: file
        dataType: "json"
        async: true
        timeout: if options.timeout? then options.timeout else 500
        success: successFunc
        error: errorFunc
      # hack to work with serving from local file system.
      # local file:// urls won't work in chrome:
      # http://code.google.com/p/chromium/issues/detail?id=40787
      if window.location.protocol == "file:"
        ajaxOptions.error = (xhr) -> successFunc($.parseJSON(xhr.responseText))
      $.ajax(ajaxOptions)

    notifyDelegateLanguageLoaded = (data) ->
      if options.callback?
        options.callback(data, defaultCallback)
      else
        defaultCallback(data)

    defaultCallback = (data) ->
      $.localize.data[pkg] = data
      wrappedSet.each ->
        elem  = $(this)
        key   = elem.data("localize")
        key ||= elem.attr("rel").match(/localize\[(.*?)\]/)[1]
        value = valueForKey(key, data)
        localizeElement(elem, key, value) if value?

    localizeElement = (elem, key, value) ->
      if          elem.is('input')       then localizeInputElement(elem, key, value)
      else if     elem.is('textarea')    then localizeInputElement(elem, key, value)
      else if     elem.is('img')         then localizeImageElement(elem, key, value)
      else if     elem.is('optgroup')    then localizeOptgroupElement(elem, key, value)
      else unless $.isPlainObject(value) then elem.html(value)
      localizeForSpecialKeys(elem, value) if $.isPlainObject(value)

    localizeInputElement = (elem, key, value) ->
      val = if $.isPlainObject(value) then value.value else value
      if elem.is("[placeholder]")
        elem.attr("placeholder", val)
      else
        elem.val(val)

    localizeForSpecialKeys = (elem, value) ->
      setAttrFromValueForKey(elem, "title", value)
      setAttrFromValueForKey(elem, "href", value)
      setTextFromValueForKey(elem, "text", value)

    localizeOptgroupElement = (elem, key, value) ->
      elem.attr("label", value)

    localizeImageElement = (elem, key, value) ->
      setAttrFromValueForKey(elem, "alt", value)
      setAttrFromValueForKey(elem, "src", value)

    valueForKey = (key, data) ->
      keys  = key.split(/\./)
      value = data
      for key in keys
        value = if value? then value[key] else null
      value

    setAttrFromValueForKey = (elem, key, value) ->
      value = valueForKey(key, value)
      elem.attr(key, value) if value?

    setTextFromValueForKey = (elem, key, value) ->
      value = valueForKey(key, value)
      elem.text(value) if value?

    regexify = (string_or_regex_or_array) ->
      if typeof(string_or_regex_or_array) == "string"
        "^" + string_or_regex_or_array + "$"
      else if string_or_regex_or_array.length?
        (regexify(thing) for thing in string_or_regex_or_array).join("|")
      else
        string_or_regex_or_array

    lang = normaliseLang(if options.language then options.language else $.defaultLanguage)
    if (options.skipLanguage && lang.match(regexify(options.skipLanguage)))
      deferred.resolve()
    else
      loadLanguage(pkg, lang, 1)

    wrappedSet.localizePromise = deferred

    wrappedSet

  $.fn.localize = $.localize
  $.localize.data = {}
