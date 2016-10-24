// Panel Tools
// -----------------------------------
(function($, window, document) {
    'use strict';

    var panelSelector = '[data-tool="panel-dismiss"]',
        removeEvent = 'panel.remove',
        removedEvent = 'panel.removed';

    $(document).on('click', panelSelector, function(e) {
        e.preventDefault();
        // find the first parent panel
        var parent = $(this).closest('.panel');
        var deferred = new $.Deferred();

        // Trigger the event and finally remove the element
        parent.trigger(removeEvent, [parent, deferred]);
        // needs resolve() to be called
        deferred.done(removeElement);

        function removeElement() {
            if ($.support.animation) {
                parent.animo({
                    animation: 'bounceOut'
                }, destroyPanel);
            } else destroyPanel();
        }

        function destroyPanel() {
            var col = parent.parent();

            $.when(parent.trigger(removedEvent, [parent]))
                .done(function() {
                    parent.remove();
                    // remove the parent if it is a row and is empty and not a sortable (portlet)
                    col
                        .trigger(removedEvent) // An event to catch when the panel has been removed from DOM
                        .filter(function() {
                            var el = $(this);
                            return (el.is('[class*="col-"]:not(.sortable)') && el.children('*').length === 0);
                        }).remove();
                });



        }

    });

}(jQuery, window, document));

/**
 * Refresh panels
 * [data-tool="panel-refresh"]
 * [data-spinner="standard"]
 */
(function($, window, document) {
    'use strict';
    var panelSelector = '[data-tool="panel-refresh"]',
        refreshEvent = 'panel.refresh',
        whirlClass = 'whirl',
        defaultSpinner = 'standard';

    // method to clear the spinner when done
    function removeSpinner() {
        this.removeClass(whirlClass);
    }

    // catch clicks to toggle panel refresh
    $(document).on('click', panelSelector, function(e) {
        e.preventDefault();
        var $this = $(this),
            panel = $this.parents('.panel').eq(0),
            spinner = $this.data('spinner') || defaultSpinner;

        // start showing the spinner
        panel.addClass(whirlClass + ' ' + spinner);

        // attach as public method
        panel.removeSpinner = removeSpinner;

        // Trigger the event and send the panel object
        $this.trigger(refreshEvent, [panel]);

    });


}(jQuery, window, document));