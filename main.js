// مەودای بینینی پارێزگای سلێمانی، هەڵەبجە و ئیدارەی سەربەخۆی ڕاپەڕین
var sulaymaniyahBounds = L.latLngBounds(
    L.latLng(34.0000, 44.0000),
    L.latLng(36.8500, 47.0000)
);

var map = L.map('map', {
    center: [35.4250, 45.5000],
    zoom: 8,
    minZoom: 8,
    maxZoom: 17,
    maxBounds: sulaymaniyahBounds,
    maxBoundsViscosity: 1.0
});

var streetMapLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
});
var satelliteMapLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri - Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    }
);
var satelliteLabelsLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    {
        maxZoom: 19,
        opacity: 0.9,
        attribution: 'Labels &copy; Esri'
    }
);
var streetMapToggle = document.getElementById('streetMapToggle');
var satelliteMapButton = document.getElementById('satelliteMapButton');
var currentMapMode = '2d';

function syncLeafletBaseLayers() {
    [streetMapLayer, satelliteMapLayer, satelliteLabelsLayer].forEach(function (layer) {
        map.removeLayer(layer);
    });

    if (currentMapMode === '2d' && streetMapToggle.checked) {
        streetMapLayer.addTo(map);
    } else if (currentMapMode === 'satellite') {
        satelliteMapLayer.addTo(map);
        if (streetMapToggle.checked) satelliteLabelsLayer.addTo(map);
    }
}

syncLeafletBaseLayers();
streetMapToggle.addEventListener('change', syncLeafletBaseLayers);

var outsideMaskPane = map.createPane('outsideMapMask');
outsideMaskPane.style.zIndex = 680;
outsideMaskPane.style.pointerEvents = 'none';

var mapSouth = sulaymaniyahBounds.getSouth();
var mapNorth = sulaymaniyahBounds.getNorth();
var mapWest = sulaymaniyahBounds.getWest();
var mapEast = sulaymaniyahBounds.getEast();
var maskStyle = {
    pane: 'outsideMapMask',
    stroke: false,
    fillColor: '#ffffff',
    fillOpacity: 1,
    interactive: false
};

L.rectangle([[mapNorth, -180], [85.05112878, 180]], maskStyle).addTo(map);
L.rectangle([[-85.05112878, -180], [mapSouth, 180]], maskStyle).addTo(map);
L.rectangle([[mapSouth, -180], [mapNorth, mapWest]], maskStyle).addTo(map);
L.rectangle([[mapSouth, mapEast], [mapNorth, 180]], maskStyle).addTo(map);

// ٣. دروستکردنی چینێک بۆ هەڵگرتنی ئەو سنوورانەی کە بە دەست دەیانکشێریت
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var storageStatus = document.getElementById('storageStatus');
var accessStatus = document.getElementById('accessStatus');
var adminLogoutButton = document.getElementById('adminLogoutButton');
var migrateLocalDataButton = document.getElementById('migrateLocalDataButton');
var adminLoginForm = document.getElementById('adminLoginForm');
var adminEmailInput = document.getElementById('adminEmail');
var adminPasswordInput = document.getElementById('adminPassword');
var adminLoginError = document.getElementById('adminLoginError');
var adminPasswordLabel = document.getElementById('adminPasswordLabel');
var gateLoginButton = document.getElementById('gateLoginButton');
var mapAccessTitle = document.getElementById('mapAccessTitle');
var passwordRecoveryPending = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
var loginSubmissionPending = false;
var locationResult = document.getElementById('locationResult');
var regionFilter = document.getElementById('regionFilter');
var applyRegionStyleButton = document.getElementById('applyRegionStyle');
var refreshRegionInfoButton = document.getElementById('refreshRegionInfo');
var editNamedLabelButton = document.getElementById('editNamedLabelButton');
var createSubRegionButton = document.getElementById('createSubRegionButton');
var deleteSelectedRegionButton = document.getElementById('deleteSelectedRegionButton');
var deleteSelectedSubRegionButton = document.getElementById('deleteSelectedSubRegionButton');
var deleteRegionDialog = document.getElementById('deleteRegionDialog');
var deleteRegionMessage = document.getElementById('deleteRegionMessage');
var confirmDeleteRegionButton = document.getElementById('confirmDeleteRegion');
var cancelDeleteRegionButton = document.getElementById('cancelDeleteRegion');
var pendingDeleteRegionLayer = null;
var regionInfoResults = document.getElementById('regionInfoResults');
var selectedRegionLayer = null;
var selectedLabelLayer = null;
var editingLabelLayer = null;
var isDrawingSubRegion = false;
var pendingSubRegionParent = null;
var pendingRegionParentId = null;
var subRegionDrawHandler = null;
var regionInfoCache = new WeakMap();
var regionInfoAbortController = null;
var regionInfoRequestLayer = null;

var borderColorInput = document.getElementById('borderColor');
var fillColorInput = document.getElementById('fillColor');
var fillOpacityInput = document.getElementById('fillOpacity');
var opacityValue = document.getElementById('opacityValue');
var namedPointColorInput = document.getElementById('namedPointColor');
var applyNamedPointColorButton = document.getElementById('applyNamedPointColor');
var defaultNamedPointColor = '#e11d48';
var map2DButton = document.getElementById('map2DButton');
var map3DButton = document.getElementById('map3DButton');
var satelliteModeButton = document.getElementById('satelliteMapButton');
var addNamedPointButton = document.getElementById('addNamedPointButton');
var map3DContainer = document.getElementById('map3d');
var map3D = null;
var map3DRegionLabels = new Map();
var isPlacingNamedPoint = false;
var namedPointDialog = document.getElementById('namedPointDialog');
var namedPointForm = document.getElementById('namedPointForm');
var namedPointNameInput = document.getElementById('namedPointName');
var namedPointTitle = document.getElementById('namedPointTitle');
var namedPointNameLabel = document.getElementById('namedPointNameLabel');
var cancelNamedPointButton = document.getElementById('cancelNamedPoint');
var pendingNamedPointLatLng = null;
var pendingRegionLayer = null;
var supabaseUrl = window.MAP_SUPABASE_URL || '';
var supabaseAnonKey = window.MAP_SUPABASE_ANON_KEY || '';
var isSupabaseProjectUrl = (function (value) {
    try {
        var parsedUrl = new URL(value);
        return parsedUrl.protocol === 'https:' && parsedUrl.hostname.endsWith('.supabase.co');
    } catch (error) {
        return false;
    }
})(supabaseUrl);
var supabaseClient = isSupabaseProjectUrl && supabaseAnonKey && window.supabase ?
    window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;
var isMapAdmin = false;
var currentAuthUser = null;
var legacyLocalFeatureCollection = null;
var cloudSaveQueue = Promise.resolve();
var cloudRealtimeChannel = null;
var localCloudUpdateTimes = new Set();

maplibregl.setRTLTextPlugin(
    'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',
    true
).catch(function (error) {
    console.error('نەتوانرا RTL text plugin بۆ زمانی کوردی باربکرێت:', error);
});

function normalizeRegionName(regionName) {
    var trimmedName = (regionName || '').trim();
    trimmedName = trimmedName.replace(/ناوجەی سێ/g, 'ناوچەی سێ');
    if (trimmedName.startsWith('لیکنەی ')) {
        trimmedName = trimmedName.replace(/^لیکنە/, 'لیژنە');
    }

    var regionBody = trimmedName.replace(/^لیژنەی\s+/, '');
    var committee = committeeRegions.find(function (region) {
        return regionBody === region.areaName || regionBody === region.name ||
            trimmedName.endsWith(' ' + region.areaName) ||
            trimmedName.endsWith(' ' + region.name);
    });
    return committee ? committee.name : trimmedName;
}

var committeeRegions = [
    { areaName: 'ناوچەی یەک', name: 'لیژنەی ناوچەی یەک' },
    { areaName: 'ناوچەی دوو', name: 'لیژنەی ناوچەی دوو' },
    { areaName: 'ناوچەی سێ', name: 'لیژنەی ناوچەی سێ' },
    { areaName: 'ناوچەی چوار', name: 'لیژنەی ناوچەی چوار' },
    { areaName: 'ناوچەی پێنج', name: 'لیژنەی ناوچەی پێنج' },
    { areaName: 'ناوچەی سەرچنار', name: 'لیژنەی ناوچەی سەرچنار' },
    { areaName: 'ناوچەی بەکرەجۆ', name: 'لیژنەی ناوچەی بەکرەجۆ' },
    { areaName: 'ناوچەی ماوەت', name: 'لیژنەی ناوچەی ماوەت' },
    { areaName: 'ناوچەی شارباژێر', name: 'لیژنەی ناوچەی شارباژێر' }
];

committeeRegions.forEach(function (region) {
    var option = document.createElement('option');
    option.value = region.name;
    option.textContent = region.name;
    regionFilter.add(option);
});

function normalizeNamedPointColor(color) {
    return /^#[0-9a-f]{6}$/i.test(color || '') ? color : defaultNamedPointColor;
}

function createNamedPointContent(name, className, color) {
    var content = document.createElement('div');
    content.className = className;
    content.dir = 'rtl';
    content.style.setProperty('--named-point-color', normalizeNamedPointColor(color));

    var icon = document.createElement('span');
    icon.className = 'named-point-symbol';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5" fill="#fff" stroke="none"/></svg>';

    var label = document.createElement('span');
    label.className = 'named-point-text';
    label.textContent = name;
    content.append(icon, label);
    return content;
}

function createNamedPointIcon(name, color) {
    return L.divIcon({
        className: 'named-point-marker',
        html: createNamedPointContent(name, 'named-point-content', color),
        iconSize: [1, 1],
        iconAnchor: [0, 0]
    });
}

function getRegionFeatureCollection() {
    var features = [];

    drawnItems.eachLayer(function (layer) {
        var feature = layer.toGeoJSON();
        feature.properties = Object.assign({}, feature.properties, {
            name: layer.regionName || '',
            kind: layer.kind || 'region',
            regionId: layer.regionId || null,
            parentRegionId: layer.parentRegionId || null,
            filterName: getRegionFilterName(layer),
            leafletId: String(layer._leaflet_id),
            style: Object.assign({}, layer.regionStyle),
            color: layer.regionStyle.color,
            fillColor: layer.regionStyle.fillColor,
            fillOpacity: layer.regionStyle.fillOpacity,
            pointColor: layer.kind === 'named-point' ?
                normalizeNamedPointColor(layer.pointColor) : null
        });
        features.push(feature);
    });

    return { type: 'FeatureCollection', features: features };
}

function createRegionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    return 'region-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

function getRegionFilterName(layer) {
    if (layer.kind === 'named-point') return '';
    return normalizeRegionName(layer.filterName || layer.regionName);
}

function findRegionLayerById(regionId) {
    if (!regionId) return null;
    var matchingLayer = null;
    drawnItems.eachLayer(function (layer) {
        if (!matchingLayer && layer.kind !== 'named-point' && layer.regionId === regionId) {
            matchingLayer = layer;
        }
    });
    return matchingLayer;
}

function getRegionDepth(layer) {
    var depth = 0;
    var parentRegionId = layer && layer.parentRegionId;
    while (parentRegionId) {
        depth += 1;
        var parentLayer = findRegionLayerById(parentRegionId);
        if (!parentLayer) break;
        parentRegionId = parentLayer.parentRegionId;
    }
    return depth;
}

function getSelectedRegionLayer(regionName) {
    var normalizedName = normalizeRegionName(regionName);
    if (!normalizedName) return null;
    var matchingLayer = null;
    drawnItems.eachLayer(function (layer) {
        if (!matchingLayer && layer.kind !== 'named-point' &&
            getRegionFilterName(layer) === normalizedName) {
            matchingLayer = layer;
        }
    });
    return matchingLayer;
}

function isRegionRelatedToSelection(layer, selectedLayer) {
    if (!layer || !selectedLayer) return false;
    if (layer === selectedLayer) return true;

    var ancestor = layer;
    while (ancestor.parentRegionId) {
        if (ancestor.parentRegionId === selectedLayer.regionId) return true;
        ancestor = findRegionLayerById(ancestor.parentRegionId);
        if (!ancestor) break;
    }

    ancestor = selectedLayer;
    while (ancestor.parentRegionId) {
        if (ancestor.parentRegionId === layer.regionId) return true;
        ancestor = findRegionLayerById(ancestor.parentRegionId);
        if (!ancestor) break;
    }

    return false;
}

function findRegionForNamedPoint(pointLayer) {
    var latlng = pointLayer.getLatLng();
    var point = turf.point([latlng.lng, latlng.lat]);
    var matchingRegion = null;
    var matchingDepth = -1;

    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point') return;
        if (turf.booleanPointInPolygon(point, layer.toGeoJSON())) {
            var depth = getRegionDepth(layer);
            if (depth > matchingDepth) {
                matchingRegion = layer;
                matchingDepth = depth;
            }
        }
    });

    return matchingRegion;
}

function focusRegionFromNamedPoint(pointLayer, mode) {
    var pointLocation = pointLayer.getLatLng();
    var region = findRegionForNamedPoint(pointLayer);

    if (region) {
        regionFilter.value = getRegionFilterName(region);
        selectRegion(region);
        showSelectedRegion(regionFilter.value);
        locationResult.textContent = 'خاڵەکە لە سنووری ' + region.regionName + ' ـدایە.';
    } else {
        regionFilter.value = '';
        selectRegion(null);
        showSelectedRegion('');
        locationResult.textContent = 'بۆ ئەم خاڵە هیچ سنووری لیژنەیەک نەدۆزرایەوە.';
    }

    setSelectedLabelLayer(pointLayer);
    if (mode === '3d' && map3D) {
        map3D.flyTo({
            center: [pointLocation.lng, pointLocation.lat],
            zoom: 16,
            pitch: 60,
            duration: 800
        });
    } else {
        map.flyTo(pointLocation, 17, { duration: 0.8 });
    }
}

function sync3DRegions() {
    if (!map3D) return;

    sync3DRegionLabels();
    if (!map3D.isStyleLoaded()) return;

    var source = map3D.getSource('committee-regions');
    if (source) source.setData(getRegionFeatureCollection());
    update3DRegionFilter();
}

function sync3DRegionLabels() {
    if (!map3D) return;

    var features = getRegionFeatureCollection().features;
    var activeLabelIds = new Set();
    var selectedRegion = getSelectedRegionLayer(regionFilter.value);

    features.forEach(function (feature) {
        var properties = feature.properties;
        var labelId = properties.leafletId;
        if (!properties.name || !labelId) return;

        activeLabelIds.add(labelId);
        var label = map3DRegionLabels.get(labelId);
        var isNamedPoint = properties.kind === 'named-point';
        var coordinates = isNamedPoint ? feature.geometry.coordinates :
            turf.pointOnFeature(feature).geometry.coordinates;
        if (!label) {
            var element = isNamedPoint ?
                createNamedPointContent(properties.name, 'map3d-named-point', properties.pointColor) :
                document.createElement('div');
            if (!isNamedPoint) {
                element.className = 'map3d-region-label';
                element.dir = 'rtl';
                element.textContent = properties.name;
            }
            element.setAttribute('aria-label', properties.name);
            label = new maplibregl.Marker({
                element: element,
                anchor: isNamedPoint ? 'bottom' : 'center',
                draggable: isNamedPoint && isMapAdmin
            }).setLngLat(coordinates).addTo(map3D);
            if (isNamedPoint) {
                label.on('dragend', function () {
                    var position = label.getLngLat();
                    var pointLayer = drawnItems.getLayers().find(function (layer) {
                        return String(layer._leaflet_id) === labelId &&
                            layer.kind === 'named-point';
                    });
                    if (!pointLayer) return;

                    pointLayer.setLatLng([position.lat, position.lng]);
                    saveRegions();
                    sync3DRegions();
                });
                label.on('click', function (event) {
                    if (event.originalEvent) event.originalEvent.stopPropagation();
                    var pointLayer = drawnItems.getLayers().find(function (layer) {
                        return String(layer._leaflet_id) === labelId &&
                            layer.kind === 'named-point';
                    });
                    if (pointLayer) focusRegionFromNamedPoint(pointLayer, '3d');
                });
            }
            map3DRegionLabels.set(labelId, label);
        } else {
            label.setLngLat(coordinates);
            if (isNamedPoint) label.setDraggable(isMapAdmin);
            if (isNamedPoint) {
                label.getElement().replaceChildren(
                    createNamedPointContent(
                        properties.name,
                        'map3d-named-point',
                        properties.pointColor
                    )
                );
            } else {
                label.getElement().textContent = properties.name;
            }
            label.getElement().setAttribute('aria-label', properties.name);
        }

        var regionLayer = findRegionLayerById(properties.regionId);
        label.getElement().hidden = Boolean(!isNamedPoint && regionFilter.value &&
            !isRegionRelatedToSelection(regionLayer, selectedRegion));
    });

    map3DRegionLabels.forEach(function (label, labelId) {
        if (!activeLabelIds.has(labelId)) {
            label.remove();
            map3DRegionLabels.delete(labelId);
        }
    });
}

function update3DRegionFilter() {
    if (!map3D) return;

    sync3DRegionLabels();
    if (!map3D.isStyleLoaded() || !map3D.getLayer('committee-fill')) return;

    var selectedRegion = getSelectedRegionLayer(regionFilter.value);
    var visibleRegionIds = [];
    if (selectedRegion) {
        drawnItems.eachLayer(function (layer) {
            if (layer.kind !== 'named-point' &&
                isRegionRelatedToSelection(layer, selectedRegion)) {
                visibleRegionIds.push(layer.regionId);
            }
        });
    }
    var filter = !regionFilter.value ? null : selectedRegion ?
        ['in', ['get', 'regionId'], ['literal', visibleRegionIds]] :
        ['==', ['get', 'filterName'], regionFilter.value];
    ['committee-fill', 'committee-outline'].forEach(function (id) {
        if (map3D.getLayer(id)) map3D.setFilter(id, filter);
    });
    if (map3D.getLayer('committee-glow')) {
        map3D.setFilter('committee-glow', filter);
    }
    if (map3D.getLayer('committee-selected-glow')) {
        map3D.setFilter('committee-selected-glow', selectedRegion ?
            ['==', ['get', 'regionId'], selectedRegion.regionId] :
            ['==', ['get', 'regionId'], '']);
    }
}

function selectRegionFrom3D(feature, event) {
    if (isPlacingNamedPoint) return;

    var matchingLayer = null;
    drawnItems.eachLayer(function (layer) {
        if (String(layer._leaflet_id) === String(feature.properties.leafletId)) {
            matchingLayer = layer;
        }
    });
    if (!matchingLayer) return;

    regionFilter.value = getRegionFilterName(matchingLayer);
    selectRegion(matchingLayer);
    showSelectedRegion(regionFilter.value);
    focusRegionView(matchingLayer);

    var message = 'سنووری ' + matchingLayer.regionName;
    new maplibregl.Popup()
        .setLngLat(event.lngLat)
        .setText(message)
        .addTo(map3D);
}

function initialize3DMap() {
    if (map3D) return;

    map3D = new maplibregl.Map({
        container: 'map3d',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [45.5000, 35.4250],
        zoom: 8,
        minZoom: 8,
        maxZoom: 17,
        pitch: 60,
        bearing: -20,
        maxPitch: 75,
        maxBounds: [[44.0, 34.0], [47.0, 36.85]],
        attributionControl: true
    });
    map3D.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map3D.on('load', function () {
        map3D.addSource('committee-regions', {
            type: 'geojson',
            data: getRegionFeatureCollection()
        });

        map3D.addLayer({
            id: 'committee-glow',
            type: 'line',
            source: 'committee-regions',
            paint: {
                'line-color': ['coalesce', ['get', 'color'], '#0056b3'],
                'line-width': 14,
                'line-blur': 7,
                'line-opacity': 0.48
            }
        });
        map3D.addLayer({
            id: 'committee-selected-glow',
            type: 'line',
            source: 'committee-regions',
            paint: {
                'line-color': ['coalesce', ['get', 'color'], '#0056b3'],
                'line-width': 12,
                'line-blur': 5,
                'line-opacity': 0.9
            }
        });
        map3D.addLayer({
            id: 'committee-fill',
            type: 'fill',
            source: 'committee-regions',
            paint: {
                'fill-color': ['coalesce', ['get', 'fillColor'], '#3388ff'],
                'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.3],
                'fill-outline-color': ['coalesce', ['get', 'color'], '#0056b3']
            }
        });
        map3D.addLayer({
            id: 'committee-outline',
            type: 'line',
            source: 'committee-regions',
            paint: {
                'line-color': ['coalesce', ['get', 'color'], '#0056b3'],
                'line-width': 4
            }
        });
        if (map3D.getLayer('building-3d')) {
            map3D.setPaintProperty('building-3d', 'fill-extrusion-base', [
                'coalesce', ['to-number', ['get', 'render_min_height']], 0
            ]);
            map3D.setPaintProperty('building-3d', 'fill-extrusion-height', [
                'coalesce',
                ['to-number', ['get', 'render_height']],
                ['to-number', ['get', 'height']],
                8
            ]);
        }

        map3D.on('click', 'committee-fill', function (event) {
            if (isPlacingNamedPoint) return;
            if (event.features.length) selectRegionFrom3D(event.features[0], event);
        });
        map3D.on('mouseenter', 'committee-fill', function () {
            map3D.getCanvas().style.cursor = 'pointer';
        });
        map3D.on('mouseleave', 'committee-fill', function () {
            map3D.getCanvas().style.cursor = '';
        });
        map3D.on('click', function (event) {
            if (!isPlacingNamedPoint) return;
            beginNamedPointPlacement(L.latLng(event.lngLat.lat, event.lngLat.lng));
        });

        update3DRegionFilter();
        sync3DRegionLabels();
    });
}

function setMapMode(mode) {
    var show3D = mode === '3d';
    currentMapMode = mode;
    document.getElementById('map').hidden = show3D;
    map3DContainer.hidden = !show3D;
    map2DButton.setAttribute('aria-pressed', String(mode === '2d'));
    map3DButton.setAttribute('aria-pressed', String(show3D));
    satelliteModeButton.setAttribute('aria-pressed', String(mode === 'satellite'));

    if (show3D) {
        syncLeafletBaseLayers();
        initialize3DMap();
        requestAnimationFrame(function () {
            if (!map3D) return;
            map3D.resize();
            sync3DRegions();
            if (selectedRegionLayer) {
                focusRegionView(selectedRegionLayer);
            } else {
                map3D.fitBounds([[44.0, 34.0], [47.0, 36.85]], {
                    padding: 20,
                    duration: 0
                });
            }
        });
    } else {
        syncLeafletBaseLayers();
        map.invalidateSize();
        requestAnimationFrame(function () {
            if (selectedRegionLayer) {
                focusRegionView(selectedRegionLayer);
            } else {
                map.fitBounds(sulaymaniyahBounds, { padding: [20, 20], animate: false });
            }
        });
    }
}

map2DButton.addEventListener('click', function () {
    setMapMode('2d');
});
map3DButton.addEventListener('click', function () {
    setMapMode('3d');
});
satelliteModeButton.addEventListener('click', function () {
    setMapMode('satellite');
});

function addRegionFilterOption(regionName) {
    var canonicalName = normalizeRegionName(regionName);
    if (!canonicalName) return;

    var existingOption = Array.from(regionFilter.options).find(function (option) {
        return option.value === canonicalName;
    });
    if (!existingOption) {
        var option = document.createElement('option');
        option.value = canonicalName;
        option.textContent = canonicalName;
        regionFilter.add(option);
    }
}

function createRegionInfoQuery(layer) {
    var feature = turf.simplify(layer.toGeoJSON(), {
        tolerance: 0.00005,
        highQuality: false
    });
    var geometry = feature.geometry;
    var polygons = geometry.type === 'Polygon' ? [geometry.coordinates] :
        geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    var queries = [];

    polygons.forEach(function (polygon) {
        var outerRing = polygon[0];
        if (!outerRing || outerRing.length < 4) return;

        var polygonCoordinates = outerRing.map(function (coordinate) {
            return coordinate[1].toFixed(6) + ' ' + coordinate[0].toFixed(6);
        }).join(' ');
        var polygonFilter = 'poly:"' + polygonCoordinates + '"';

        queries.push('way(' + polygonFilter + ')["highway"]["name"];');
        queries.push('nwr(' + polygonFilter + ')["place"~"^(neighbourhood|suburb|quarter|locality|village|hamlet|isolated_dwelling|city_district|district|municipality|county)$"];');
        queries.push('nwr(' + polygonFilter + ')["boundary"="administrative"]["name"];');
    });

    if (!queries.length) {
        throw new Error('سنووری ناوچەکە پۆلیگۆنێکی دروست نییە.');
    }

    return '[out:json][timeout:25];(' + queries.join('') + ');out center tags;';
}

async function requestRegionInfo(layer, signal) {
    var query = createRegionInfoQuery(layer);
    var endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
    ];
    var lastError;

    for (var endpoint of endpoints) {
        try {
            var response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: new URLSearchParams({ data: query }),
                signal: signal
            });

            if (!response.ok) {
                throw new Error('سێرڤەری نەخشە وەڵامی ' + response.status + 'ی دایە.');
            }
            return response.json();
        } catch (error) {
            if (signal.aborted) throw error;
            lastError = error;
        }
    }

    throw lastError || new Error('نەتوانرا زانیارییەکان بهێنرێن.');
}

function renderRegionInfo(data) {
    var streets = new Set();
    var neighbourhoods = new Set();
    var villages = new Set();
    var districts = new Set();

    (data.elements || []).forEach(function (element) {
        var tags = element.tags || {};
        var name = tags['name:ku'] || tags.name || tags['name:ar'] || tags['name:en'];
        if (!name) return;

        if (tags.highway) streets.add(name);
        if (['village', 'hamlet', 'isolated_dwelling'].includes(tags.place)) {
            villages.add(name);
        } else if (['neighbourhood', 'suburb', 'quarter', 'locality'].includes(tags.place)) {
            neighbourhoods.add(name);
        }
        if (tags.boundary === 'administrative' ||
            ['city_district', 'district', 'municipality', 'county'].includes(tags.place) ||
            ['5', '6', '7'].includes(tags.admin_level)) {
            districts.add(name);
        }
    });

    regionInfoResults.replaceChildren();
    [
        { title: 'شەقامەکان', values: streets },
        { title: 'گەڕەکەکان', values: neighbourhoods },
        { title: 'قەزا و ناحیەکان', values: districts },
        { title: 'گوندەکان', values: villages }
    ].forEach(function (category) {
        var section = document.createElement('section');
        section.className = 'region-info-category';
        var heading = document.createElement('h5');
        heading.textContent = category.title + ' (' + category.values.size + ')';
        section.appendChild(heading);

        if (category.values.size) {
            var list = document.createElement('ul');
            Array.from(category.values).sort().forEach(function (name) {
                var item = document.createElement('li');
                item.textContent = name;
                list.appendChild(item);
            });
            section.appendChild(list);
        } else {
            var emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'هیچ ناوێک نەدۆزرایەوە.';
            section.appendChild(emptyMessage);
        }
        regionInfoResults.appendChild(section);
    });

    var source = document.createElement('p');
    source.className = 'region-info-source';
    source.textContent = 'سەرچاوە: ';
    var sourceLink = document.createElement('a');
    sourceLink.href = 'https://www.openstreetmap.org/copyright';
    sourceLink.target = '_blank';
    sourceLink.rel = 'noopener noreferrer';
    sourceLink.textContent = '© OpenStreetMap contributors';
    source.appendChild(sourceLink);
    regionInfoResults.appendChild(source);
}

function loadRegionInfo(layer, forceRefresh) {
    if (!layer) return;

    if (!forceRefresh && regionInfoCache.has(layer)) {
        renderRegionInfo(regionInfoCache.get(layer));
        return;
    }
    if (!forceRefresh && regionInfoRequestLayer === layer) return;

    if (regionInfoAbortController) {
        regionInfoAbortController.abort();
    }

    var controller = new AbortController();
    regionInfoAbortController = controller;
    regionInfoRequestLayer = layer;
    regionInfoResults.textContent = 'زانیارییەکانی ئەم ناوچەیە دەگەڕێندرێنەوە...';
    var timeout = setTimeout(function () {
        controller.abort();
    }, 30000);

    requestRegionInfo(layer, controller.signal).then(function (data) {
        if (selectedRegionLayer !== layer) return;
        regionInfoCache.set(layer, data);
        renderRegionInfo(data);
    }).catch(function (error) {
        if (selectedRegionLayer !== layer || error.name === 'AbortError') return;
        console.error('نەتوانرا زانیاریی ناوچەکە بهێنرێت:', error);
        regionInfoResults.textContent = 'ئێستا نەتوانرا زانیارییەکان بهێنرێنەوە. دووبارە هەوڵ بدە.';
    }).finally(function () {
        clearTimeout(timeout);
        if (regionInfoAbortController === controller) {
            regionInfoAbortController = null;
            regionInfoRequestLayer = null;
        }
    });
}

function showSelectedRegion(regionName) {
    var selectedLayer = getSelectedRegionLayer(regionName);
    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point') return;
        var isVisible = !regionName || isRegionRelatedToSelection(layer, selectedLayer);
        layer.setStyle(isVisible ? layer.regionStyle : { opacity: 0, fillOpacity: 0 });
        if (layer._path) {
            layer._path.classList.toggle('region-selected-glow', layer === selectedLayer);
        }
        if (layer.getTooltip()) {
            if (isVisible) {
                layer.openTooltip();
            } else {
                layer.closeTooltip();
            }
        }
        if (layer._path) {
            layer._path.style.visibility = isVisible ? '' : 'hidden';
            layer._path.style.pointerEvents = isVisible ? '' : 'none';
        }
    });
}

function focusRegionView(layer) {
    if (!layer) return;

    if (currentMapMode === '3d' && map3D) {
        var bounds = layer.getBounds();
        map3D.once('moveend', function () {
            map3D.zoomTo(Math.min(15, map3D.getZoom() + 1), { duration: 500 });
        });
        map3D.fitBounds([
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()]
        ], {
            padding: { top: 40, right: 40, bottom: 40, left: 260 },
            maxZoom: 15,
            pitch: 45,
            duration: 1000
        });
        return;
    }

    map.once('moveend', function () {
        map.setZoom(Math.min(15, map.getZoom() + 1), { animate: true });
    });
    map.flyToBounds(layer.getBounds(), {
        paddingTopLeft: [250, 36],
        paddingBottomRight: [36, 36],
        maxZoom: 15,
        duration: 1
    });
}

function updateSubRegionButton() {
    var hasParent = Boolean(selectedRegionLayer && selectedRegionLayer.kind !== 'named-point');
    createSubRegionButton.disabled = !isMapAdmin || Boolean(pendingRegionLayer) ||
        (!hasParent && !isDrawingSubRegion);
    createSubRegionButton.textContent = isDrawingSubRegion ?
        'هەڵوەشاندنەوەی sub-polygon' : 'دروستکردنی sub-polygon';
    createSubRegionButton.setAttribute('aria-pressed', String(isDrawingSubRegion));
    updateRegionDeleteButtons();
}

function updateRegionDeleteButtons() {
    var hasRegion = Boolean(selectedRegionLayer && selectedRegionLayer.kind !== 'named-point');
    var hasPendingDraw = Boolean(isDrawingSubRegion || pendingRegionLayer);
    deleteSelectedRegionButton.disabled = !isMapAdmin || !hasRegion ||
        Boolean(selectedRegionLayer && selectedRegionLayer.parentRegionId) || hasPendingDraw;
    deleteSelectedSubRegionButton.disabled = !isMapAdmin || !hasRegion ||
        !Boolean(selectedRegionLayer && selectedRegionLayer.parentRegionId) || hasPendingDraw;
}

function getRegionSubtreeIds(rootRegionId) {
    var regionIds = new Set([rootRegionId]);
    var changed = true;
    while (changed) {
        changed = false;
        drawnItems.eachLayer(function (layer) {
            if (layer.kind !== 'named-point' && layer.parentRegionId &&
                regionIds.has(layer.parentRegionId) && !regionIds.has(layer.regionId)) {
                regionIds.add(layer.regionId);
                changed = true;
            }
        });
    }
    return regionIds;
}

function requestDeleteSelectedRegion(deleteSubRegion) {
    if (!isMapAdmin || !selectedRegionLayer || selectedRegionLayer.kind === 'named-point') return;
    var isSubRegion = Boolean(selectedRegionLayer.parentRegionId);
    if (deleteSubRegion !== isSubRegion) return;

    pendingDeleteRegionLayer = selectedRegionLayer;
    var subtree = getRegionSubtreeIds(selectedRegionLayer.regionId);
    var descendants = subtree.size - 1;
    var description = isSubRegion ?
        'sub-polygonی «' + selectedRegionLayer.regionName + '»' :
        'polygonی «' + selectedRegionLayer.regionName + '»';
    if (descendants) description += ' و ' + descendants + ' sub-polygonی وابەستە';
    deleteRegionMessage.textContent = 'دڵنیایت لە سڕینەوەی ' + description + '؟';
    deleteRegionDialog.hidden = false;
    confirmDeleteRegionButton.focus();
}

function finishDeleteSelectedRegion() {
    var target = pendingDeleteRegionLayer;
    if (!isMapAdmin || !target) return;

    var regionIds = getRegionSubtreeIds(target.regionId);
    drawnItems.getLayers().slice().forEach(function (layer) {
        if (layer.kind !== 'named-point' && regionIds.has(layer.regionId)) {
            drawnItems.removeLayer(layer);
        }
    });

    if (selectedRegionLayer && regionIds.has(selectedRegionLayer.regionId)) {
        regionFilter.value = '';
        selectRegion(null);
    }
    if (selectedLabelLayer && regionIds.has(selectedLabelLayer.regionId)) {
        setSelectedLabelLayer(null);
    }

    Array.from(regionFilter.options).forEach(function (option) {
        if (!option.value || committeeRegions.some(function (region) {
            return region.name === option.value;
        })) return;
        var stillExists = drawnItems.getLayers().some(function (layer) {
            return layer.kind !== 'named-point' && getRegionFilterName(layer) === option.value;
        });
        if (!stillExists) option.remove();
    });

    pendingDeleteRegionLayer = null;
    deleteRegionDialog.hidden = true;
    showSelectedRegion(regionFilter.value);
    saveRegions();
    sync3DRegions();
}

deleteSelectedRegionButton.addEventListener('click', function () {
    requestDeleteSelectedRegion(false);
});

deleteSelectedSubRegionButton.addEventListener('click', function () {
    requestDeleteSelectedRegion(true);
});

confirmDeleteRegionButton.addEventListener('click', finishDeleteSelectedRegion);

cancelDeleteRegionButton.addEventListener('click', function () {
    pendingDeleteRegionLayer = null;
    deleteRegionDialog.hidden = true;
});

function addRegionLabel(layer) {
    if (!layer.regionName) return;

    var label = document.createElement('span');
    label.textContent = layer.regionName;
    layer.bindTooltip(label, {
        permanent: true,
        direction: 'center',
        className: 'region-label',
        opacity: 1,
        interactive: false
    });
}

function setSelectedLabelLayer(layer) {
    selectedLabelLayer = layer;
    editNamedLabelButton.disabled = !isMapAdmin || !layer;
    var isNamedPoint = Boolean(layer && layer.kind === 'named-point');
    namedPointColorInput.disabled = !isMapAdmin || !isNamedPoint;
    applyNamedPointColorButton.disabled = !isMapAdmin || !isNamedPoint;
    if (isNamedPoint) {
        namedPointColorInput.value = normalizeNamedPointColor(layer.pointColor);
    }
}

function enableRegionSelection(layer) {
    addRegionFilterOption(layer.regionName);
    layer.on('click', function () {
        setSelectedLabelLayer(layer);
        regionFilter.value = getRegionFilterName(layer);
        selectRegion(layer);
        showSelectedRegion(regionFilter.value);
        focusRegionView(layer);
    });
}

function selectRegion(layer) {
    selectedRegionLayer = layer;
    if (layer) setSelectedLabelLayer(layer);
    applyRegionStyleButton.disabled = !isMapAdmin || !layer;
    updateSubRegionButton();
    refreshRegionInfoButton.disabled = !layer;
    if (!layer) {
        setSelectedLabelLayer(null);
        if (regionInfoAbortController) regionInfoAbortController.abort();
        regionInfoRequestLayer = null;
        regionInfoResults.textContent = 'ناوچەیەک هەڵبژێرە بۆ گەڕانی زانیاری.';
        update3DRegionFilter();
        return;
    }

    var style = layer.regionStyle || {};
    borderColorInput.value = style.color || '#0056b3';
    fillColorInput.value = style.fillColor || '#3388ff';
    fillOpacityInput.value = style.fillOpacity == null ? 0.3 : style.fillOpacity;
    opacityValue.textContent = fillOpacityInput.value;
    refreshDrawStyle();
    update3DRegionFilter();
    loadRegionInfo(layer, false);
}

regionFilter.addEventListener('change', function () {
    var matchingLayer = null;
    drawnItems.eachLayer(function (layer) {
        if (!matchingLayer && regionFilter.value &&
            layer.kind !== 'named-point' &&
            getRegionFilterName(layer) === regionFilter.value) {
            matchingLayer = layer;
        }
    });
    selectRegion(matchingLayer);
    showSelectedRegion(regionFilter.value);
    if (matchingLayer) {
        focusRegionView(matchingLayer);
    } else if (currentMapMode === '3d' && map3D) {
        map3D.fitBounds([[44.0, 34.0], [47.0, 36.85]], {
            padding: 20,
            duration: 1000
        });
    } else {
        map.flyToBounds(sulaymaniyahBounds, { padding: [20, 20], duration: 1 });
    }
});

function loadFeatureCollection(savedRegions) {
    drawnItems.clearLayers();
    selectedRegionLayer = null;
    setSelectedLabelLayer(null);
    regionFilter.value = '';
    var regionNameChanged = false;

    if (savedRegions && Array.isArray(savedRegions.features)) {
        savedRegions.features.forEach(function (feature) {
            var properties = feature.properties || {};
            var savedStyle = properties.style || {};
            var regionStyle = Object.assign({
                color: '#0056b3',
                fillColor: '#3388ff',
                fillOpacity: 0.3,
                weight: 5
            }, {
                color: savedStyle.color || properties.color || '#0056b3',
                fillColor: savedStyle.fillColor || properties.fillColor || '#3388ff',
                fillOpacity: savedStyle.fillOpacity == null ?
                    (properties.fillOpacity == null ? 0.3 : properties.fillOpacity) :
                    savedStyle.fillOpacity
            }, savedStyle, { weight: 5 });
            var region = L.geoJSON(feature, { style: regionStyle });

            region.eachLayer(function (layer) {
                layer.kind = properties.kind || 'region';
                if (layer.kind === 'named-point') {
                    layer.pointName = properties.name || '';
                    layer.regionName = layer.pointName;
                    layer.pointColor = normalizeNamedPointColor(properties.pointColor);
                    layer.regionStyle = {};
                    layer.setIcon(createNamedPointIcon(layer.pointName, layer.pointColor));
                    if (layer.pointName) {
                        var pointTitle = document.createElement('b');
                        pointTitle.textContent = layer.pointName;
                        layer.bindPopup(pointTitle);
                    }
                    drawnItems.addLayer(layer);
                    enableNamedPointDragging(layer);
                    return;
                }

                layer.regionId = properties.regionId || createRegionId();
                layer.parentRegionId = properties.parentRegionId || null;
                if (!properties.regionId) regionNameChanged = true;
                layer.regionName = normalizeRegionName(properties.name);
                layer.filterName = normalizeRegionName(properties.filterName || properties.name);
                if (layer.regionName !== (properties.name || '')) regionNameChanged = true;
                layer.regionStyle = regionStyle;
                addRegionFilterOption(layer.regionName);
                enableRegionSelection(layer);
                addRegionLabel(layer);
                if (layer.regionName) {
                    var title = document.createElement('b');
                    title.textContent = layer.regionName;
                    layer.bindPopup(title);
                }
                drawnItems.addLayer(layer);
            });
        });
    }

    showSelectedRegion('');
    sync3DRegions();
    return regionNameChanged;
}

var databaseRequest = indexedDB.open('MapSuliDatabase', 1);

databaseRequest.onupgradeneeded = function (event) {
    event.target.result.createObjectStore('regions', { keyPath: 'id' });
};

var storageReady = new Promise(function (resolve, reject) {
    databaseRequest.onsuccess = function () {
        resolve(databaseRequest.result);
    };
    databaseRequest.onerror = function () {
        reject(databaseRequest.error);
    };
}).then(function (database) {
    return new Promise(function (resolve, reject) {
        var transaction = database.transaction('regions', 'readonly');
        var request = transaction.objectStore('regions').get('sulaymaniyah');

        request.onsuccess = function () {
            legacyLocalFeatureCollection = null;
            storageStatus.textContent = supabaseClient ?
                'خەریکی چوونەژوورەوە و بارکردنی داتای cloud...' :
                'چاوەڕێی ڕێکخستنی Supabase';
            resolve(database);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}).catch(function (error) {
    console.error('نەتوانرا داتاکان لە IndexedDB بخوێندرێنەوە:', error);
    storageStatus.textContent = 'کێشە لە پەیوەندی بە داتابەیس';
    return null;
});

var drawControlAdded = false;

function setMapEditorPermissions(canEdit) {
    isMapAdmin = Boolean(canEdit);

    if (drawControl) {
        if (isMapAdmin && !drawControlAdded) {
            map.addControl(drawControl);
            drawControlAdded = true;
        } else if (!isMapAdmin && drawControlAdded) {
            map.removeControl(drawControl);
            drawControlAdded = false;
        }
    }

    borderColorInput.disabled = !isMapAdmin;
    fillColorInput.disabled = !isMapAdmin;
    fillOpacityInput.disabled = !isMapAdmin;
    addNamedPointButton.disabled = !isMapAdmin;
    applyRegionStyleButton.disabled = !isMapAdmin || !selectedRegionLayer;
    updateSubRegionButton();
    editNamedLabelButton.disabled = !isMapAdmin || !selectedLabelLayer;
    namedPointColorInput.disabled = !isMapAdmin ||
        !selectedLabelLayer || selectedLabelLayer.kind !== 'named-point';
    applyNamedPointColorButton.disabled = !isMapAdmin ||
        !selectedLabelLayer || selectedLabelLayer.kind !== 'named-point';
    refreshRegionInfoButton.disabled = !selectedRegionLayer;
    if (!isMapAdmin && isPlacingNamedPoint) setNamedPointPlacement(false);
    if (!isMapAdmin && isDrawingSubRegion) cancelSubRegionDrawing();
    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point' && layer.dragging) {
            if (isMapAdmin && !layer.dragging.enabled()) layer.dragging.enable();
            if (!isMapAdmin && layer.dragging.enabled()) layer.dragging.disable();
        }
    });
    map3DRegionLabels.forEach(function (marker) {
        if (marker.setDraggable) marker.setDraggable(isMapAdmin);
    });
    sync3DRegions();
}

function writeCloudFeatureCollection(collection) {
    if (!supabaseClient || !isMapAdmin || !currentAuthUser) {
        storageStatus.textContent = 'تەنها ئەدمین دەتوانێت داتاکان خەزن بکات.';
        return Promise.resolve(false);
    }

    cloudSaveQueue = cloudSaveQueue.catch(function () {}).then(async function () {
        var updatedAt = new Date().toISOString();
        localCloudUpdateTimes.add(Date.parse(updatedAt));
        try {
            var result = await supabaseClient.from('map_state').upsert({
                id: 'sulaymaniyah',
                data: collection,
                updated_at: updatedAt,
                updated_by: currentAuthUser.id
            });
            if (result.error) throw result.error;
            storageStatus.textContent = 'هەموو داتاکان بۆ cloud خەزن کران';
            return true;
        } finally {
            window.setTimeout(function () {
                localCloudUpdateTimes.delete(Date.parse(updatedAt));
            }, 60000);
        }
    }).catch(function (error) {
        console.error('نەتوانرا داتاکان لە cloud خەزن بکرێن:', error);
        storageStatus.textContent = 'خەزنکردن سەرکەوتوو نەبوو؛ پەیوەندی یان مۆڵەتی ئەدمین بپشکنە.';
        return false;
    });
    return cloudSaveQueue;
}

function saveRegions() {
    return writeCloudFeatureCollection(getRegionFeatureCollection());
}

async function loadCloudMap() {
    if (!supabaseClient || !currentAuthUser) return;

    var result = await supabaseClient.from('map_state')
        .select('data, updated_at')
        .eq('id', 'sulaymaniyah')
        .maybeSingle();

    if (result.error) {
        console.error('نەتوانرا داتای هاوبەشی ماپ بخوێندرێتەوە:', result.error);
        accessStatus.textContent = 'خوێندنەوەی داتای هاوبەش سەرکەوتوو نەبوو.';
        mapAccessMessage.textContent = 'داتای هاوبەش بار نەبوو؛ پەیوەندی و RLS بپشکنە.';
        return;
    }

    var cloudCollection = result.data && result.data.data || {
        type: 'FeatureCollection',
        features: []
    };
    var namesChanged = loadFeatureCollection(cloudCollection);
    var hasCloudFeatures = cloudCollection.features && cloudCollection.features.length > 0;
    if (isMapAdmin && !hasCloudFeatures) {
        legacyLocalFeatureCollection = await readLegacyLocalFeatureCollection();
    }
    var hasLegacyFeatures = legacyLocalFeatureCollection &&
        legacyLocalFeatureCollection.features && legacyLocalFeatureCollection.features.length > 0;

    migrateLocalDataButton.hidden = !(isMapAdmin && !hasCloudFeatures && hasLegacyFeatures);
    setMapEditorPermissions(isMapAdmin);
    mapAccessGate.hidden = true;
    map.invalidateSize();
    if (map3D) map3D.resize();

    if (isMapAdmin) {
        accessStatus.textContent = 'ئەدمین: دەستکاری چالاکە';
        storageStatus.textContent = hasCloudFeatures ? 'داتای cloud بارکرا' : 'ماپی هاوبەش ئامادەیە';
        if (namesChanged && hasCloudFeatures) await saveRegions();
    } else {
        accessStatus.textContent = 'بینەر: تەنها بینین';
        storageStatus.textContent = 'داتای cloud بارکرا';
    }
}

function subscribeToCloudMap() {
    if (!supabaseClient || !currentAuthUser || cloudRealtimeChannel) return;

    cloudRealtimeChannel = supabaseClient.channel('map-state-sulaymaniyah')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'map_state',
            filter: 'id=eq.sulaymaniyah'
        }, function (payload) {
            var record = payload.new;
            if (!record || record.id !== 'sulaymaniyah') return;

            var updatedAt = Date.parse(record.updated_at);
            if (record.updated_by === currentAuthUser.id &&
                localCloudUpdateTimes.has(updatedAt)) return;

            loadFeatureCollection(record.data || {
                type: 'FeatureCollection',
                features: []
            });
            setMapEditorPermissions(isMapAdmin);
            storageStatus.textContent = 'داتای نوێی cloud لایڤ نوێ کرایەوە';
        })
        .subscribe(function (status, error) {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('پەیوەندی نوێکردنەوەی لایڤی ماپ سەرکەوتوو نەبوو:', error);
                storageStatus.textContent = 'نوێکردنەوەی لایڤ چالاک نییە؛ ڕێکخستنی Realtime بپشکنە.';
            }
        });
}

function unsubscribeFromCloudMap() {
    if (!supabaseClient || !cloudRealtimeChannel) return;
    supabaseClient.removeChannel(cloudRealtimeChannel);
    cloudRealtimeChannel = null;
}

async function readLegacyLocalFeatureCollection() {
    var database = await storageReady;
    if (!database) return { type: 'FeatureCollection', features: [] };

    return new Promise(function (resolve) {
        var request = database.transaction('regions', 'readonly')
            .objectStore('regions').get('sulaymaniyah');
        request.onsuccess = function () {
            resolve(request.result && request.result.data || {
                type: 'FeatureCollection',
                features: []
            });
        };
        request.onerror = function () {
            resolve({ type: 'FeatureCollection', features: [] });
        };
    });
}

async function applyAuthenticatedSession(session) {
    currentAuthUser = session && session.user || null;
    var canEdit = false;

    if (currentAuthUser) {
        var roleResult = await supabaseClient.rpc('is_map_admin');
        if (roleResult.error) {
            console.error('نەتوانرا ڕۆڵی ئەدمین بپشکنرێت:', roleResult.error);
        } else {
            canEdit = roleResult.data === true;
        }
    }

    setMapEditorPermissions(canEdit);
    adminLogoutButton.hidden = !currentAuthUser;

    if (!currentAuthUser) {
        unsubscribeFromCloudMap();
        migrateLocalDataButton.hidden = true;
        legacyLocalFeatureCollection = null;
        loadFeatureCollection({ type: 'FeatureCollection', features: [] });
        mapAccessGate.hidden = false;
        accessStatus.textContent = 'چوونەژوورەوە پێویستە';
        mapAccessMessage.textContent = 'بۆ بینینی نەخشە، بە هەژماری خۆت بچۆرە ژوورەوە.';
        if (supabaseClient) adminEmailInput.focus();
        return;
    }

    mapAccessGate.hidden = true;
    accessStatus.textContent = canEdit ? 'ئەدمین: دەستکاری چالاکە' : 'بینەر: تەنها بینین';
    await loadCloudMap();
    subscribeToCloudMap();
}

function showPasswordRecoveryForm(session) {
    passwordRecoveryPending = true;
    var recoveryEmail = session && session.user && session.user.email;
    if (recoveryEmail) adminEmailInput.value = recoveryEmail;
    adminEmailInput.readOnly = true;
    adminPasswordInput.value = '';
    adminPasswordInput.autocomplete = 'new-password';
    adminPasswordLabel.textContent = 'وشەی نهێنیی نوێ';
    gateLoginButton.textContent = 'نوێکردنەوەی وشەی نهێنی';
    mapAccessTitle.textContent = 'دابنانی وشەی نهێنی نوێ';
    mapAccessMessage.textContent = 'وشەی نهێنیی نوێ بنووسە بۆ هەژمارەکەت.';
    adminLoginError.hidden = true;
    mapAccessGate.hidden = false;
    adminPasswordInput.focus();
}

function restoreLoginForm() {
    adminEmailInput.readOnly = false;
    adminPasswordInput.autocomplete = 'current-password';
    adminPasswordLabel.textContent = 'وشەی نهێنی';
    gateLoginButton.textContent = 'چوونەژوورەوە';
    mapAccessTitle.textContent = 'چوونەژوورەوە پێویستە';
}

async function initializeOnlineAccess() {
    setMapEditorPermissions(false);
    mapAccessGate.hidden = false;

    if (!supabaseClient) {
        adminEmailInput.disabled = true;
        adminPasswordInput.disabled = true;
        gateLoginButton.disabled = true;
        accessStatus.textContent = 'Supabase ڕێکنەخراوە';
        if (supabaseUrl && !isSupabaseProjectUrl) {
            mapAccessMessage.textContent = 'ئەم URL ـە هی Render ـە، نە Supabase. Project URLی .supabase.co لە Dashboard دابنێ.';
        } else if (!supabaseUrl) {
            mapAccessMessage.textContent = 'Project URL لە supabase-config.js دابنێ.';
        } else if (!supabaseAnonKey) {
            mapAccessMessage.textContent = 'Project URL جێگیرە؛ anon/publishable key لە supabase-config.js دابنێ تا login چالاک بێت.';
        } else {
            mapAccessMessage.textContent = 'Supabase JS load نەبوو؛ پەیوەندی ئینتەرنێت بپشکنە.';
        }
        storageStatus.textContent = 'بۆ بینینی ماپی هاوبەش، backend ڕێکبخە.';
        loadFeatureCollection({ type: 'FeatureCollection', features: [] });
        return;
    }

    await storageReady;

    adminEmailInput.disabled = false;
    adminPasswordInput.disabled = false;
    gateLoginButton.disabled = false;

    supabaseClient.auth.onAuthStateChange(function (event, session) {
        if (event === 'PASSWORD_RECOVERY') {
            showPasswordRecoveryForm(session);
            return;
        }
        if (event === 'INITIAL_SESSION') return;
        if (event === 'SIGNED_IN' && loginSubmissionPending) return;
        if (passwordRecoveryPending) {
            if (event !== 'USER_UPDATED' && session) showPasswordRecoveryForm(session);
            return;
        }
        window.setTimeout(function () {
            applyAuthenticatedSession(session);
        }, 0);
    });

    var sessionResult = await supabaseClient.auth.getSession();
    if (sessionResult.error) {
        accessStatus.textContent = 'پشکنینی چوونەژوورەوە سەرکەوتوو نەبوو.';
        return;
    }
    if (passwordRecoveryPending) {
        showPasswordRecoveryForm(sessionResult.data.session);
        return;
    }
    await applyAuthenticatedSession(sessionResult.data.session);
}

async function migrateLegacyMapToCloud() {
    if (!isMapAdmin || !legacyLocalFeatureCollection ||
        !legacyLocalFeatureCollection.features.length) return;

    migrateLocalDataButton.disabled = true;
    storageStatus.textContent = 'داتای ناوخۆیی بۆ cloud دەگوازرێتەوە...';
    var migrated = await writeCloudFeatureCollection(legacyLocalFeatureCollection);
    migrateLocalDataButton.disabled = false;

    if (migrated) {
        await loadCloudMap();
    }
}

adminLoginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    adminLoginError.hidden = true;

    if (passwordRecoveryPending) {
        try {
            var updateResult = await supabaseClient.auth.updateUser({
                password: adminPasswordInput.value
            });
            if (updateResult.error) throw updateResult.error;

            passwordRecoveryPending = false;
            adminPasswordInput.value = '';
            restoreLoginForm();
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            var sessionResult = await supabaseClient.auth.getSession();
            await applyAuthenticatedSession(sessionResult.data.session);
        } catch (error) {
            var recoveryErrorMessage = String(error && error.message || error || 'Unknown error');
            console.error('Password recovery update failed:', recoveryErrorMessage);
            adminPasswordInput.value = '';
            adminLoginError.textContent = 'نوێکردنەوەی وشەی نهێنی سەرکەوتوو نەبوو: ' + recoveryErrorMessage;
            adminLoginError.hidden = false;
        }
        return;
    }

    var loginError = null;
    var loginSession = null;
    loginSubmissionPending = true;
    gateLoginButton.disabled = true;
    try {
        var result = await supabaseClient.auth.signInWithPassword({
            email: adminEmailInput.value.trim(),
            password: adminPasswordInput.value
        });
        loginError = result.error;
        loginSession = result.data && result.data.session;
    } catch (error) {
        loginError = error;
    }

    if (loginError) {
        loginSubmissionPending = false;
        gateLoginButton.disabled = false;
        var errorMessage = String(loginError.message || loginError).toLowerCase();
        var errorCode = String(loginError.code || '').toLowerCase();
        if (/fetch|network|dns|name_not_resolved|failed to send/.test(errorMessage) ||
            loginError instanceof TypeError) {
            adminLoginError.textContent = 'پەیوەندی بە Supabase نەکرا. Project URL و ئینتەرنێت بپشکنە.';
        } else if (/invalid api key|api key/.test(errorMessage)) {
            adminLoginError.textContent = 'anon/publishable key دروست نییە یان هی ئەم پرۆژەیە نییە.';
        } else if (errorCode === 'email_not_confirmed' || /email not confirmed|not confirmed/.test(errorMessage)) {
            adminLoginError.textContent = 'ئیمەیڵەکەت هێشتا پشتڕاست نەکراوەتەوە؛ لینکەکە لە inbox یان Spam بکەرەوە.';
        } else {
            adminLoginError.textContent = 'ئیمەیڵ یان password بۆ ئەم پرۆژەیە دروست نییە؛ دڵنیابە هەژمارەکە لە Supabaseی هەمان project دروستکراوە.';
        }
        adminLoginError.hidden = false;
        return;
    }

    adminPasswordInput.value = '';
    try {
        await applyAuthenticatedSession(loginSession);
    } catch (error) {
        console.error('Authenticated session could not be applied:', error);
        adminLoginError.textContent = 'چوونەژوورەوە سەرکەوتوو بوو، بەڵام بارکردنی نەخشە سەرکەوتوو نەبوو.';
        adminLoginError.hidden = false;
    } finally {
        loginSubmissionPending = false;
        gateLoginButton.disabled = false;
    }
});

adminLogoutButton.addEventListener('click', async function () {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
});

migrateLocalDataButton.addEventListener('click', migrateLegacyMapToCloud);

function getSelectedStyle() {
    return {
        color: borderColorInput.value,
        fillColor: fillColorInput.value,
        fillOpacity: parseFloat(fillOpacityInput.value),
        weight: 5
    };
}

function refreshDrawStyle() {
    drawControl.setDrawingOptions({
        polygon: {
            shapeOptions: getSelectedStyle()
        }
    });
}

function getSubRegionStyle(parentRegion) {
    var childPalette = [
        { color: '#b45309', fillColor: '#fde68a' },
        { color: '#0369a1', fillColor: '#bae6fd' },
        { color: '#15803d', fillColor: '#bbf7d0' },
        { color: '#a21caf', fillColor: '#f5d0fe' },
        { color: '#be123c', fillColor: '#fecdd3' }
    ];
    var siblingCount = 0;
    drawnItems.eachLayer(function (layer) {
        if (layer.parentRegionId === parentRegion.regionId) siblingCount += 1;
    });

    var style = Object.assign({}, getSelectedStyle(), childPalette[siblingCount % childPalette.length]);
    if (parentRegion.regionStyle && style.color === parentRegion.regionStyle.color &&
        style.fillColor === parentRegion.regionStyle.fillColor) {
        style = Object.assign({}, style, childPalette[(siblingCount + 1) % childPalette.length]);
    }
    return style;
}

function cancelSubRegionDrawing() {
    if (subRegionDrawHandler && subRegionDrawHandler.enabled()) {
        subRegionDrawHandler.disable();
    }
    subRegionDrawHandler = null;
    isDrawingSubRegion = false;
    pendingSubRegionParent = null;
    updateSubRegionButton();
}

function beginSubRegionDrawing() {
    if (isDrawingSubRegion) {
        cancelSubRegionDrawing();
        return;
    }
    if (!isMapAdmin || !selectedRegionLayer || selectedRegionLayer.kind === 'named-point') return;

    pendingSubRegionParent = selectedRegionLayer;
    isDrawingSubRegion = true;
    updateSubRegionButton();
    locationResult.textContent = 'سنووری بچووک لەناو سنووری ' +
        selectedRegionLayer.regionName + ' بکێشە.';
    subRegionDrawHandler = new L.Draw.Polygon(map, {
        allowIntersection: false,
        showArea: true,
        shapeOptions: getSubRegionStyle(selectedRegionLayer)
    });
    subRegionDrawHandler.enable();
}

// ٥. زیادکردنی ئامرازی کێشان بۆ سەر نەخشە
var drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: getSelectedStyle()
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: drawnItems,
        remove: true
    }
});
setMapEditorPermissions(false);

fillOpacityInput.addEventListener('input', function () {
    opacityValue.textContent = fillOpacityInput.value;
    refreshDrawStyle();
});

borderColorInput.addEventListener('input', refreshDrawStyle);
fillColorInput.addEventListener('input', refreshDrawStyle);

applyNamedPointColorButton.addEventListener('click', function () {
    if (!isMapAdmin || !selectedLabelLayer ||
        selectedLabelLayer.kind !== 'named-point') return;

    selectedLabelLayer.pointColor = normalizeNamedPointColor(namedPointColorInput.value);
    selectedLabelLayer.setIcon(createNamedPointIcon(
        selectedLabelLayer.pointName,
        selectedLabelLayer.pointColor
    ));
    saveRegions();
    sync3DRegions();
});

applyRegionStyleButton.addEventListener('click', function () {
    if (!isMapAdmin || !selectedRegionLayer) return;

    selectedRegionLayer.regionStyle = getSelectedStyle();
    selectedRegionLayer.setStyle(selectedRegionLayer.regionStyle);
    saveRegions();
    sync3DRegions();
});

refreshRegionInfoButton.addEventListener('click', function () {
    loadRegionInfo(selectedRegionLayer, true);
});

createSubRegionButton.addEventListener('click', beginSubRegionDrawing);

function setNamedPointPlacement(active) {
    if (active && !isMapAdmin) return;
    isPlacingNamedPoint = active;
    addNamedPointButton.setAttribute('aria-pressed', String(active));
    map.getContainer().style.cursor = active ? 'crosshair' : '';
    if (map3D) map3D.getCanvas().style.cursor = active ? 'crosshair' : '';
    if (!active) {
        namedPointDialog.hidden = true;
        pendingNamedPointLatLng = null;
        pendingRegionLayer = null;
        pendingRegionParentId = null;
        editingLabelLayer = null;
        namedPointTitle.textContent = 'ناوی خاڵ';
        namedPointNameLabel.textContent = 'ناوی شوێن';
        updateSubRegionButton();
    }
}

function beginNamedPointPlacement(latlng) {
    pendingNamedPointLatLng = latlng;
    namedPointNameInput.value = '';
    namedPointDialog.hidden = false;
    namedPointNameInput.focus();
}

function addNamedPoint(latlng, pointName) {
    if (!isMapAdmin) return;
    var pointColor = defaultNamedPointColor;
    var marker = L.marker(latlng, {
        icon: createNamedPointIcon(pointName, pointColor),
        title: pointName,
        alt: pointName,
        keyboard: true,
        draggable: true
    });
    marker.kind = 'named-point';
    marker.pointName = pointName;
    marker.pointColor = pointColor;
    marker.regionName = pointName;
    marker.regionStyle = {};

    var popupContent = document.createElement('b');
    popupContent.textContent = pointName;
    marker.bindPopup(popupContent);
    drawnItems.addLayer(marker);
    enableNamedPointDragging(marker);
    setNamedPointPlacement(false);
    setSelectedLabelLayer(marker);
    saveRegions();
    sync3DRegions();
}

function updateEditableLabel(layer, newName) {
    if (layer.kind === 'named-point') {
        layer.pointName = newName;
        layer.regionName = newName;
        layer.options.title = newName;
        layer.setIcon(createNamedPointIcon(newName, layer.pointColor));
    } else {
        layer.regionName = normalizeRegionName(newName);
        if (!layer.filterName) layer.filterName = normalizeRegionName(newName);
        if (layer.getTooltip()) {
            layer.setTooltipContent(layer.regionName);
        } else {
            addRegionLabel(layer);
        }
    }

    var title = document.createElement('b');
    title.textContent = layer.regionName;
    if (layer.getPopup()) {
        layer.setPopupContent(title);
    } else {
        layer.bindPopup(title);
    }
}

function enableNamedPointDragging(marker) {
    if (!marker.dragging) return;

    if (isMapAdmin && !marker.dragging.enabled()) marker.dragging.enable();
    if (!isMapAdmin && marker.dragging.enabled()) marker.dragging.disable();
    if (!marker._namedPointDragEnabled) {
        marker._namedPointDragEnabled = true;
        marker.on('dragend', function () {
            if (!isMapAdmin) return;
            saveRegions();
            sync3DRegions();
        });
    }
    if (!marker._namedPointNavigationEnabled) {
        marker._namedPointNavigationEnabled = true;
        marker.on('click', function () {
            focusRegionFromNamedPoint(marker, currentMapMode);
        });
    }
}

namedPointForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var pointName = namedPointNameInput.value.trim();
    if (editingLabelLayer) {
        if (!isMapAdmin) return;
        if (!pointName) {
            namedPointNameInput.focus();
            return;
        }

        updateEditableLabel(editingLabelLayer, pointName);
        namedPointDialog.hidden = true;
        editingLabelLayer = null;
        namedPointTitle.textContent = 'ناوی خاڵ';
        namedPointNameLabel.textContent = 'ناوی شوێن';
        saveRegions();
        sync3DRegions();
        return;
    }

    if (pendingRegionLayer) {
        if (!isMapAdmin) return;
        if (!pointName) {
            namedPointNameInput.focus();
            return;
        }

        var regionLayer = pendingRegionLayer;
        pendingRegionLayer = null;
        regionLayer.regionId = regionLayer.regionId || createRegionId();
        regionLayer.parentRegionId = pendingRegionParentId || null;
        pendingRegionParentId = null;
        regionLayer.regionName = normalizeRegionName(pointName);
        regionLayer.filterName = regionLayer.regionName;
        addRegionFilterOption(regionLayer.regionName);
        enableRegionSelection(regionLayer);
        addRegionLabel(regionLayer);

        var regionTitle = document.createElement('b');
        regionTitle.textContent = regionLayer.regionName;
        regionLayer.bindPopup(regionTitle);
        drawnItems.addLayer(regionLayer);
        namedPointDialog.hidden = true;
        namedPointNameInput.value = '';
        namedPointTitle.textContent = 'ناوی خاڵ';
        namedPointNameLabel.textContent = 'ناوی شوێن';
        regionFilter.value = regionLayer.regionName;
        selectRegion(regionLayer);
        showSelectedRegion(regionFilter.value);
        saveRegions();
        sync3DRegions();
        return;
    }

    if (!pendingNamedPointLatLng || !pointName) {
        namedPointNameInput.focus();
        return;
    }

    var pointLocation = pendingNamedPointLatLng;
    setNamedPointPlacement(false);
    addNamedPoint(pointLocation, pointName);
});

cancelNamedPointButton.addEventListener('click', function () {
    setNamedPointPlacement(false);
});

editNamedLabelButton.addEventListener('click', function () {
    if (!selectedLabelLayer) return;

    editingLabelLayer = selectedLabelLayer;
    pendingNamedPointLatLng = null;
    namedPointTitle.textContent = 'ئیدیتی ناو';
    namedPointNameLabel.textContent = 'ناوی نوێ';
    namedPointNameInput.value = selectedLabelLayer.kind === 'named-point' ?
        selectedLabelLayer.pointName : selectedLabelLayer.regionName;
    namedPointDialog.hidden = false;
    namedPointNameInput.focus();
    namedPointNameInput.select();
});

addNamedPointButton.addEventListener('click', function () {
    if (isDrawingSubRegion) cancelSubRegionDrawing();
    setNamedPointPlacement(!isPlacingNamedPoint);
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isDrawingSubRegion) {
        event.preventDefault();
        cancelSubRegionDrawing();
        return;
    }
    if (event.key === 'Escape' && isPlacingNamedPoint) {
        event.preventDefault();
        setNamedPointPlacement(false);
    }
});

// ٦. کاتێک سنوورێک دەکێشیت، ئەم کۆدە کار دەکات
map.on(L.Draw.Event.CREATED, function (e) {
    if (!isMapAdmin) return;
    var layer = e.layer;
    var parentRegion = null;

    if (isDrawingSubRegion) {
        parentRegion = pendingSubRegionParent;
        isDrawingSubRegion = false;
        pendingSubRegionParent = null;
        subRegionDrawHandler = null;
        updateSubRegionButton();

        if (!parentRegion || !turf.booleanWithin(layer.toGeoJSON(), parentRegion.toGeoJSON())) {
            locationResult.textContent = 'سنووری بچووک دەبێت بە تەواوی لەناو سنووری parent بێت.';
            return;
        }
    }

    layer.kind = 'region';
    layer.regionId = createRegionId();
    layer.parentRegionId = parentRegion ? parentRegion.regionId : null;
    layer.regionStyle = parentRegion ? getSubRegionStyle(parentRegion) : getSelectedStyle();
    layer.setStyle(layer.regionStyle);

    pendingRegionLayer = layer;
    pendingRegionParentId = parentRegion ? parentRegion.regionId : null;
    pendingNamedPointLatLng = null;
    editingLabelLayer = null;
    updateSubRegionButton();
    namedPointTitle.textContent = 'ناوی سنوور';
    namedPointNameLabel.textContent = 'ناوی لیژنە یان ناوچە';
    namedPointNameInput.value = '';
    namedPointDialog.hidden = false;
    namedPointNameInput.focus();
});

map.on(L.Draw.Event.EDITED, function () {
    saveRegions();
    sync3DRegions();
});
map.on(L.Draw.Event.DELETED, function () {
    saveRegions();
    sync3DRegions();
});

map.on('click', function (event) {
    if (isPlacingNamedPoint) {
        beginNamedPointPlacement(event.latlng);
        return;
    }

    var clickedPoint = turf.point([event.latlng.lng, event.latlng.lat]);
    var matchingRegion = null;
    var matchingDepth = -1;

    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point') return;

        var feature = layer.toGeoJSON();
        if (turf.booleanPointInPolygon(clickedPoint, feature)) {
            var depth = getRegionDepth(layer);
            if (depth > matchingDepth) {
                matchingRegion = layer;
                matchingDepth = depth;
            }
        }
    });

    if (!matchingRegion) {
        regionFilter.value = '';
        selectRegion(null);
        setSelectedLabelLayer(null);
        showSelectedRegion('');
        locationResult.textContent = 'ئەم شوێنە لە هیچ سنوورێکی کێشراودا نییە.';
        map.closePopup();
        return;
    }

    regionFilter.value = getRegionFilterName(matchingRegion);
    selectRegion(matchingRegion);
    showSelectedRegion(regionFilter.value);

    matchingRegion.setStyle(Object.assign({}, matchingRegion.regionStyle, {
        color: '#e11d48',
        weight: 7
    }));

    var regionName = matchingRegion.regionName || 'ناوچەی بێ‌ناو';
    var message = 'ئەم شوێنە لە سنووری لیژنەی ' + regionName + ' ـدایە.';
    locationResult.textContent = message;

    var popupContent = document.createElement('span');
    popupContent.textContent = message;
    L.popup()
        .setLatLng(event.latlng)
        .setContent(popupContent)
        .openOn(map);
});

map.fitBounds(sulaymaniyahBounds, { padding: [20, 20] });
initializeOnlineAccess();