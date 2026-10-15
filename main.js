// ١. تەسکرکردنەوەی سنووری نەخشە بۆ سلێمانی
var sulaymaniyahBounds = L.latLngBounds(
    L.latLng(35.4500, 45.2500),
    L.latLng(35.9500, 45.6000)
);

// ٢. دروستکردنی نەخشە
var map = L.map('map', {
    center: [35.5558, 45.4351],
    zoom: 14,
    minZoom: 12,
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
var locationResult = document.getElementById('locationResult');
var regionFilter = document.getElementById('regionFilter');
var applyRegionStyleButton = document.getElementById('applyRegionStyle');
var refreshRegionInfoButton = document.getElementById('refreshRegionInfo');
var editNamedLabelButton = document.getElementById('editNamedLabelButton');
var regionInfoResults = document.getElementById('regionInfoResults');
var selectedRegionLayer = null;
var selectedLabelLayer = null;
var editingLabelLayer = null;
var regionInfoCache = new WeakMap();
var regionInfoAbortController = null;
var regionInfoRequestLayer = null;

var borderColorInput = document.getElementById('borderColor');
var fillColorInput = document.getElementById('fillColor');
var fillOpacityInput = document.getElementById('fillOpacity');
var opacityValue = document.getElementById('opacityValue');
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
        return regionBody === region.areaName || regionBody === region.name;
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

function createNamedPointContent(name, className) {
    var content = document.createElement('div');
    content.className = className;
    content.dir = 'rtl';

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

function createNamedPointIcon(name) {
    return L.divIcon({
        className: 'named-point-marker',
        html: createNamedPointContent(name, 'named-point-content'),
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
            filterName: getRegionFilterName(layer),
            leafletId: String(layer._leaflet_id),
            color: layer.regionStyle.color,
            fillColor: layer.regionStyle.fillColor,
            fillOpacity: layer.regionStyle.fillOpacity
        });
        features.push(feature);
    });

    return { type: 'FeatureCollection', features: features };
}

function getRegionFilterName(layer) {
    if (layer.kind === 'named-point') return '';
    return layer.filterName || normalizeRegionName(layer.regionName);
}

function setSelectedLabelLayer(layer) {
    selectedLabelLayer = layer;
    editNamedLabelButton.disabled = !isMapAdmin || !layer;
}

function findRegionForNamedPoint(pointLayer) {
    var latlng = pointLayer.getLatLng();
    var point = turf.point([latlng.lng, latlng.lat]);
    var matchingRegion = null;

    drawnItems.eachLayer(function (layer) {
        if (matchingRegion || layer.kind === 'named-point') return;
        if (turf.booleanPointInPolygon(point, layer.toGeoJSON())) {
            matchingRegion = layer;
        }
    });

    return matchingRegion;
}

function focusRegionFromNamedPoint(pointLayer, mode) {
    setSelectedLabelLayer(pointLayer);
    var region = findRegionForNamedPoint(pointLayer);
    if (!region) {
        locationResult.textContent = 'بۆ ئەم خاڵە هیچ سنووری لیژنەیەک نەدۆزرایەوە.';
        return;
    }

    regionFilter.value = getRegionFilterName(region);
    selectRegion(region);
    showSelectedRegion(regionFilter.value);
    locationResult.textContent = 'خاڵەکە لە سنووری ' + region.regionName + ' ـدایە.';

    if (mode === '3d' && map3D) {
        var bounds = region.getBounds();
        map3D.fitBounds([
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()]
        ], {
            padding: 80,
            maxZoom: 16,
            pitch: 60,
            duration: 800
        });
    } else {
        map.flyToBounds(region.getBounds(), {
            padding: [60, 60],
            maxZoom: 16,
            duration: 0.8
        });
    }
    setSelectedLabelLayer(pointLayer);
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
                createNamedPointContent(properties.name, 'map3d-named-point') :
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
                    createNamedPointContent(properties.name, 'map3d-named-point')
                );
            } else {
                label.getElement().textContent = properties.name;
            }
            label.getElement().setAttribute('aria-label', properties.name);
        }

        label.getElement().hidden = Boolean(!isNamedPoint && regionFilter.value &&
            properties.filterName !== regionFilter.value);
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

    var filter = regionFilter.value ?
        ['==', ['get', 'filterName'], regionFilter.value] : null;
    ['committee-fill', 'committee-outline'].forEach(function (id) {
        map3D.setFilter(id, filter);
    });
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
        center: [45.4351, 35.5558],
        zoom: 15,
        minZoom: 14,
        maxZoom: 17,
        pitch: 60,
        bearing: -20,
        maxPitch: 75,
        maxBounds: [[45.0, 35.2], [45.9, 36.1]],
        attributionControl: true
    });
    map3D.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map3D.on('load', function () {
        map3D.addSource('committee-regions', {
            type: 'geojson',
            data: getRegionFeatureCollection()
        });

        map3D.addLayer({
            id: 'committee-fill',
            type: 'fill',
            source: 'committee-regions',
            paint: {
                'fill-color': ['coalesce', ['get', 'fillColor'], '#3388ff'],
                'fill-opacity': ['coalesce', ['get', 'fillOpacity'], 0.3]
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
                var center = selectedRegionLayer.getBounds().getCenter();
                map3D.flyTo({
                    center: [center.lng, center.lat],
                    zoom: 15,
                    pitch: 60
                });
            }
        });
    } else {
        syncLeafletBaseLayers();
        map.invalidateSize();
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
    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point') return;
        var isVisible = !regionName ||
            getRegionFilterName(layer) === normalizeRegionName(regionName);
        layer.setStyle(isVisible ? layer.regionStyle : { opacity: 0, fillOpacity: 0 });
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
    editNamedLabelButton.disabled = !layer;
}

function enableRegionSelection(layer) {
    addRegionFilterOption(layer.regionName);
    layer.on('click', function () {
        setSelectedLabelLayer(layer);
        regionFilter.value = getRegionFilterName(layer);
        selectRegion(layer);
        showSelectedRegion(regionFilter.value);
    });
}

function selectRegion(layer) {
    selectedRegionLayer = layer;
    if (layer) setSelectedLabelLayer(layer);
    applyRegionStyleButton.disabled = !isMapAdmin || !layer;
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
            var regionStyle = Object.assign({
                color: '#0056b3',
                fillColor: '#3388ff',
                fillOpacity: 0.3,
                weight: 5
            }, properties.style || {}, { weight: 5 });
            var region = L.geoJSON(feature, { style: regionStyle });

            region.eachLayer(function (layer) {
                layer.kind = properties.kind || 'region';
                if (layer.kind === 'named-point') {
                    layer.pointName = properties.name || '';
                    layer.regionName = layer.pointName;
                    layer.regionStyle = {};
                    layer.setIcon(createNamedPointIcon(layer.pointName));
                    if (layer.pointName) {
                        var pointTitle = document.createElement('b');
                        pointTitle.textContent = layer.pointName;
                        layer.bindPopup(pointTitle);
                    }
                    drawnItems.addLayer(layer);
                    enableNamedPointDragging(layer);
                    return;
                }

                layer.regionName = normalizeRegionName(properties.name);
                layer.filterName = properties.filterName || normalizeRegionName(properties.name);
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
    editNamedLabelButton.disabled = !isMapAdmin || !selectedLabelLayer;
    refreshRegionInfoButton.disabled = !selectedRegionLayer;
    if (!isMapAdmin && isPlacingNamedPoint) setNamedPointPlacement(false);
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
        var result = await supabaseClient.from('map_state').upsert({
            id: 'sulaymaniyah',
            data: collection,
            updated_at: new Date().toISOString(),
            updated_by: currentAuthUser.id
        });
        if (result.error) throw result.error;
        storageStatus.textContent = 'هەموو داتاکان بۆ cloud خەزن کران';
        return true;
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
        migrateLocalDataButton.hidden = true;
        legacyLocalFeatureCollection = null;
        loadFeatureCollection({ type: 'FeatureCollection', features: [] });
        mapAccessGate.hidden = false;
        accessStatus.textContent = 'چوونەژوورەوە پێویستە';
        mapAccessMessage.textContent = 'بۆ بینینی نەخشە، بە هەژماری خۆت بچۆرە ژوورەوە.';
        if (supabaseClient) adminEmailInput.focus();
        return;
    }

    accessStatus.textContent = canEdit ? 'ئەدمین: دەستکاری چالاکە' : 'بینەر: تەنها بینین';
    await loadCloudMap();
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
    try {
        var result = await supabaseClient.auth.signInWithPassword({
            email: adminEmailInput.value.trim(),
            password: adminPasswordInput.value
        });
        loginError = result.error;
    } catch (error) {
        loginError = error;
    }

    if (loginError) {
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

function setNamedPointPlacement(active) {
    if (active && !isMapAdmin) return;
    isPlacingNamedPoint = active;
    addNamedPointButton.setAttribute('aria-pressed', String(active));
    map.getContainer().style.cursor = active ? 'crosshair' : '';
    if (map3D) map3D.getCanvas().style.cursor = active ? 'crosshair' : '';
    if (!active) {
        namedPointDialog.hidden = true;
        pendingNamedPointLatLng = null;
        editingLabelLayer = null;
        namedPointTitle.textContent = 'ناوی خاڵ';
        namedPointNameLabel.textContent = 'ناوی شوێن';
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
    var marker = L.marker(latlng, {
        icon: createNamedPointIcon(pointName),
        title: pointName,
        alt: pointName,
        keyboard: true,
        draggable: true
    });
    marker.kind = 'named-point';
    marker.pointName = pointName;
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
        layer.setIcon(createNamedPointIcon(newName));
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
    setNamedPointPlacement(!isPlacingNamedPoint);
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isPlacingNamedPoint) {
        event.preventDefault();
        setNamedPointPlacement(false);
    }
});

// ٦. کاتێک سنوورێک دەکێشیت، ئەم کۆدە کار دەکات
map.on(L.Draw.Event.CREATED, function (e) {
    if (!isMapAdmin) return;
    var layer = e.layer;

    layer.kind = 'region';
    layer.regionStyle = getSelectedStyle();
    layer.setStyle(layer.regionStyle);
    
    var regionName = prompt("ناوی ئەم ناوچەیە یان لیژنەیە چییە؟ (بۆ نموونە: لیژنەی ناوچەی یەک)");
    layer.regionName = normalizeRegionName(regionName);
    layer.filterName = normalizeRegionName(regionName);
    addRegionFilterOption(layer.regionName);
    enableRegionSelection(layer);
    addRegionLabel(layer);
    if (regionName) {
        var title = document.createElement('b');
        title.textContent = layer.regionName;
        layer.bindPopup(title);
    }

    drawnItems.addLayer(layer);
    showSelectedRegion(regionFilter.value);
    saveRegions();
    sync3DRegions();
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

    drawnItems.eachLayer(function (layer) {
        if (matchingRegion) return;
        if (layer.kind === 'named-point') return;

        var feature = layer.toGeoJSON();
        if (turf.booleanPointInPolygon(clickedPoint, feature)) {
            matchingRegion = layer;
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

    regionFilter.value = normalizeRegionName(matchingRegion.regionName);
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

// زوومی سەرەتایی نەخشە لەسەر سەنتەری سلێمانی
map.setView([35.5558, 45.4351], 14);
initializeOnlineAccess();