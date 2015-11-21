
class MapContainer {
    constructor(selector, topology) {
        this.selection = d3.select(selector);
        this.topology = topology;
        this.topoLayer = omnivore.topojson.parse(topology);
        this.tooltip = new TooltipControl();

        this.map = this.createMap();
    }

    createMap() {
        const id = 'leaflet-map';
        const container = this.selection
            .append('div')
            .attr('class', 'map-container')
            .attr('id', id);

        const map = L.map(id, {
            minZoom: MapConstants.MIN_ZOOM,
            maxZoom: MapConstants.MAX_ZOOM
        });

        map.setView(MapConstants.INITIAL_CENTER, MapConstants.INITIAL_ZOOM);

        L.tileLayer(MapConstants.BASE_LAYER_URL, {
            opacity: MapConstants.BASE_LAYER_OPACITY,
            attribution: MapConstants.ATTRIBUTION
        }).addTo(map);

        map.addControl(this.tooltip);

        map.addLayer(this.topoLayer);

        return map;
    }

    display(model) {
        const view = new MapView(this.map, model, this.topoLayer, this.selection, this.tooltip);

        view.display()
    }
}

