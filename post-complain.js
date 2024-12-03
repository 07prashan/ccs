// Initialize Google Maps
function initMap() {
    var mapOptions = {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8
    };

    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    var marker = new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        draggable: true
    });

    google.maps.event.addListener(marker, 'dragend', function(event) {
        document.getElementById('location').value = event.latLng.lat() + ", " + event.latLng.lng();
    });
}
