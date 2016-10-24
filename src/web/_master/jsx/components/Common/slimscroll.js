// SLIMSCROLL
// -----------------------------------

export default function() {

    var element = $(this),
        defaultHeight = 250;

    element.slimScroll({
        height: (element.data('height') || defaultHeight)
    });

}