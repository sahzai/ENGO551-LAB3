// Initialize the map
var mymap = L.map('map').setView([51.0447, -114.0719], 12);

// Add the base OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

// Define custom cluster icons
var customClusterIcons = [
    {
        iconSize: [40, 40],
        className: 'custom-cluster-1',
        html: '<div class="custom-cluster-icon">1</div>'
    },
    {
        iconSize: [50, 50],
        className: 'custom-cluster-2',
        html: '<div class="custom-cluster-icon">2</div>'
    },
    {
        iconSize: [60, 60],
        className: 'custom-cluster-3',
        html: '<div class="custom-cluster-icon">3</div>'
    }
    // Add more as needed for different cluster sizes
];

// Create a marker cluster group with custom cluster icons
var markers = L.markerClusterGroup({
    iconCreateFunction: function(cluster) {
        var childCount = cluster.getAllChildMarkers().length;
        var customIcon = '';

        // Select custom icon based on the total number of markers in the cluster
        if (childCount === 1) {
            customIcon = customClusterIcons[0];
        } else if (childCount === 2) {
            customIcon = customClusterIcons[1];
        } else if (childCount >= 3) {
            customIcon = customClusterIcons[2];
        }

        return L.divIcon({
            html: '<div class="custom-cluster-icon ' + customIcon.className + '">' + childCount + '</div>',
            className: 'custom-cluster ' + customIcon.className,
            iconSize: customIcon.iconSize
        });
    }
});

// Function to fetch GeoJSON data based on selected date range and add markers to the map
function getDataAndAddToMap() {
    var startDate = document.getElementById('datePickerStart').value;
    var endDate = document.getElementById('datePickerEnd').value;

    // Construct the API URL with the selected date range
    var apiUrl = 'https://data.calgary.ca/resource/c2es-76ed.geojson?$where=issueddate > \'' + startDate + '\' and issueddate < \'' + endDate + '\'';

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Clear previous markers from the map
            markers.clearLayers();

            // Array to store individual markers
            var individualMarkers = [];

            // Add markers for each permit location
            data.features.forEach(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    var marker = L.marker([
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0]
                    ], {
                        icon: L.divIcon({
                            html: '<div class="custom-marker-icon">M</div>',
                            className: 'custom-marker'
                        })
                    });

                    // Store the feature properties in the marker for later use
                    marker.feature = feature;

                    // Add the marker to the individualMarkers array
                    individualMarkers.push(marker);
                } else {
                    console.log("Invalid feature:", feature);
                }
            });

            // Add the individual markers to the marker cluster group
            markers.addLayers(individualMarkers);

            // Add the marker cluster group to the map
            mymap.addLayer(markers);

            // Fit the map to the bounds of the markers
            mymap.fitBounds(markers.getBounds());
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

// Event listener for when a cluster is clicked
markers.on('clusterclick', function (event) {
    var cluster = event.layer;
    var markers = cluster.getAllChildMarkers();
    var popupContent = '';

    // Create popup content with data from all markers in the cluster
    markers.forEach(marker => {
        popupContent += '<b>Issued Date:</b> ' + marker.feature.properties.issueddate + '<br>';
        popupContent += '<b>Work Class Group:</b> ' + marker.feature.properties.workclassgroup + '<br>';
        popupContent += '<b>Contractor Name:</b> ' + marker.feature.properties.contractorname + '<br>';
        popupContent += '<b>Community Name:</b> ' + marker.feature.properties.communityname + '<br>';
        popupContent += '<b>Original Address:</b> ' + marker.feature.properties.originaladdress + '<br><br>';
    });

    // Create and open a popup with the combined data
    var popup = L.popup().setLatLng(cluster.getLatLng()).setContent(popupContent);
    mymap.openPopup(popup);
});
    