import initStateToggler from '../Common/toggle-state';
import initScreenfull from '../Common/fullscreen'
import initTriggerResize from '../Common/trigger-resize';

export default () => {

    // Toggle state
    initStateToggler();

    // Fullscreen toggler
    initScreenfull();

    // Trigger resize
    initTriggerResize();

    // NAVBAR SEARCH
    // -----------------------------------
    var navSearch = new navbarSearchInput();

    // Open search input
    var $searchOpen = $('[data-search-open]');

    $searchOpen
        .on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .on('click', navSearch.toggle);

    // Close search input
    var $searchDismiss = $('[data-search-dismiss]');
    var inputSelector = '.navbar-form input[type="text"]';

    $(inputSelector)
        .on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        })
        .on('keyup', function(e) {
            if (e.keyCode == 27) // ESC
                navSearch.dismiss();
        });

    // click anywhere closes the search
    $(document).on('click', navSearch.dismiss);
    // dismissable options
    $searchDismiss
        .on('click', function(e) {
            e.stopPropagation();
        })
        .on('click', navSearch.dismiss);

    function navbarSearchInput() {
        var navbarFormSelector = 'form.navbar-form';
        return {
            toggle: function() {

                var navbarForm = $(navbarFormSelector);

                navbarForm.toggleClass('open');

                var isOpen = navbarForm.hasClass('open');

                navbarForm.find('input')[isOpen ? 'focus' : 'blur']();

            },

            dismiss: function() {
                $(navbarFormSelector)
                    .removeClass('open') // Close control
                    .find('input[type="text"]').blur() // remove focus
                    // .val('') // Empty input
                ;
            }
        };

    }
}
