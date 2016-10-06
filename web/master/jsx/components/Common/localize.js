// TRANSLATION
// -----------------------------------

const preferredLang = 'en';
const pathPrefix    = 'server/i18n'; // folder of json files
const packName      = 'site';
const storageKey    = 'jq-appLang';

export default () => {

    if (!$.fn.localize) return;

    // detect saved language or use default
    var currLang = $.localStorage.get(storageKey) || preferredLang;
    // set initial options
    var opts = {
        language: currLang,
        pathPrefix: pathPrefix,
        callback: function(data, defaultCallback) {
            $.localStorage.set(storageKey, currLang); // save the language
            defaultCallback(data);
        }
    };

    // Set initial language
    setLanguage(opts);

    // Listen for changes
    $(document).on('click', '[data-set-lang]', function() {

        currLang = $(this).data('setLang');

        if (currLang) {

            opts.language = currLang;

            setLanguage(opts);

            activateDropdown($(this));
        }

    });


    function setLanguage(options) {
        $("[data-localize]").localize(packName, options);
    }

    // Set the current clicked text as the active dropdown text
    function activateDropdown(elem) {
        var menu = elem.parents('.dropdown-menu');
        if (menu.length) {
            var toggle = menu.prev('button, a');
            toggle.text(elem.text());
        }
    }

}