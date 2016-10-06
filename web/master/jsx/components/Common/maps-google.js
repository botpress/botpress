// Google Maps
// -----------------------------------

export default function() {

    if (!$.fn.gMap) return;

    // Custom core styles
    // Get more styles from http://snazzymaps.com/style/29/light-monochrome
    // - Just replace and assign to 'MapStyles' the new style array
    var MapStyles = [{featureType:'water',stylers:[{visibility:'on'},{color:'#bdd1f9'}]},{featureType:'all',elementType:'labels.text.fill',stylers:[{color:'#334165'}]},{featureType:'landscape',stylers:[{color:'#e9ebf1'}]},{featureType:'road.highway',elementType:'geometry',stylers:[{color:'#c5c6c6'}]},{featureType:'road.arterial',elementType:'geometry',stylers:[{color:'#fff'}]},{featureType:'road.local',elementType:'geometry',stylers:[{color:'#fff'}]},{featureType:'transit',elementType:'geometry',stylers:[{color:'#d8dbe0'}]},{featureType:'poi',elementType:'geometry',stylers:[{color:'#cfd5e0'}]},{featureType:'administrative',stylers:[{visibility:'on'},{lightness:33}]},{featureType:'poi.park',elementType:'labels',stylers:[{visibility:'on'},{lightness:20}]},{featureType:'road',stylers:[{color:'#d8dbe0',lightness:20}]}];

    var gMapRefs = [];

    var $this = $(this),
        addresses = $this.data('address') && $this.data('address').split(
            ';'),
        titles = $this.data('title') && $this.data('title').split(';'),
        zoom = $this.data('zoom') || 14,
        maptype = $this.data('maptype') || 'ROADMAP', // or 'TERRAIN'
        markers = [];

    if (addresses) {
        for (var a in addresses) {
            if (typeof addresses[a] == 'string') {
                markers.push({
                    address: addresses[a],
                    html: (titles && titles[a]) || '',
                    popup: true /* Always popup */
                });
            }
        }

        var options = {
            controls: {
                panControl: true,
                zoomControl: true,
                mapTypeControl: true,
                scaleControl: true,
                streetViewControl: true,
                overviewMapControl: true
            },
            scrollwheel: false,
            maptype: maptype,
            markers: markers,
            zoom: zoom
                // More options https://github.com/marioestrada/jQuery-gMap
        };

        var gMap = $this.gMap(options);

        var ref = gMap.data('gMap.reference');
        // save in the map references list
        gMapRefs.push(ref);

        // set the styles
        if ($this.data('styled') !== undefined) {

            ref.setOptions({
                styles: MapStyles
            });

        }
    }

} //initGmap
