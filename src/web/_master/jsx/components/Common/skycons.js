// SKYCONS
// -----------------------------------

export default function() {
    var element = $(this),
        skycons = new Skycons({
            'color': (element.data('color') || 'white')
        });

    element.html('<canvas width="' + element.data('width') + '" height="' + element.data('height') + '"></canvas>');

    skycons.add(element.children()[0], element.data('skycon'));

    skycons.play();
}