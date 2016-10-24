// TOGGLE STATE
// -----------------------------------

const STORAGE_KEY_NAME = 'jq-toggleState'

// Helper object to check for words in a phrase //
class WordChecker {
    static hasWord(phrase, word) {
        return new RegExp('(^|\\s)' + word + '(\\s|$)').test(phrase);
    }
    static addWord(phrase, word) {
        if (!this.hasWord(phrase, word)) {
            return (phrase + (phrase ? ' ' : '') + word);
        }
    }
    static removeWord(phrase, word) {
        if (this.hasWord(phrase, word)) {
            return phrase.replace(new RegExp('(^|\\s)*' + word + '(\\s|$)*', 'g'), '');
        }
    }
};

// Handle states to/from localstorage
class StateToggler {

    // Add a state to the browser storage to be restored later
    addState(classname) {
        var data = $.localStorage.get(STORAGE_KEY_NAME);

        if (!data) {
            data = classname;
        } else {
            data = WordChecker.addWord(data, classname);
        }

        $.localStorage.set(STORAGE_KEY_NAME, data);
    }

    // Remove a state from the browser storage
    removeState(classname) {
        var data = $.localStorage.get(STORAGE_KEY_NAME);
        // nothing to remove
        if (!data) return;

        data = WordChecker.removeWord(data, classname);

        $.localStorage.set(STORAGE_KEY_NAME, data);
    }

    // Load the state string and restore the classlist
    restoreState($elem) {
        var data = $.localStorage.get(STORAGE_KEY_NAME);

        // nothing to restore
        if (!data) return;
        $elem.addClass(data);
    }
}

function initStateToggler() {

    var element = $(this);
    var $body = $('body');
    var toggle = new StateToggler();

    // restore body classes on init
    toggle.restoreState($body);

    element
        .on('click', function(e) {
            // e.stopPropagation();

            if (this.tagName === 'A') e.preventDefault();

            var element = $(this),
                classname = element.data('toggleState'),
                target = element.data('target'),
                noPersist = (element.attr('data-no-persist') !== undefined);

            // Specify a target selector to toggle classname
            // use body by default
            var $target = target ? $(target) : $body;

            if (classname) {
                if ($target.hasClass(classname)) {
                    $target.removeClass(classname);
                    if (!noPersist)
                        toggle.removeState(classname);
                } else {
                    $target.addClass(classname);
                    if (!noPersist)
                        toggle.addState(classname);
                }

            }
            // some elements may need this when toggled class change the content size
            // e.g. sidebar collapsed mode and jqGrid
            $(window).resize();

        });

}

export default () => {

    $('[data-toggle-state]').each(initStateToggler);

}