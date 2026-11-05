var iraqBounds = L.latLngBounds(
    L.latLng(28.0, 38.0),
    L.latLng(37.8, 49.5)
);

var map = L.map('map', {
    center: [33.2, 43.7],
    zoom: 6,
    minZoom: 5,
    maxZoom: 17,
    maxBounds: iraqBounds,
    maxBoundsViscosity: 1.0
});
var mapFocusBlurOverlay = createMapFocusBlurOverlay(map.getContainer());
var map3DFocusBlurOverlay = null;

var streetMapLayer = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        className: 'digital-street-base-tile',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }
);
var satelliteMapLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
        maxZoom: 19,
        className: 'digital-satellite-base-tile',
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
var currentMapMode = '3d';

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
function syncMapLabelScale(zoom, container) {
    var scale = Math.max(0.84, Math.min(1.12, 0.84 + (zoom - 8) * 0.025));
    container.style.setProperty('--map-label-scale', String(scale));
}

map.on('move zoom resize', function () {
    updateMapFocusBlurOverlay();
    syncMapLabelScale(map.getZoom(), map.getContainer());
});
syncMapLabelScale(map.getZoom(), map.getContainer());

var outsideMaskPane = map.createPane('outsideMapMask');
outsideMaskPane.style.zIndex = 680;
outsideMaskPane.style.pointerEvents = 'none';

var mapSouth = iraqBounds.getSouth();
var mapNorth = iraqBounds.getNorth();
var mapWest = iraqBounds.getWest();
var mapEast = iraqBounds.getEast();

function fitMapToIraq(duration) {
    if (currentMapMode === '3d' && map3D) {
        map3D.fitBounds([[mapWest, mapSouth], [mapEast, mapNorth]], {
            padding: 20,
            duration: duration
        });
        return;
    }

    map.fitBounds(iraqBounds, {
        padding: [20, 20],
        animate: duration > 0,
        duration: duration / 1000
    });
}

var maskStyle = {
    pane: 'outsideMapMask',
    stroke: false,
    fillColor: '#030916',
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
var branchFilter = document.getElementById('branchFilter');
var branchViewNotice = document.getElementById('branchViewNotice');
var openBranchManagementButton = document.getElementById('openBranchManagementButton');
var branchManagementDialog = document.getElementById('branchManagementDialog');
var closeBranchManagementButton = document.getElementById('closeBranchManagementButton');
var branchManagementSelect = document.getElementById('branchManagementSelect');
var newBranchNameInput = document.getElementById('newBranchName');
var createBranchButton = document.getElementById('createBranchButton');
var branchNameInput = document.getElementById('branchNameInput');
var saveBranchNameButton = document.getElementById('saveBranchNameButton');
var deleteBranchButton = document.getElementById('deleteBranchButton');
var branchDeleteConfirmation = document.getElementById('branchDeleteConfirmation');
var branchDeleteMessage = document.getElementById('branchDeleteMessage');
var deleteBranchNameConfirm = document.getElementById('deleteBranchNameConfirm');
var confirmDeleteBranchButton = document.getElementById('confirmDeleteBranchButton');
var cancelDeleteBranchButton = document.getElementById('cancelDeleteBranchButton');
var branchAccountEmailInput = document.getElementById('branchAccountEmail');
var branchAccountPasswordInput = document.getElementById('branchAccountPassword');
var branchAccountAccessChoices = document.getElementById('branchAccountAccessChoices');
var saveBranchAccountButton = document.getElementById('saveBranchAccountButton');
var branchAdminStatus = document.getElementById('branchAdminStatus');
var newRegionNameInput = document.getElementById('newRegionName');
var addRegionNameButton = document.getElementById('addRegionNameButton');
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
var boundaryStatsPanel = document.getElementById('boundaryStatsPanel');
var boundaryWeatherSummary = document.getElementById('boundaryWeatherSummary');
var boundaryWeatherScope = document.getElementById('boundaryWeatherScope');
var boundaryWeatherIcon = document.getElementById('boundaryWeatherIcon');
var boundaryWeatherUpdated = document.getElementById('boundaryWeatherUpdated');
var weatherTemperatureValue = document.getElementById('weatherTemperatureValue');
var weatherFeelsLikeValue = document.getElementById('weatherFeelsLikeValue');
var weatherCloudValue = document.getElementById('weatherCloudValue');
var weatherHumidityValue = document.getElementById('weatherHumidityValue');
var weatherPrecipitationValue = document.getElementById('weatherPrecipitationValue');
var weatherWindValue = document.getElementById('weatherWindValue');
var refreshBoundaryWeatherButton = document.getElementById('refreshBoundaryWeatherButton');
var weatherAbortController = null;
var weatherRequestToken = 0;
var weatherEffectType = '';
var weatherEffectFeatures = [];
var weatherEffectCanvas2D = null;
var weatherEffectCanvas3D = null;
var weatherEffectFrame = null;
var lastWeatherEffectFrame = null;
var lastWeatherRenderTime = 0;
var weatherParticles = Array.from({ length: 64 }, function () {
    return { x: Math.random(), y: Math.random() };
});
var isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 18;
var regionStatsModeButton = document.getElementById('regionStatsModeButton');
var branchStatsModeButton = document.getElementById('branchStatsModeButton');
var boundaryStatsScope = document.getElementById('boundaryStatsScope');
var boundaryAreaValue = document.getElementById('boundaryAreaValue');
var boundaryPopulationValue = document.getElementById('boundaryPopulationValue');
var boundaryBuildingValue = document.getElementById('boundaryBuildingValue');
var branchRegionCountRow = document.getElementById('branchRegionCountRow');
var branchRegionCountValue = document.getElementById('branchRegionCountValue');
var boundaryStatsNote = document.getElementById('boundaryStatsNote');
var populationEditor = document.getElementById('populationEditor');
var populationCountInput = document.getElementById('populationCountInput');
var savePopulationButton = document.getElementById('savePopulationButton');
var refreshBuildingStatsButton = document.getElementById('refreshBuildingStatsButton');
var boundaryStatsMode = 'region';
var buildingCountCache = new Map();
var buildingStatsAbortController = null;
var buildingStatsRequestToken = 0;

var borderColorInput = document.getElementById('borderColor');
var fillColorInput = document.getElementById('fillColor');
var fillOpacityInput = document.getElementById('fillOpacity');
var opacityValue = document.getElementById('opacityValue');
var namedPointColorInput = document.getElementById('namedPointColor');
var applyNamedPointColorButton = document.getElementById('applyNamedPointColor');
var defaultNamedPointColor = '#e11d48';
var map2DButton = document.getElementById('map2DButton');
var map3DButton = document.getElementById('map3DButton');
var globeOverviewButton = document.getElementById('globeOverviewButton');
var satelliteModeButton = document.getElementById('satelliteMapButton');
var addNamedPointButton = document.getElementById('addNamedPointButton');
var map3DContainer = document.getElementById('map3d');
var map3D = null;
var globeRotationFrame = null;
var globeRotationTimestamp = null;
var globeReturnIdleListener = null;
var globeReturnMoveListener = null;
var globeReturnToken = 0;
var pendingBranchFocus = false;
var pendingBranchFocusDuration = null;
var branchFocusIdleListener = null;
var map3DRegionLabels = new Map();
var map3DSelectionOutline = null;
var map3DSelectionFillPath = null;
var map3DSelectionOutlinePath = null;
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
var isGlobalMapAdmin = false;
var currentAuthUser = null;
var selectedBranchId = null;
var isGlobeOverview = true;
var pendingGlobeReturn = false;
var availableBranches = [];
var branchLoadToken = 0;
var branchRegionNames = [];
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
    var trimmedName = typeof regionName === 'string' ? regionName.trim() : '';
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
                normalizeNamedPointColor(layer.pointColor) : null,
            populationCount: Number.isSafeInteger(layer.populationCount) &&
                layer.populationCount >= 0 ? layer.populationCount : null
        });
        features.push(feature);
    });

    return {
        type: 'FeatureCollection',
        features: features,
        regionNames: branchRegionNames.slice()
    };
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
        var isSelectedLabel = Boolean(selectedLabelLayer &&
            String(selectedLabelLayer._leaflet_id) === labelId);
        label.getElement().hidden = !isNamedPoint && !isSelectedLabel;
        label.getElement().classList.toggle('is-label-selected',
            isNamedPoint && isSelectedLabel);
        var isForeground = Boolean(!isNamedPoint && selectedRegion &&
            isRegionRelatedToSelection(regionLayer, selectedRegion));
        label.getElement().classList.toggle('region-focus-background',
            Boolean(!isNamedPoint && selectedRegion && !isForeground));
        label.getElement().classList.toggle('region-focus-foreground', isForeground);
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
    if (!map3D.getLayer('committee-fill')) return;

    var selectedRegion = getSelectedRegionLayer(regionFilter.value);
    [
        'committee-fill',
        'committee-extrusion',
        'committee-cap',
        'committee-outline',
        'committee-glow',
        'committee-selected-glow'
    ].forEach(function (id) {
        if (!map3D.getLayer(id)) return;
        map3D.setFilter(id, id === 'committee-selected-glow' ?
            (selectedRegion ? ['==', ['get', 'regionId'], selectedRegion.regionId] :
                ['==', ['get', 'regionId'], '']) : null);
        map3D.setLayoutProperty(id, 'visibility',
            isGlobeOverview ? 'none' : 'visible');
    });
    sync3DSelectionOutline();
}

function sync3DSelectionOutline() {
    if (!map3D || !map3DContainer || !map3D.isStyleLoaded()) return;

    if (!map3DSelectionOutline) {
        map3DSelectionOutline = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        map3DSelectionOutline.classList.add('map3d-selection-outline');
        map3DSelectionOutline.setAttribute('aria-hidden', 'true');
        map3DSelectionFillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        map3DSelectionFillPath.classList.add('map3d-selection-fill-path');
        map3DSelectionOutlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        map3DSelectionOutlinePath.classList.add('map3d-selection-outline-path');
        map3DSelectionOutline.appendChild(map3DSelectionFillPath);
        map3DSelectionOutline.appendChild(map3DSelectionOutlinePath);
        map3DContainer.appendChild(map3DSelectionOutline);
    }

    var selectedRegion = getSelectedRegionLayer(regionFilter.value);
    if (!selectedRegion || currentMapMode !== '3d') {
        map3DSelectionOutline.hidden = true;
        return;
    }

    var geometry = selectedRegion.toGeoJSON().geometry;
    var polygons = geometry.type === 'Polygon' ? [geometry.coordinates] :
        geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
    var pathData = [];
    polygons.forEach(function (rings) {
        rings.forEach(function (ring) {
            ring.forEach(function (coordinate, index) {
                var point = map3D.project(coordinate, 220);
                pathData.push((index ? 'L' : 'M') + point.x + ' ' + point.y);
            });
            pathData.push('Z');
        });
    });

    map3DSelectionOutline.setAttribute('viewBox',
        '0 0 ' + map3D.getContainer().clientWidth + ' ' + map3D.getContainer().clientHeight);
    map3DSelectionFillPath.setAttribute('d', pathData.join(' '));
    map3DSelectionOutlinePath.setAttribute('d', pathData.join(' '));
    map3DSelectionFillPath.style.setProperty(
        '--selected-region-fill-color',
        selectedRegion.regionStyle.fillColor || '#3388ff'
    );
    map3DSelectionFillPath.setAttribute('fill-rule', 'evenodd');
    map3DSelectionOutlinePath.style.setProperty(
        '--selected-region-color',
        selectedRegion.regionStyle.color || '#0056b3'
    );
    map3DSelectionOutline.hidden = !pathData.length;
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

function addDigitalGlobeGrid() {
    var features = [];
    for (var longitude = -180; longitude <= 180; longitude += 15) {
        var meridian = [];
        for (var latitude = -80; latitude <= 80; latitude += 2) {
            meridian.push([longitude, latitude]);
        }
        features.push({
            type: 'Feature',
            properties: { kind: 'longitude' },
            geometry: { type: 'LineString', coordinates: meridian }
        });
    }
    for (var parallel = -75; parallel <= 75; parallel += 15) {
        var latitudeLine = [];
        for (var longitudePoint = -180; longitudePoint <= 180; longitudePoint += 2) {
            latitudeLine.push([longitudePoint, parallel]);
        }
        features.push({
            type: 'Feature',
            properties: { kind: 'latitude' },
            geometry: { type: 'LineString', coordinates: latitudeLine }
        });
    }
    return { type: 'FeatureCollection', features: features };
}

function applyDigitalMapPalette() {
    var palette = isDaytime ? {
        background: '#d8e6e8',
        landDetail: '#d5dfd9',
        water: '#b7d7e1',
        cyan: '#087e9d',
        softCyan: '#3e7887',
        magenta: '#ad478c',
        text: '#183443',
        halo: '#eef5f3'
    } : {
        background: '#030916',
        landDetail: '#0b263c',
        water: '#041326',
        cyan: '#16d9f5',
        softCyan: '#147f9f',
        magenta: '#ff45ca',
        text: '#c4f4ff',
        halo: '#06101e'
    };

    map3D.setPaintProperty('background', 'background-color', palette.background);
    map3D.getStyle().layers.forEach(function (layer) {
        if (layer.source === 'committee-regions') return;

        if (layer.type === 'raster') {
            map3D.setPaintProperty(layer.id, 'raster-saturation', isDaytime ? 0 : -0.7);
            map3D.setPaintProperty(layer.id, 'raster-contrast', isDaytime ? 0 : 0.25);
            map3D.setPaintProperty(layer.id, 'raster-brightness-min', isDaytime ? 0 : 0.02);
            map3D.setPaintProperty(layer.id, 'raster-brightness-max', isDaytime ? 1 : 0.38);
            map3D.setPaintProperty(layer.id, 'raster-hue-rotate', isDaytime ? 0 : 195);
            return;
        }

        if (layer.type === 'fill') {
            var fillColor = layer.id === 'water' ? palette.water :
                layer.id === 'park' ? (isDaytime ? '#a9c5ad' : '#082f34') :
                    layer.id === 'landcover_ice' ? (isDaytime ? '#e6eeee' : '#17394c') : palette.landDetail;
            map3D.setPaintProperty(layer.id, 'fill-color', fillColor);
            if (layer.id === 'park') {
                map3D.setPaintProperty(layer.id, 'fill-opacity', 0.42);
                map3D.setPaintProperty(layer.id, 'fill-outline-color', '#147e85');
            } else if (layer.id === 'building') {
                map3D.setPaintProperty(layer.id, 'fill-color', isDaytime ? '#c1c6b8' : '#12334d');
                map3D.setPaintProperty(layer.id, 'fill-outline-color', isDaytime ? '#829b9b' : '#17627d');
            } else if (layer.id.indexOf('landcover_') === 0 ||
                layer.id.indexOf('landuse_') === 0) {
                map3D.setPaintProperty(layer.id, 'fill-opacity', 0.38);
            }
            return;
        }

        if (layer.type === 'line') {
            var lineColor = layer.id.indexOf('boundary_') === 0 ? (isDaytime ? '#567a83' : '#14516c') :
                layer.id.indexOf('waterway_') === 0 ? (isDaytime ? '#579eb3' : '#0d7494') :
                    layer.id.indexOf('park_') === 0 ? (isDaytime ? '#6d9877' : '#16827c') :
                        layer.id.indexOf('_casing') !== -1 ? (isDaytime ? '#75828a' : '#071525') :
                            layer.id.indexOf('rail') !== -1 ? (isDaytime ? '#748e91' : '#27627b') :
                                palette.softCyan;
            map3D.setPaintProperty(layer.id, 'line-color', lineColor);
            if (layer.id.indexOf('road_') === 0 ||
                layer.id.indexOf('bridge_') === 0 ||
                layer.id.indexOf('tunnel_') === 0) {
                map3D.setPaintProperty(layer.id, 'line-opacity',
                    layer.id.indexOf('_casing') !== -1 ? 0.75 : 0.5);
            }
            return;
        }

        if (layer.type === 'fill-extrusion' && layer.id === 'building-3d') {
            map3D.setPaintProperty(layer.id, 'fill-extrusion-color', isDaytime ? '#9aaba9' : '#0d5272');
            map3D.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.68);
            return;
        }

        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            map3D.setPaintProperty(layer.id, 'text-color',
                layer.id.indexOf('water_') === 0 ? (isDaytime ? '#267c98' : '#66cde5') : palette.text);
            map3D.setPaintProperty(layer.id, 'text-halo-color', palette.halo);
            map3D.setPaintProperty(layer.id, 'text-halo-width', 1.3);
            map3D.setPaintProperty(layer.id, 'text-halo-blur', 0.4);
        }
    });

    [
        { id: 'highway-name-minor', minZoom: 13 },
        { id: 'highway-name-path', minZoom: 13.5 }
    ].forEach(function (labelRange) {
        var layer = map3D.getStyle().layers.find(function (styleLayer) {
            return styleLayer.id === labelRange.id;
        });
        if (layer) {
            map3D.setLayerZoomRange(
                layer.id,
                labelRange.minZoom,
                typeof layer.maxzoom === 'number' ? layer.maxzoom : 24
            );
        }
    });

    return palette;
}

function applyDigitalMapStyle() {
    var palette = applyDigitalMapPalette();
    map3D.addSource('digital-globe-grid', {
        type: 'geojson',
        data: addDigitalGlobeGrid()
    });
    var firstSymbolLayer = map3D.getStyle().layers.find(function (layer) {
        return layer.type === 'symbol';
    });
    var firstSymbolLayerId = firstSymbolLayer && firstSymbolLayer.id;
    map3D.addLayer({
        id: 'digital-globe-grid-glow',
        type: 'line',
        source: 'digital-globe-grid',
        paint: {
            'line-color': palette.magenta,
            'line-width': 1.8,
            'line-blur': 2,
            'line-opacity': [
                'interpolate', ['linear'], ['zoom'],
                0, 0.16, 3, 0.08, 6, 0
            ]
        }
    }, firstSymbolLayerId);
    map3D.addLayer({
        id: 'digital-globe-grid-lines',
        type: 'line',
        source: 'digital-globe-grid',
        paint: {
            'line-color': palette.cyan,
            'line-width': 0.55,
            'line-opacity': [
                'interpolate', ['linear'], ['zoom'],
                0, 0.62, 3, 0.3, 6, 0.04, 8, 0
            ]
        }
    }, firstSymbolLayerId);
}

function initialize3DMap() {
    if (map3D) return;

    map3D = new maplibregl.Map({
        container: 'map3d',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [5, 20],
        zoom: 1.6,
        minZoom: 1.4,
        maxZoom: 17,
        pitch: 0,
        bearing: 0,
        maxPitch: 75,
        projection: { type: 'globe' },
        attributionControl: true
    });
    map3DFocusBlurOverlay = createMapFocusBlurOverlay(map3DContainer);
    map3D.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map3D.on('load', function () {
        map3D.setProjection({ type: 'globe' });
        applyDigitalMapStyle();
        applyDayNightMode();
        var firstSymbolLayer = map3D.getStyle().layers.find(function (layer) {
            return layer.type === 'symbol';
        });
        var firstSymbolLayerId = firstSymbolLayer && firstSymbolLayer.id;

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
                'fill-opacity': [
                    'min',
                    0.14,
                    ['coalesce', ['get', 'fillOpacity'], 0.3]
                ],
                'fill-outline-color': '#8ceeff'
            }
        }, firstSymbolLayerId);
        map3D.addLayer({
            id: 'committee-extrusion',
            type: 'fill-extrusion',
            source: 'committee-regions',
            paint: {
                'fill-extrusion-color': '#8ceeff',
                'fill-extrusion-base': 0,
                'fill-extrusion-height': 220,
                'fill-extrusion-opacity': 0.12,
                'fill-extrusion-vertical-gradient': true
            }
        }, firstSymbolLayerId);
        map3D.addLayer({
            id: 'committee-cap',
            type: 'fill-extrusion',
            source: 'committee-regions',
            paint: {
                'fill-extrusion-color': ['coalesce', ['get', 'fillColor'], '#3388ff'],
                'fill-extrusion-base': 185,
                'fill-extrusion-height': 220,
                'fill-extrusion-opacity': 0.12,
                'fill-extrusion-vertical-gradient': true
            }
        }, firstSymbolLayerId);
        map3D.addLayer({
            id: 'committee-glow',
            type: 'line',
            source: 'committee-regions',
            paint: {
                'line-color': '#8ceeff',
                'line-width': 3,
                'line-blur': 2,
                'line-opacity': 0.95
            }
        }, firstSymbolLayerId);
        map3D.addLayer({
            id: 'committee-selected-glow',
            type: 'line',
            source: 'committee-regions',
            paint: {
                'line-color': '#ff45ca',
                'line-width': 5,
                'line-blur': 5,
                'line-opacity': 1
            }
        }, firstSymbolLayerId);
        map3D.addLayer({
            id: 'committee-outline',
            type: 'line',
            source: 'committee-regions',
            paint: {
                'line-color': '#14dcf5',
                'line-width': 3.2,
                'line-blur': 0.4
            }
        }, firstSymbolLayerId);
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
        map3D.on('render', function () {
            sync3DSelectionOutline();
            update3DFocusBlurOverlay();
        });
        map3D.on('zoom', function () {
            syncMapLabelScale(map3D.getZoom(), map3DContainer);
        });
        syncMapLabelScale(map3D.getZoom(), map3DContainer);
        if (pendingBranchFocus && selectedBranchId) {
            var duration = pendingBranchFocusDuration || 6500;
            pendingBranchFocus = false;
            pendingBranchFocusDuration = null;
            focusMapToBranch(duration);
        } else if (pendingGlobeReturn) {
            animateGlobeReturn(2400);
        } else if (isGlobeOverview || !selectedBranchId) {
            startGlobeRotation();
        }
    });
}

function stopGlobeRotation() {
    if (globeRotationFrame !== null) {
        cancelAnimationFrame(globeRotationFrame);
        globeRotationFrame = null;
    }
    globeRotationTimestamp = null;
}

function startGlobeRotation() {
    if (!map3D || currentMapMode !== '3d' || !isGlobeOverview ||
        !map3D.isStyleLoaded() || globeRotationFrame !== null ||
        document.hidden ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function rotateGlobe(timestamp) {
        if (currentMapMode !== '3d' || !isGlobeOverview || !map3D) {
            stopGlobeRotation();
            return;
        }
        if (globeRotationTimestamp !== null) {
            var elapsed = Math.min(timestamp - globeRotationTimestamp, 100);
            var center = map3D.getCenter();
            map3D.setCenter([center.lng + elapsed * 0.003, center.lat]);
        }
        globeRotationTimestamp = timestamp;
        globeRotationFrame = requestAnimationFrame(rotateGlobe);
    }

    globeRotationFrame = requestAnimationFrame(rotateGlobe);
}

function cancelGlobeReturnTransition() {
    globeReturnToken += 1;
    if (map3D && globeReturnMoveListener) {
        map3D.off('moveend', globeReturnMoveListener);
        globeReturnMoveListener = null;
    }
}

document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        stopGlobeRotation();
    } else {
        startGlobeRotation();
    }
});

function animateGlobeReturn(duration) {
    if (!map3D) {
        pendingGlobeReturn = true;
        initialize3DMap();
        return;
    }
    if (!map3D.isStyleLoaded()) {
        pendingGlobeReturn = true;
        if (!globeReturnIdleListener) {
            globeReturnIdleListener = function () {
                globeReturnIdleListener = null;
                if (pendingGlobeReturn && currentMapMode === '3d') {
                    animateGlobeReturn(duration);
                }
            };
            map3D.once('idle', globeReturnIdleListener);
        }
        return;
    }
    if (globeReturnIdleListener) {
        map3D.off('idle', globeReturnIdleListener);
        globeReturnIdleListener = null;
    }
    cancelGlobeReturnTransition();
    stopGlobeRotation();
    map3D.stop();
    pendingGlobeReturn = false;
    var center = map3D.getCenter();
    var longitudeDelta = ((center.lng - 5 + 540) % 360) - 180;
    var isAlreadyAtGlobe = Math.abs(longitudeDelta) < 0.001 &&
        Math.abs(center.lat - 20) < 0.001 &&
        Math.abs(map3D.getZoom() - 1.6) < 0.001 &&
        Math.abs(map3D.getPitch()) < 0.001 &&
        Math.abs(map3D.getBearing()) < 0.001;
    if (isAlreadyAtGlobe) {
        startGlobeRotation();
        return;
    }
    var returnToken = globeReturnToken;
    var target = {
        center: [5, 20],
        zoom: 1.6,
        pitch: 0,
        bearing: 0
    };
    globeReturnMoveListener = function () {
        map3D.off('moveend', globeReturnMoveListener);
        globeReturnMoveListener = null;
        if (returnToken !== globeReturnToken || currentMapMode !== '3d' ||
            !isGlobeOverview) return;

        var current = map3D.getCenter();
        var longitudeDelta = ((current.lng - 5 + 540) % 360) - 180;
        var reachedGlobe = Math.abs(longitudeDelta) < 0.01 &&
            Math.abs(current.lat - 20) < 0.01 &&
            Math.abs(map3D.getZoom() - target.zoom) < 0.01 &&
            Math.abs(map3D.getPitch()) < 0.01 &&
            Math.abs(map3D.getBearing()) < 0.01;
        if (!reachedGlobe) map3D.jumpTo(target);
        startGlobeRotation();
    };
    map3D.on('moveend', globeReturnMoveListener);
    map3D.flyTo({
        center: target.center,
        zoom: target.zoom,
        pitch: target.pitch,
        bearing: target.bearing,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : duration,
        essential: true
    });
}

function returnToGlobe() {
    cancelGlobeReturnTransition();
    isGlobeOverview = true;
    pendingBranchFocus = false;
    pendingBranchFocusDuration = null;
    pendingGlobeReturn = true;
    stopGlobeRotation();
    regionFilter.value = '';
    selectRegion(null);
    showSelectedRegion('');

    if (currentMapMode !== '3d') {
        setMapMode('3d');
        return;
    }
    if (!map3D) initialize3DMap();
    animateGlobeReturn(2400);
}

function getBranchBounds() {
    var regions = L.geoJSON(getRegionFeatureCollection(), {
        filter: function (feature) {
            return !feature.properties || feature.properties.kind !== 'named-point';
        }
    });
    var bounds = regions.getBounds();
    return bounds.isValid() ? bounds : iraqBounds;
}

function focusMapToBranch(duration) {
    if (!selectedBranchId) return;
    cancelGlobeReturnTransition();
    isGlobeOverview = false;
    pendingGlobeReturn = false;
    stopGlobeRotation();
    update3DRegionFilter();
    var bounds = getBranchBounds();
    var motionDuration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ?
        0 : duration;

    if (currentMapMode === '3d') {
        if (!map3D || !map3D.isStyleLoaded()) {
            pendingBranchFocus = true;
            pendingBranchFocusDuration = duration;
            if (map3D && !branchFocusIdleListener) {
                branchFocusIdleListener = function () {
                    branchFocusIdleListener = null;
                    if (!pendingBranchFocus || !selectedBranchId) return;
                    var queuedDuration = pendingBranchFocusDuration || 6500;
                    pendingBranchFocus = false;
                    pendingBranchFocusDuration = null;
                    focusMapToBranch(queuedDuration);
                };
                map3D.once('idle', branchFocusIdleListener);
            }
            return;
        }
        pendingBranchFocus = false;
        pendingBranchFocusDuration = null;
        var leftPadding = Math.min(
            300,
            Math.max(56, map3D.getContainer().clientWidth * 0.42)
        );
        var camera = map3D.cameraForBounds([
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()]
        ], {
            padding: { top: 56, right: 56, bottom: 56, left: leftPadding },
            maxZoom: 12,
            pitch: 48
        });
        if (!camera) return;
        map3D.flyTo(Object.assign({}, camera, {
            zoom: Math.min(camera.zoom, 12),
            pitch: 48,
            bearing: -12,
            duration: motionDuration,
            curve: 1.55,
            essential: true
        }));
        return;
    }

    map.flyToBounds(bounds, {
        paddingTopLeft: [280, 56],
        paddingBottomRight: [56, 56],
        maxZoom: 14,
        duration: motionDuration / 1000,
        easeLinearity: 0.18
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
            } else if (isGlobeOverview) {
                if (pendingGlobeReturn) animateGlobeReturn(2400);
                else startGlobeRotation();
            } else if (selectedBranchId) {
                focusMapToBranch(900);
            } else {
                startGlobeRotation();
            }
        });
    } else {
        stopGlobeRotation();
        syncLeafletBaseLayers();
        map.invalidateSize();
        requestAnimationFrame(function () {
            if (selectedRegionLayer) {
                focusRegionView(selectedRegionLayer);
            } else if (isGlobeOverview) {
                fitMapToIraq(0);
            } else if (selectedBranchId) {
                focusMapToBranch(900);
            } else {
                fitMapToIraq(0);
            }
        });
    }
    syncWeatherEffects();
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
globeOverviewButton.addEventListener('click', returnToGlobe);

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

function addBranchRegionName(regionName) {
    var canonicalName = normalizeRegionName(regionName);
    if (!canonicalName || branchRegionNames.includes(canonicalName)) return false;
    branchRegionNames.push(canonicalName);
    addRegionFilterOption(canonicalName);
    return true;
}

function resetRegionFilterOptions() {
    Array.from(regionFilter.options).forEach(function (option, index) {
        if (index > 0) option.remove();
    });
    regionFilter.value = '';
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

function getBoundaryStatsLayers() {
    if (boundaryStatsMode === 'region') {
        return selectedRegionLayer && selectedRegionLayer.kind !== 'named-point' ?
            [selectedRegionLayer] : [];
    }

    var layers = [];
    drawnItems.eachLayer(function (layer) {
        if (layer.kind !== 'named-point' && !layer.parentRegionId) layers.push(layer);
    });
    return layers;
}

function getBoundaryStatsArea(layers) {
    var features = layers.map(function (layer) {
        return layer.toGeoJSON();
    });
    if (!features.length) return 0;
    var areaFeature = features.length === 1 ? features[0] :
        turf.union(turf.featureCollection(features));
    return areaFeature ? turf.area(areaFeature) : 0;
}

function createBuildingCountQuery(layers) {
    var queries = [];
    layers.forEach(function (layer) {
        var feature = turf.simplify(layer.toGeoJSON(), {
            tolerance: 0.00005,
            highQuality: false
        });
        var geometry = feature.geometry;
        var polygons = geometry.type === 'Polygon' ? [geometry.coordinates] :
            geometry.type === 'MultiPolygon' ? geometry.coordinates : [];

        polygons.forEach(function (polygon) {
            var outerRing = polygon[0];
            if (!outerRing || outerRing.length < 4) return;
            var coordinates = outerRing.map(function (coordinate) {
                return coordinate[1].toFixed(6) + ' ' + coordinate[0].toFixed(6);
            }).join(' ');
            queries.push('nwr(poly:"' + coordinates + '")["building"];');
        });
    });

    if (!queries.length) {
        throw new Error('هیچ پۆلیگۆنێکی دروست بۆ ژماردنی بیناکان نییە.');
    }
    return '[out:json][timeout:60];(' + queries.join('') + ');out ids;';
}

async function requestBuildingCount(layers, signal) {
    var query = createBuildingCountQuery(layers);
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
                throw new Error('سێرڤەری OpenStreetMap وەڵامی ' +
                    response.status + 'ی دایە.');
            }
            var data = await response.json();
            return (data.elements || []).length;
        } catch (error) {
            if (signal.aborted) throw error;
            lastError = error;
        }
    }
    throw lastError || new Error('نەتوانرا ژمارەی بیناکان بهێنرێت.');
}

function formatBoundaryStat(value, fractionDigits) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: fractionDigits == null ? 0 : fractionDigits
    }).format(value);
}

function updateBoundaryStats() {
    if (buildingStatsAbortController) {
        buildingStatsAbortController.abort();
        buildingStatsAbortController = null;
    }
    var requestToken = ++buildingStatsRequestToken;
    var layers = getBoundaryStatsLayers();
    var isBranchSummary = boundaryStatsMode === 'branch';
    regionStatsModeButton.setAttribute('aria-pressed', String(!isBranchSummary));
    branchStatsModeButton.setAttribute('aria-pressed', String(isBranchSummary));
    branchRegionCountRow.hidden = !isBranchSummary;
    populationEditor.hidden = isBranchSummary ||
        !selectedRegionLayer || selectedRegionLayer.kind === 'named-point';
    populationCountInput.disabled = !isMapAdmin || populationEditor.hidden;
    savePopulationButton.disabled = !isMapAdmin || populationEditor.hidden;
    refreshBuildingStatsButton.disabled = !layers.length;

    if (!isBranchSummary && selectedRegionLayer &&
        selectedRegionLayer.kind !== 'named-point') {
        boundaryStatsScope.textContent = selectedRegionLayer.regionName || 'ناوچەی بێ‌ناو';
        populationCountInput.value = Number.isSafeInteger(selectedRegionLayer.populationCount) ?
            String(selectedRegionLayer.populationCount) : '';
    } else if (isBranchSummary) {
        var branch = availableBranches.find(function (item) {
            return item.id === selectedBranchId;
        });
        boundaryStatsScope.textContent = branch ?
            'کۆی سنوورە سەرەکییەکانی ' + branch.name :
            'لقێک هەڵبژێرە بۆ بینینی کۆی سنوورەکان.';
    } else {
        boundaryStatsScope.textContent = 'ناوچەیەک لە نەخشەکە هەڵبژێرە.';
    }

    if (!layers.length) {
        boundaryAreaValue.textContent = '—';
        boundaryPopulationValue.textContent = '—';
        boundaryBuildingValue.textContent = '—';
        branchRegionCountValue.textContent = '0';
        boundaryStatsNote.textContent = isBranchSummary ?
            'ئەم لقە هێشتا سنووری پۆلیگۆن نییە.' :
            'ناوچەیەک هەڵبژێرە بۆ پیشاندانی ئامار.';
        return;
    }

    try {
        var areaSquareKilometers = getBoundaryStatsArea(layers) / 1000000;
        boundaryAreaValue.textContent = formatBoundaryStat(areaSquareKilometers, 2) + ' km²';
    } catch (error) {
        console.error('نەتوانرا ڕووبەری سنوور هەژمار بکرێت:', error);
        boundaryAreaValue.textContent = 'هەژمارکردن سەرکەوتوو نەبوو';
    }

    var knownPopulation = 0;
    var populationCount = 0;
    layers.forEach(function (layer) {
        if (Number.isSafeInteger(layer.populationCount) && layer.populationCount >= 0) {
            knownPopulation += layer.populationCount;
            populationCount += 1;
        }
    });
    if (populationCount) {
        boundaryPopulationValue.textContent = formatBoundaryStat(knownPopulation) +
            (isBranchSummary ? ' (' + populationCount + '/' + layers.length + ')' : '');
    } else {
        boundaryPopulationValue.textContent = 'زانیاری تۆمار نەکراوە';
    }

    branchRegionCountValue.textContent = String(layers.length);
    var populationNote = isBranchSummary ?
        'دانیشتوانی ' + populationCount + ' لە ' + layers.length +
            ' سنووری سەرەکی تۆمارکراوە.' :
        'ژمارەی دانیشتوان بە دەستی ئەدمین تۆمار دەکرێت.';
    boundaryStatsNote.textContent = populationNote +
        ' ژمارەی بینا تەنها تۆمارەکانی OpenStreetMap ـە و دەتوانێت کەمتر بێت لە ژمارەی ڕاستەقینەی خانوو.';

    var cacheKey = isBranchSummary ?
        'branch:' + selectedBranchId : 'region:' + layers[0].regionId;
    if (buildingCountCache.has(cacheKey)) {
        boundaryBuildingValue.textContent =
            formatBoundaryStat(buildingCountCache.get(cacheKey));
        return;
    }

    var controller = new AbortController();
    buildingStatsAbortController = controller;
    boundaryBuildingValue.textContent = 'خەریکی ژماردن...';
    refreshBuildingStatsButton.disabled = true;
    requestBuildingCount(layers, controller.signal).then(function (count) {
        if (requestToken !== buildingStatsRequestToken) return;
        buildingCountCache.set(cacheKey, count);
        boundaryBuildingValue.textContent = formatBoundaryStat(count);
    }).catch(function (error) {
        if (requestToken !== buildingStatsRequestToken ||
            error.name === 'AbortError') return;
        console.error('نەتوانرا ژمارەی بیناکانی سنوور بژمێردرێت:', error);
        boundaryBuildingValue.textContent = 'بارکردن سەرکەوتوو نەبوو';
        boundaryStatsNote.textContent += ' نوێکردنەوەی داتای بیناکان سەرکەوتوو نەبوو؛ دووبارە هەوڵ بدە.';
    }).finally(function () {
        if (requestToken === buildingStatsRequestToken) {
            buildingStatsAbortController = null;
            refreshBuildingStatsButton.disabled = !getBoundaryStatsLayers().length;
        }
    });
}

function getWeatherBoundaryLayers() {
    if (selectedRegionLayer && selectedRegionLayer.kind !== 'named-point') {
        return [selectedRegionLayer];
    }

    var layers = [];
    drawnItems.eachLayer(function (layer) {
        if (layer.kind !== 'named-point' && !layer.parentRegionId) layers.push(layer);
    });
    return layers;
}

function getWeatherPresentation(code) {
    if (code === 0) return { text: 'ئاسمان ساماڵە', icon: '☀️', effect: '' };
    if (code === 1) return { text: 'زۆربەی ئاسمان ساماڵە', icon: '🌤️', effect: 'cloud-light' };
    if (code === 2) return { text: 'هەورە و ساماڵە', icon: '⛅', effect: 'cloud' };
    if (code === 3) return { text: 'هەورە', icon: '☁️', effect: 'cloud' };
    if ([45, 48].includes(code)) return { text: 'تەمی هەیە', icon: '🌫️', effect: '' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return { text: 'بەفر دەبارێت', icon: '❄️', effect: 'snow' };
    }
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
        return {
            text: code >= 95 ? 'ڕەشەبا و باران' : 'باران دەبارێت',
            icon: code >= 95 ? '⛈️' : '🌧️',
            effect: 'rain'
        };
    }
    return { text: 'کەش و هەوا گۆڕاوە', icon: '🌡️', effect: '' };
}

function applyDayNightMode() {
    document.body.classList.toggle('map-day', isDaytime);
    document.body.classList.toggle('map-night', !isDaytime);
    if (map3D && map3D.isStyleLoaded()) applyDigitalMapPalette();
}

function getWeatherEffectCanvas(mode) {
    var mapElement = mode === '3d' ? map3DContainer : map.getContainer();
    var property = mode === '3d' ? 'weatherEffectCanvas3D' : 'weatherEffectCanvas2D';
    var canvas = mode === '3d' ? weatherEffectCanvas3D : weatherEffectCanvas2D;
    if (!canvas || canvas.parentElement !== mapElement) {
        canvas = document.createElement('canvas');
        canvas.className = 'map-weather-effects';
        canvas.setAttribute('aria-hidden', 'true');
        mapElement.appendChild(canvas);
        if (mode === '3d') weatherEffectCanvas3D = canvas;
        else weatherEffectCanvas2D = canvas;
    }
    return canvas;
}

function projectWeatherCoordinate(mode, coordinate) {
    if (mode === '3d') return map3D.project(coordinate);
    return map.latLngToContainerPoint([coordinate[1], coordinate[0]]);
}

function traceWeatherBoundaries(context, mode) {
    context.beginPath();
    weatherEffectFeatures.forEach(function (feature) {
        var geometry = feature.geometry;
        if (!geometry) return;
        var polygons = geometry.type === 'Polygon' ? [geometry.coordinates] :
            geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
        polygons.forEach(function (polygon) {
            polygon.forEach(function (ring) {
                if (!ring.length) return;
                var firstPoint = projectWeatherCoordinate(mode, ring[0]);
                context.moveTo(firstPoint.x, firstPoint.y);
                for (var index = 1; index < ring.length; index += 1) {
                    var point = projectWeatherCoordinate(mode, ring[index]);
                    context.lineTo(point.x, point.y);
                }
                context.closePath();
            });
        });
    });
}

function drawWeatherEffectCanvas(mode) {
    var canvas = getWeatherEffectCanvas(mode);
    var isVisible = (mode === '3d' ? currentMapMode === '3d' : currentMapMode !== '3d') &&
        weatherEffectType &&
        weatherEffectFeatures.length && !document.hidden &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    canvas.hidden = !isVisible;
    if (!isVisible) return;
    if (mode === '3d' && (!map3D || !map3D.loaded())) return;

    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    var canvasWidth = Math.round(rect.width * pixelRatio);
    var canvasHeight = Math.round(rect.height * pixelRatio);
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }
    var context = canvas.getContext('2d');
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    traceWeatherBoundaries(context, mode);
    context.save();
    context.clip('evenodd');
    var frameTime = performance.now();
    var elapsed = lastWeatherEffectFrame == null ? 16 :
        Math.min(frameTime - lastWeatherEffectFrame, 50);
    weatherParticles.forEach(function (particle, index) {
        var isCloud = weatherEffectType === 'cloud' || weatherEffectType === 'cloud-light';
        particle.y += isCloud ? 0 : elapsed *
            (weatherEffectType === 'rain' ? 0.00042 : 0.00011);
        particle.x += elapsed * (isCloud ? 0.000012 :
            weatherEffectType === 'rain' ? 0.000055 : 0.000025);
        if (particle.y > 1.05) {
            particle.y = -0.05;
            particle.x = Math.random();
        }
        if (particle.x > 1.05) particle.x = -0.05;

        var x = particle.x * rect.width;
        var y = particle.y * rect.height;
        if (isCloud) {
            if (index >= 9) return;
            var cloudRadius = Math.max(34, Math.min(rect.width, rect.height) * 0.065);
            var cloudOpacity = weatherEffectType === 'cloud-light' ? 0.055 : 0.09;
            var cloudGradient = context.createRadialGradient(
                x, y, 0, x, y, cloudRadius
            );
            cloudGradient.addColorStop(0, 'rgba(223, 239, 246, ' + cloudOpacity + ')');
            cloudGradient.addColorStop(1, 'rgba(223, 239, 246, 0)');
            context.fillStyle = cloudGradient;
            context.beginPath();
            context.arc(x, y, cloudRadius, 0, Math.PI * 2);
            context.fill();
            return;
        }
        context.globalAlpha = weatherEffectType === 'rain' ? 0.42 : 0.65;
        context.strokeStyle = weatherEffectType === 'rain' ? '#d9f6ff' : '#f5fbff';
        context.fillStyle = '#f5fbff';
        if (weatherEffectType === 'rain') {
            var dropLength = 5 + (index % 4) * 2;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x - 2, y + dropLength);
            context.stroke();
        } else {
            var radius = 1.2 + (index % 3) * 0.45;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
    });
    context.restore();
    lastWeatherEffectFrame = frameTime;
}

function animateWeatherEffects() {
    weatherEffectFrame = null;
    if (!weatherEffectType || document.hidden ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        drawWeatherEffectCanvas(currentMapMode);
        return;
    }
    var now = performance.now();
    if (now - lastWeatherRenderTime >= 33) {
        drawWeatherEffectCanvas(currentMapMode);
        lastWeatherRenderTime = now;
    }
    weatherEffectFrame = window.requestAnimationFrame(animateWeatherEffects);
}

function clearBoundaryWeatherReadings() {
    [weatherTemperatureValue, weatherFeelsLikeValue, weatherCloudValue,
        weatherHumidityValue, weatherPrecipitationValue, weatherWindValue]
        .forEach(function (element) { element.textContent = '—'; });
}

function syncWeatherEffects() {
    if (weatherEffectFrame != null) {
        window.cancelAnimationFrame(weatherEffectFrame);
        weatherEffectFrame = null;
    }
    lastWeatherEffectFrame = null;
    lastWeatherRenderTime = 0;
    if (weatherEffectType && weatherEffectFeatures.length && !document.hidden &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        weatherEffectFrame = window.requestAnimationFrame(animateWeatherEffects);
    } else {
        drawWeatherEffectCanvas('2d');
        drawWeatherEffectCanvas('3d');
    }
}

async function updateBoundaryWeather() {
    var requestToken = ++weatherRequestToken;
    if (weatherAbortController) {
        weatherAbortController.abort();
        weatherAbortController = null;
    }
    var layers = getWeatherBoundaryLayers();
    weatherEffectType = '';
    weatherEffectFeatures = [];
    syncWeatherEffects();

    if (!layers.length) {
        boundaryWeatherScope.textContent = 'لقێک یان ناوچەیەک هەڵبژێرە.';
        boundaryWeatherSummary.textContent = 'زانیاری کەش و هەوا بەردەست نییە.';
        boundaryWeatherIcon.textContent = '🌍';
        clearBoundaryWeatherReadings();
        boundaryWeatherUpdated.textContent = '—';
        refreshBoundaryWeatherButton.disabled = true;
        return;
    }

    var features = layers.map(function (layer) { return layer.toGeoJSON(); });
    clearBoundaryWeatherReadings();
    var center;
    try {
        center = turf.center(turf.featureCollection(features)).geometry.coordinates;
    } catch (error) {
        console.error('نەتوانرا ناوەندی سنووری کەش و هەوا دیاری بکرێت:', error);
        boundaryWeatherIcon.textContent = '⚠️';
        boundaryWeatherSummary.textContent = 'نەتوانرا ناوەندی سنوور دیاری بکرێت.';
        boundaryWeatherUpdated.textContent = 'تکایە سنوورەکە بپشکنە.';
        refreshBoundaryWeatherButton.disabled = false;
        return;
    }
    var selectedName = selectedRegionLayer && selectedRegionLayer.kind !== 'named-point' ?
        selectedRegionLayer.regionName : '';
    var branch = availableBranches.find(function (item) {
        return item.id === selectedBranchId;
    });
    boundaryWeatherScope.textContent = selectedName || (branch ?
        'سنوری لق: ' + branch.name : 'کەش و هەوای سنووری هەڵبژێردراو');
    boundaryWeatherSummary.textContent = 'خەریکی بارکردنی کەش و هەوا...';
    boundaryWeatherIcon.textContent = '🌍';
    boundaryWeatherUpdated.textContent = 'خەریکی نوێکردنەوە...';
    refreshBoundaryWeatherButton.disabled = true;

    var controller = new AbortController();
    weatherAbortController = controller;
    var timedOut = false;
    var timeout = window.setTimeout(function () {
        timedOut = true;
        controller.abort();
    }, 15000);
    var params = new URLSearchParams({
        latitude: String(center[1]),
        longitude: String(center[0]),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m',
        timezone: 'auto'
    });
    try {
        var response = await fetch('https://api.open-meteo.com/v1/forecast?' + params, {
            signal: controller.signal,
            headers: { Accept: 'application/json' }
        });
        if (!response.ok) {
            throw new Error('سێرڤەری کەش و هەوا وەڵامی ' + response.status + 'ی دایە.');
        }
        var data = await response.json();
        if (requestToken !== weatherRequestToken) return;
        if (!data.current || !Number.isFinite(data.current.temperature_2m)) {
            throw new Error('وەڵامی کەش و هەوا زانیاریی پێویستی تێدا نییە.');
        }

        var current = data.current;
        var presentation = getWeatherPresentation(current.weather_code);
        var number = function (value, fractionDigits) {
            return Number.isFinite(value) ?
                new Intl.NumberFormat('en-US', { maximumFractionDigits: fractionDigits }).format(value) :
                '—';
        };
        boundaryWeatherIcon.textContent = presentation.icon;
        boundaryWeatherSummary.textContent = presentation.text;
        weatherTemperatureValue.textContent = number(current.temperature_2m, 1) + ' °C';
        weatherFeelsLikeValue.textContent = number(current.apparent_temperature, 1) + ' °C';
        weatherCloudValue.textContent = number(current.cloud_cover, 0) + ' %';
        weatherHumidityValue.textContent = number(current.relative_humidity_2m, 0) + ' %';
        weatherPrecipitationValue.textContent = current.snowfall > 0 ?
            number(current.snowfall, 1) + ' cm' :
            number(current.precipitation, 1) + ' mm';
        weatherWindValue.textContent = number(current.wind_speed_10m, 1) + ' km/h';
        boundaryWeatherUpdated.textContent = current.time && current.time.indexOf('T') !== -1 ?
            current.time.split('T')[1].slice(0, 5) : 'نوێکراوەتەوە';

        isDaytime = current.is_day === 1;
        boundaryWeatherSummary.textContent = presentation.text +
            (isDaytime ? ' · ڕۆژ' : ' · شەو');
        applyDayNightMode();
        weatherEffectType = presentation.effect;
        weatherEffectFeatures = features;
        weatherParticles.forEach(function (particle, index) {
            particle.x = ((index * 0.61803398875) % 1);
            particle.y = ((index * 0.75487766625) % 1);
        });
        syncWeatherEffects();
    } catch (error) {
        if (requestToken !== weatherRequestToken ||
            (error.name === 'AbortError' && !timedOut)) return;
        console.error('نەتوانرا کەش و هەوای سنوور باربکرێت:', error);
        boundaryWeatherSummary.textContent = timedOut ?
            'وەڵامی کەش و هەوا دوا کەوت؛ دووبارە هەوڵ بدە.' :
            'بارکردنی کەش و هەوا سەرکەوتوو نەبوو.';
        boundaryWeatherUpdated.textContent = 'تکایە دووبارە هەوڵ بدە.';
    } finally {
        window.clearTimeout(timeout);
        if (requestToken === weatherRequestToken) {
            weatherAbortController = null;
            refreshBoundaryWeatherButton.disabled = false;
        }
    }
}

function setBoundaryStatsMode(mode) {
    boundaryStatsMode = mode;
    updateBoundaryStats();
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
    var isFocused = Boolean(regionName && selectedLayer);
    document.getElementById('map').classList.toggle('region-focus-active', isFocused);
    map3DContainer.classList.toggle('region-focus-active', isFocused);
    updateMapFocusBlurOverlay();
    update3DFocusBlurOverlay();
    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point') return;
        var isForeground = isFocused && isRegionRelatedToSelection(layer, selectedLayer);
        if (layer._path) {
            layer._path.classList.toggle('region-focus-background', isFocused && !isForeground);
            layer._path.classList.toggle('region-focus-foreground', isForeground);
            layer._path.classList.toggle('region-selected-glow', layer === selectedLayer);
        }
        if (layer.getTooltip()) {
            if (layer === selectedLabelLayer) layer.openTooltip();
            else layer.closeTooltip();
            var tooltipElement = layer.getTooltip().getElement();
            if (tooltipElement) {
                tooltipElement.classList.toggle('region-focus-background', isFocused && !isForeground);
                tooltipElement.classList.toggle('region-focus-foreground', isForeground);
            }
        }
        if (isForeground && typeof layer.bringToFront === 'function') {
            layer.bringToFront();
        }
    });
}

function createMapFocusBlurOverlay(container) {
    var overlay = document.createElement('div');
    overlay.className = 'map-focus-blur-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    container.appendChild(overlay);
    return overlay;
}

function getFocusBlurMask(selectedLayer, projectPoint, width, height) {
    var paths = [];
    drawnItems.eachLayer(function (layer) {
        if (layer.kind === 'named-point' ||
            !isRegionRelatedToSelection(layer, selectedLayer)) return;

        var geometry = layer.toGeoJSON().geometry;
        var polygons = geometry.type === 'Polygon' ? [geometry.coordinates] :
            geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
        var path = [];
        polygons.forEach(function (rings) {
            rings.forEach(function (ring) {
                ring.forEach(function (coordinate, index) {
                    var point = projectPoint(coordinate);
                    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
                    path.push((index ? 'L' : 'M') + point.x + ' ' + point.y);
                });
                path.push('Z');
            });
        });
        if (path.length) paths.push('<path d="' + path.join(' ') +
            '" fill="black" fill-rule="evenodd"/>');
    });

    if (!paths.length) return '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width +
        '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height +
        '"><mask id="focus-mask"><rect width="100%" height="100%" fill="white"/>' +
        paths.join('') + '</mask><rect width="100%" height="100%" fill="white" ' +
        'mask="url(#focus-mask)"/></svg>';
}

function setFocusBlurMask(overlay, svg) {
    if (!svg) {
        overlay.hidden = true;
        overlay.style.removeProperty('mask-image');
        overlay.style.removeProperty('-webkit-mask-image');
        return;
    }

    var maskImage = 'url("data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(svg) + '")';
    overlay.style.maskImage = maskImage;
    overlay.style.webkitMaskImage = maskImage;
    overlay.style.maskSize = '100% 100%';
    overlay.style.webkitMaskSize = '100% 100%';
    overlay.style.maskRepeat = 'no-repeat';
    overlay.style.webkitMaskRepeat = 'no-repeat';
    overlay.hidden = false;
}

function updateMapFocusBlurOverlay() {
    if (!mapFocusBlurOverlay) return;
    var selectedLayer = getSelectedRegionLayer(regionFilter.value);
    if (!selectedLayer) {
        setFocusBlurMask(mapFocusBlurOverlay, '');
        return;
    }

    var size = map.getSize();
    var svg = getFocusBlurMask(selectedLayer, function (coordinate) {
        return map.latLngToContainerPoint([coordinate[1], coordinate[0]]);
    }, size.x, size.y);
    setFocusBlurMask(mapFocusBlurOverlay, svg);
}

function update3DFocusBlurOverlay() {
    if (!map3DFocusBlurOverlay || !map3D) return;
    var selectedLayer = getSelectedRegionLayer(regionFilter.value);
    if (!selectedLayer) {
        setFocusBlurMask(map3DFocusBlurOverlay, '');
        return;
    }

    var size = map3D.getContainer();
    var svg = getFocusBlurMask(selectedLayer, function (coordinate) {
        return map3D.project(coordinate);
    }, size.clientWidth, size.clientHeight);
    setFocusBlurMask(map3DFocusBlurOverlay, svg);
}

function focusRegionView(layer) {
    if (!layer) return;

    if (currentMapMode === '3d' && map3D) {
        var bounds = layer.getBounds();
        var leftPadding = Math.min(
            280,
            Math.max(48, map3D.getContainer().clientWidth * 0.46)
        );
        var camera = map3D.cameraForBounds([
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()]
        ], {
            padding: { top: 48, right: 48, bottom: 48, left: leftPadding },
            maxZoom: 14,
            pitch: 45,
        });
        if (!camera) return;
        map3D.easeTo(Object.assign({}, camera, {
            zoom: Math.max(map3D.getZoom(), camera.zoom),
            duration: 1000
        }));
        return;
    }

    var bounds = layer.getBounds();
    var padding = L.point(164, 48);
    var zoom = Math.max(map.getZoom(), Math.min(
        map.getBoundsZoom(bounds, false, padding),
        14
    ));
    var paddingOffset = L.point(48, 48).subtract(L.point(280, 48)).divideBy(2);
    var center = map.unproject(
        map.project(bounds.getCenter(), zoom).add(paddingOffset),
        zoom
    );
    map.flyTo(center, zoom, {
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
        if (!option.value) return;
        var stillExists = drawnItems.getLayers().some(function (layer) {
            return layer.kind !== 'named-point' && getRegionFilterName(layer) === option.value;
        });
        if (!stillExists) option.remove();
    });

    pendingDeleteRegionLayer = null;
    deleteRegionDialog.hidden = true;
    buildingCountCache.clear();
    showSelectedRegion(regionFilter.value);
    updateBoundaryStats();
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
        permanent: false,
        direction: 'center',
        className: 'region-label',
        opacity: 1,
        interactive: false
    });
}

function setSelectedLabelLayer(layer) {
    function setNamedPointLabelVisibility(pointLayer, isVisible) {
        if (!pointLayer || pointLayer.kind !== 'named-point') return;
        var markerElement = pointLayer.getElement();
        if (!markerElement) return;
        var content = markerElement.querySelector('.named-point-content') ||
            markerElement.querySelector('.map3d-named-point');
        if (content) content.classList.toggle('is-label-selected', isVisible);
    }

    if (selectedLabelLayer && selectedLabelLayer !== layer &&
        selectedLabelLayer.kind === 'named-point') {
        setNamedPointLabelVisibility(selectedLabelLayer, false);
    }
    selectedLabelLayer = layer;
    editNamedLabelButton.disabled = !isMapAdmin || !layer;
    var isNamedPoint = Boolean(layer && layer.kind === 'named-point');
    if (isNamedPoint) setNamedPointLabelVisibility(layer, true);
    namedPointColorInput.disabled = !isMapAdmin || !isNamedPoint;
    applyNamedPointColorButton.disabled = !isMapAdmin || !isNamedPoint;
    if (isNamedPoint) {
        namedPointColorInput.value = normalizeNamedPointColor(layer.pointColor);
    }
    sync3DRegionLabels();
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
    if (layer) {
        cancelGlobeReturnTransition();
        isGlobeOverview = false;
        pendingGlobeReturn = false;
        stopGlobeRotation();
        setSelectedLabelLayer(layer);
    } else {
        setSelectedLabelLayer(null);
    }
    applyRegionStyleButton.disabled = !isMapAdmin || !layer;
    updateSubRegionButton();
    refreshRegionInfoButton.disabled = !layer;
    if (!layer) {
        setSelectedLabelLayer(null);
        if (regionInfoAbortController) regionInfoAbortController.abort();
        regionInfoRequestLayer = null;
        regionInfoResults.textContent = 'ناوچەیەک هەڵبژێرە بۆ گەڕانی زانیاری.';
        update3DRegionFilter();
        updateBoundaryStats();
        updateBoundaryWeather();
        return;
    }

    var style = layer.regionStyle || {};
    borderColorInput.value = style.color || '#0056b3';
    fillColorInput.value = style.fillColor || '#3388ff';
    fillOpacityInput.value = style.fillOpacity == null ? 0.3 : style.fillOpacity;
    opacityValue.textContent = fillOpacityInput.value;
    refreshDrawStyle();
    update3DRegionFilter();
    updateBoundaryStats();
    updateBoundaryWeather();
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
        fitMapToIraq(1000);
    } else {
        fitMapToIraq(1000);
    }
});

function loadFeatureCollection(savedRegions) {
    drawnItems.clearLayers();
    selectedRegionLayer = null;
    setSelectedLabelLayer(null);
    resetRegionFilterOptions();
    branchRegionNames = [];
    if (savedRegions && Array.isArray(savedRegions.regionNames)) {
        savedRegions.regionNames.forEach(function (name) {
            addBranchRegionName(name);
        });
    }
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
                layer.populationCount = Number.isSafeInteger(properties.populationCount) &&
                    properties.populationCount >= 0 ? properties.populationCount : null;
                if (!properties.regionId) regionNameChanged = true;
                layer.regionName = normalizeRegionName(properties.name);
                layer.filterName = normalizeRegionName(properties.filterName || properties.name);
                if (layer.regionName !== (properties.name || '')) regionNameChanged = true;
                layer.regionStyle = regionStyle;
                if (addBranchRegionName(layer.regionName)) regionNameChanged = true;
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
    buildingCountCache.clear();
    updateBoundaryStats();
    updateBoundaryWeather();
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
    newRegionNameInput.disabled = !isMapAdmin;
    addRegionNameButton.disabled = !isMapAdmin;
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
    updateBoundaryStats();
}

function writeCloudFeatureCollection(collection) {
    var branchId = selectedBranchId;
    if (!supabaseClient || !isMapAdmin || !currentAuthUser || !branchId) {
        storageStatus.textContent = 'هەژماری دەستکاریکەر و لقێکی هەڵبژێردراو پێویستە بۆ خەزنکردن.';
        return Promise.resolve(false);
    }

    cloudSaveQueue = cloudSaveQueue.catch(function () {}).then(async function () {
        var updatedAt = new Date().toISOString();
        localCloudUpdateTimes.add(Date.parse(updatedAt));
        try {
            var result = await supabaseClient.from('map_branch_state').upsert({
                branch_id: branchId,
                data: collection,
                updated_at: updatedAt,
                updated_by: currentAuthUser.id
            }, {
                onConflict: 'branch_id'
            });
            if (result.error) throw result.error;
            storageStatus.textContent = 'سنوورەکانی ئەم لقە بۆ cloud خەزن کران';
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

async function loadCloudMap(branchId, loadToken) {
    branchId = branchId || selectedBranchId;
    if (!supabaseClient || !currentAuthUser || !branchId) return false;

    var result = await supabaseClient.from('map_branch_state')
        .select('data, updated_at')
        .eq('branch_id', branchId)
        .maybeSingle();

    if (result.error) {
        console.error('نەتوانرا داتای نەخشەی لق بخوێندرێتەوە:', result.error);
        accessStatus.textContent = 'خوێندنەوەی داتای هاوبەش سەرکەوتوو نەبوو.';
        mapAccessMessage.textContent = 'داتای ئەم لقە بار نەبوو؛ پەیوەندی و RLS بپشکنە.';
        return false;
    }
    if (loadToken !== undefined &&
        (loadToken !== branchLoadToken || branchId !== selectedBranchId)) return false;

    var cloudCollection = result.data && result.data.data || {
        type: 'FeatureCollection',
        features: []
    };
    var namesChanged = loadFeatureCollection(cloudCollection);
    var hasCloudFeatures = cloudCollection.features && cloudCollection.features.length > 0;
    var hasCloudData = hasCloudFeatures ||
        (Array.isArray(cloudCollection.regionNames) && cloudCollection.regionNames.length > 0);
    legacyLocalFeatureCollection = null;
    if (isGlobalMapAdmin && branchId === 'branch-04' && !hasCloudData) {
        legacyLocalFeatureCollection = await readLegacyLocalFeatureCollection();
    }
    if (loadToken !== undefined &&
        (loadToken !== branchLoadToken || branchId !== selectedBranchId)) return false;
    var hasLegacyFeatures = legacyLocalFeatureCollection &&
        legacyLocalFeatureCollection.features && legacyLocalFeatureCollection.features.length > 0;

    migrateLocalDataButton.hidden = !(
        isGlobalMapAdmin && branchId === 'branch-04' && !hasCloudData && hasLegacyFeatures
    );
    setMapEditorPermissions(isGlobalMapAdmin);
    mapAccessGate.hidden = true;
    map.invalidateSize();
    if (map3D) map3D.resize();

    if (isMapAdmin) {
        accessStatus.textContent = isGlobalMapAdmin ?
            'ئەدمینی سەرەکی: دەستکاریکردنی هەموو لقەکان چالاکە' :
            'ئەدمینی لق: دەستکاریکردنی ئەم لقە چالاکە';
        storageStatus.textContent = hasCloudFeatures ?
            'داتای cloud ی ئەم لقە بارکرا' : 'نەخشەی ئەم لقە ئامادەیە';
        if (namesChanged && hasCloudData) await saveRegions();
    } else {
        accessStatus.textContent = 'بینەر: تەنها بینین';
        storageStatus.textContent = 'داتای cloud ی ئەم لقە بارکرا';
    }
    return true;
}

async function loadBranchOptions(assignedBranchIds) {
    var result = await supabaseClient.from('map_branches')
        .select('id, name, sort_order')
        .order('sort_order');
    if (result.error) throw result.error;

    availableBranches = result.data || [];
    updateBranchSelectors();

    assignedBranchIds = assignedBranchIds || [];
    var targetBranchId = isGlobalMapAdmin ?
        (availableBranches.some(function (branch) { return branch.id === selectedBranchId; }) ?
            selectedBranchId :
            (availableBranches.some(function (branch) { return branch.id === 'branch-04'; }) ?
                'branch-04' : availableBranches[0] && availableBranches[0].id)) :
        (assignedBranchIds.indexOf(selectedBranchId) !== -1 ?
            selectedBranchId : assignedBranchIds[0]);
    if (!targetBranchId || !availableBranches.some(function (branch) {
        return branch.id === targetBranchId;
    })) {
        branchFilter.disabled = true;
        openBranchManagementButton.hidden = true;
        branchViewNotice.hidden = true;
        mapAccessGate.hidden = false;
        mapAccessMessage.textContent =
            'ئەم هەژمارە بە هیچ لقێکەوە نەبەستراوە؛ داوا لە ئەدمینی سەرەکی بکە هەژمارەکەت بە لقێکەوە ببەستێتەوە.';
        accessStatus.textContent = 'هەژماری لق پێویستی بە پەیوەستکردن هەیە';
        return false;
    }

    branchFilter.value = targetBranchId;
    branchManagementSelect.value = targetBranchId;
    branchFilter.disabled = !isGlobalMapAdmin && availableBranches.length < 2;
    openBranchManagementButton.hidden = !isGlobalMapAdmin;
    branchViewNotice.hidden = isGlobalMapAdmin || !assignedBranchIds.length;
    updateBranchAdminControls();
    updateBranchAccountAccessChoices([targetBranchId]);
    await switchMapBranch(targetBranchId);
    return true;
}

function updateBranchSelectors() {
    branchFilter.replaceChildren();
    branchManagementSelect.replaceChildren();
    branchAccountAccessChoices.replaceChildren();
    availableBranches.forEach(function (branch) {
        [branchFilter, branchManagementSelect].forEach(function (select) {
            var option = document.createElement('option');
            option.value = branch.id;
            option.textContent = branch.name;
            select.add(option);
        });

        var label = document.createElement('label');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'branchAccountAccess';
        checkbox.value = branch.id;
        var name = document.createElement('span');
        name.textContent = branch.name;
        label.append(checkbox, name);
        branchAccountAccessChoices.append(label);
    });
}

function updateBranchAccountAccessChoices(selectedBranchIds) {
    var selectedIds = new Set(selectedBranchIds || []);
    branchAccountAccessChoices.querySelectorAll('input[name="branchAccountAccess"]')
        .forEach(function (checkbox) {
            checkbox.checked = selectedIds.has(checkbox.value);
        });
}

function getSelectedBranchAccountAccessIds() {
    return Array.from(branchAccountAccessChoices.querySelectorAll(
        'input[name="branchAccountAccess"]:checked'
    )).map(function (checkbox) {
        return checkbox.value;
    });
}

function updateBranchAdminControls() {
    var branch = availableBranches.find(function (item) {
        return item.id === branchManagementSelect.value;
    });
    branchNameInput.value = branch ? branch.name : '';
    branchNameInput.disabled = !isGlobalMapAdmin || !branch;
    saveBranchNameButton.disabled = !isGlobalMapAdmin || !branch;
    deleteBranchButton.disabled = !isGlobalMapAdmin || !branch || availableBranches.length <= 1;
    branchAccountEmailInput.disabled = !isGlobalMapAdmin || !branch;
    branchAccountPasswordInput.disabled = !isGlobalMapAdmin || !branch;
    saveBranchAccountButton.disabled = !isGlobalMapAdmin || !branch;
    branchManagementSelect.disabled = !isGlobalMapAdmin || availableBranches.length === 0;
    createBranchButton.disabled = !isGlobalMapAdmin;
    newBranchNameInput.disabled = !isGlobalMapAdmin;
}

async function switchMapBranch(branchId) {
    if (!availableBranches.some(function (branch) { return branch.id === branchId; })) return;

    stopGlobeRotation();
    pendingBranchFocus = false;
    pendingBranchFocusDuration = null;
    buildingCountCache.clear();
    selectedBranchId = branchId;
    branchFilter.value = branchId;
    unsubscribeFromCloudMap();
    var loadToken = ++branchLoadToken;
    loadFeatureCollection({ type: 'FeatureCollection', features: [] });
    migrateLocalDataButton.hidden = true;
    var loaded = await loadCloudMap(branchId, loadToken);
    if (loaded && loadToken === branchLoadToken) {
        focusMapToBranch(6500);
        subscribeToCloudMap(branchId);
    }
}

function subscribeToCloudMap(branchId) {
    if (!supabaseClient || !currentAuthUser || cloudRealtimeChannel || !branchId) return;

    cloudRealtimeChannel = supabaseClient.channel('map-branch-' + branchId)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'map_branch_state',
            filter: 'branch_id=eq.' + branchId
        }, function (payload) {
            var record = payload.new;
            if (!record || record.branch_id !== selectedBranchId) return;

            var updatedAt = Date.parse(record.updated_at);
            if (record.updated_by === currentAuthUser.id &&
                localCloudUpdateTimes.has(updatedAt)) return;

            loadFeatureCollection(record.data || {
                type: 'FeatureCollection',
                features: []
            });
            setMapEditorPermissions(isGlobalMapAdmin);
            storageStatus.textContent = 'داتای نوێی cloud لایڤ نوێ کرایەوە';
        })
        .subscribe(function (status, error) {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('پەیوەندی نوێکردنەوەی لایڤی لق سەرکەوتوو نەبوو:', error);
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
    isGlobalMapAdmin = false;
    var assignedBranchIds = [];

    if (currentAuthUser) {
        var roleResult = await supabaseClient.rpc('is_map_admin');
        if (roleResult.error) {
            throw roleResult.error;
        }
        isGlobalMapAdmin = roleResult.data === true;
        if (!isGlobalMapAdmin) {
            var branchResult = await supabaseClient.from('map_branch_users')
                .select('branch_id')
                .eq('user_id', currentAuthUser.id);
            if (branchResult.error) throw branchResult.error;
            assignedBranchIds = (branchResult.data || []).map(function (assignment) {
                return assignment.branch_id;
            });
        }
    }

    setMapEditorPermissions(isGlobalMapAdmin);
    branchViewNotice.hidden = isGlobalMapAdmin || !assignedBranchIds.length;
    adminLogoutButton.hidden = !currentAuthUser;

    if (!currentAuthUser) {
        if (branchManagementDialog.open) branchManagementDialog.close();
        unsubscribeFromCloudMap();
        branchLoadToken += 1;
        selectedBranchId = null;
        availableBranches = [];
        branchFilter.replaceChildren();
        var placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'چوونەژوورەوە بکە';
        branchFilter.add(placeholder);
        branchFilter.disabled = true;
        branchManagementSelect.replaceChildren();
        openBranchManagementButton.hidden = true;
        branchViewNotice.hidden = true;
        branchAdminStatus.textContent = '';
        migrateLocalDataButton.hidden = true;
        legacyLocalFeatureCollection = null;
        loadFeatureCollection({ type: 'FeatureCollection', features: [] });
        mapAccessGate.hidden = false;
        accessStatus.textContent = 'چوونەژوورەوە پێویستە';
        mapAccessMessage.textContent = 'بۆ بینینی نەخشە، بە هەژماری خۆت بچۆرە ژوورەوە.';
        returnToGlobe();
        if (supabaseClient) adminEmailInput.focus();
        return;
    }

    if (!isGlobalMapAdmin && !assignedBranchIds.length) {
        await loadBranchOptions(null);
        setMapEditorPermissions(false);
        return;
    }

    await loadBranchOptions(assignedBranchIds);
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
            applyAuthenticatedSession(session).catch(function (error) {
                console.error('Authenticated session could not be applied:', error);
                accessStatus.textContent = 'نەتوانرا ڕۆڵ و لقەکەی هەژمارەکەت بخوێندرێتەوە.';
                mapAccessMessage.textContent =
                    'پشکنینی مۆڵەت سەرکەوتوو نەبوو؛ ڕێکخستنی Supabase و SQL بپشکنە.';
            });
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

async function manageBranch(action, payload, branchId) {
    if (!isGlobalMapAdmin || !supabaseClient) {
        throw new Error('تەنها ئەدمینی سەرەکی دەتوانێت لق بەڕێوەببات.');
    }

    var result = await supabaseClient.functions.invoke('manage-branch', {
        body: Object.assign({
            action: action,
            branchId: branchId || selectedBranchId
        }, payload || {})
    });
    if (result.error) {
        var errorMessage = result.error.message;
        if (result.error.context && typeof result.error.context.json === 'function') {
            try {
                var responseBody = await result.error.context.json();
                if (responseBody && responseBody.error) errorMessage = responseBody.error;
            } catch (parseError) {
                console.error('Branch-management error response could not be decoded:', parseError);
            }
        }
        throw new Error(errorMessage);
    }
    if (result.data && result.data.error) throw new Error(result.data.error);
    return result.data;
}

openBranchManagementButton.addEventListener('click', function () {
    if (isGlobalMapAdmin && !branchManagementDialog.open) {
        branchManagementDialog.showModal();
    }
});

closeBranchManagementButton.addEventListener('click', function () {
    branchManagementDialog.close();
});

branchManagementSelect.addEventListener('change', function () {
    branchAccountEmailInput.value = '';
    branchAccountPasswordInput.value = '';
    branchAdminStatus.textContent = '';
    updateBranchAdminControls();
});

branchFilter.addEventListener('change', function () {
    if (!branchFilter.value ||
        !availableBranches.some(function (branch) { return branch.id === branchFilter.value; })) return;
    switchMapBranch(branchFilter.value).catch(function (error) {
        console.error('نەتوانرا نەخشەی لق بگۆڕدرێت:', error);
        storageStatus.textContent = 'نەتوانرا داتای لق باربکرێت؛ پەیوەندی و مۆڵەتەکان بپشکنە.';
    });
});

createBranchButton.addEventListener('click', async function () {
    var name = newBranchNameInput.value.trim();
    if (!name) {
        branchAdminStatus.textContent = 'ناوی لق بنووسە.';
        newBranchNameInput.focus();
        return;
    }

    createBranchButton.disabled = true;
    branchAdminStatus.textContent = 'لقی نوێ دروست دەکرێت...';
    try {
        var result = await manageBranch('create-branch', { name: name });
        availableBranches.push(result.branch);
        availableBranches.sort(function (a, b) {
            return a.sort_order - b.sort_order;
        });
        updateBranchSelectors();
        branchFilter.value = result.branch.id;
        branchManagementSelect.value = result.branch.id;
        updateBranchAccountAccessChoices([result.branch.id]);
        newBranchNameInput.value = '';
        updateBranchAdminControls();
        await switchMapBranch(result.branch.id);
        branchAdminStatus.textContent =
            'لقی «' + result.branch.name + '» دروست کرا؛ ئێستا دەتوانیت سنوورەکانی لە ماپ بکێشیت.';
    } catch (error) {
        console.error('نەتوانرا لقی نوێ دروست بکرێت:', error);
        branchAdminStatus.textContent = 'دروستکردنی لق سەرکەوتوو نەبوو: ' +
            String(error && error.message || error);
    } finally {
        createBranchButton.disabled = !isGlobalMapAdmin;
    }
});

saveBranchNameButton.addEventListener('click', async function () {
    saveBranchNameButton.disabled = true;
    branchAdminStatus.textContent = 'ناوی لق خەزن دەکرێت...';
    try {
        var branchId = branchManagementSelect.value;
        var result = await manageBranch('rename-branch', {
            name: branchNameInput.value
        }, branchId);
        var branch = availableBranches.find(function (item) {
            return item.id === result.branch.id;
        });
        if (branch) branch.name = result.branch.name;
        [branchFilter, branchManagementSelect].forEach(function (select) {
            var option = Array.from(select.options).find(function (item) {
                return item.value === branchId;
            });
            if (option) option.textContent = result.branch.name;
        });
        updateBranchAdminControls();
        branchAdminStatus.textContent = 'ناوی لق «' + result.branch.name + '» خەزن کرا.';
    } catch (error) {
        console.error('نەتوانرا ناوی لق خەزن بکرێت:', error);
        branchAdminStatus.textContent = 'گۆڕینی ناوی لق سەرکەوتوو نەبوو: ' +
            String(error && error.message || error);
    } finally {
        saveBranchNameButton.disabled = !isGlobalMapAdmin || !branchManagementSelect.value;
    }
});

deleteBranchButton.addEventListener('click', async function () {
    var branchId = branchManagementSelect.value;
    var branch = availableBranches.find(function (item) {
        return item.id === branchId;
    });
    if (!branch || availableBranches.length <= 1) return;
    branchDeleteMessage.textContent =
        'لقی «' + branch.name +
        '» و هەموو ناوچە و سنوورەکانی دەسڕدرێنەوە. ئەم کردارە ناگەڕێتەوە.';
    deleteBranchNameConfirm.value = '';
    confirmDeleteBranchButton.disabled = true;
    branchDeleteConfirmation.hidden = false;
    branchManagementSelect.disabled = true;
    deleteBranchNameConfirm.focus();
});

deleteBranchNameConfirm.addEventListener('input', function () {
    var branch = availableBranches.find(function (item) {
        return item.id === branchManagementSelect.value;
    });
    confirmDeleteBranchButton.disabled = !branch ||
        deleteBranchNameConfirm.value.trim() !== branch.name;
});

cancelDeleteBranchButton.addEventListener('click', function () {
    branchDeleteConfirmation.hidden = true;
    deleteBranchNameConfirm.value = '';
    updateBranchAdminControls();
});

confirmDeleteBranchButton.addEventListener('click', async function () {
    var branchId = branchManagementSelect.value;
    var branch = availableBranches.find(function (item) {
        return item.id === branchId;
    });
    if (!branch || availableBranches.length <= 1 ||
        deleteBranchNameConfirm.value.trim() !== branch.name) return;

    deleteBranchButton.disabled = true;
    confirmDeleteBranchButton.disabled = true;
    branchAdminStatus.textContent = 'لق و داتاکانی دەسڕدرێنەوە...';
    try {
        await manageBranch('delete-branch', {}, branchId);
        var wasActiveBranch = selectedBranchId === branchId;
        availableBranches = availableBranches.filter(function (item) {
            return item.id !== branchId;
        });
        updateBranchSelectors();

        var nextBranch = availableBranches.find(function (item) {
            return item.id === selectedBranchId;
        }) || availableBranches.find(function (item) {
            return item.id === 'branch-04';
        }) || availableBranches[0];
        if (!nextBranch) throw new Error('هیچ لقێکی تر بۆ پیشاندان نەماوەتەوە.');

        branchFilter.value = nextBranch.id;
        branchManagementSelect.value = nextBranch.id;
        updateBranchAccountAccessChoices([nextBranch.id]);
        branchDeleteConfirmation.hidden = true;
        deleteBranchNameConfirm.value = '';
        updateBranchAdminControls();
        if (wasActiveBranch) await switchMapBranch(nextBranch.id);
        branchAdminStatus.textContent =
            'لقی «' + branch.name + '» و هەموو داتاکانی سڕدرانەوە. هەژمارە بینەرەکانیش مۆڵەتی ئەم لقەیان لێ وەرگیرا.';
    } catch (error) {
        console.error('نەتوانرا لق و داتاکانی بسڕدرێنەوە:', error);
        branchAdminStatus.textContent = 'سڕینەوەی لق سەرکەوتوو نەبوو: ' +
            String(error && error.message || error);
    } finally {
        deleteBranchButton.disabled = !isGlobalMapAdmin ||
            !branchManagementSelect.value || availableBranches.length <= 1;
        if (!branchDeleteConfirmation.hidden) {
            branchManagementSelect.disabled = true;
            confirmDeleteBranchButton.disabled =
                deleteBranchNameConfirm.value.trim() !== branch.name;
        }
    }
});

saveBranchAccountButton.addEventListener('click', async function () {
    var email = branchAccountEmailInput.value.trim();
    var password = branchAccountPasswordInput.value;
    var branchIds = getSelectedBranchAccountAccessIds();
    if (!email || password.length < 10) {
        branchAdminStatus.textContent = 'ئیمەیڵ بنووسە و وشەی نهێنییەکی لانیکەم ١٠ پیتی دابنێ.';
        return;
    }
    if (!branchIds.length) {
        branchAdminStatus.textContent = 'لانیکەم یەک لق هەڵبژێرە بۆ مۆڵەتی بینین.';
        return;
    }

    saveBranchAccountButton.disabled = true;
    var branchNames = branchIds.map(function (branchId) {
        var branch = availableBranches.find(function (item) {
            return item.id === branchId;
        });
        return branch ? branch.name : '';
    }).filter(Boolean);
    branchAdminStatus.textContent = 'هەژماری بینەر بۆ ئەم لقانە بە شێوەی پارێزراو دروست/نوێ دەکرێتەوە: ' +
        branchNames.join('، ');
    try {
        await manageBranch('set-branch-account', {
            email: email,
            password: password,
            branchIds: branchIds
        });
        branchAccountPasswordInput.value = '';
        branchAdminStatus.textContent =
            'هەژماری بینینی ' + branchNames.join('، ') +
            ' ئامادەیە. ئیمەیڵ و وشەی نهێنی بە ڕێگایەکی تایبەتی بگەیەنە بەکارهێنەر.';
    } catch (error) {
        console.error('نەتوانرا هەژماری لق دروست بکرێت:', error);
        branchAdminStatus.textContent = 'دروستکردنی هەژمار سەرکەوتوو نەبوو: ' +
            String(error && error.message || error);
    } finally {
        saveBranchAccountButton.disabled = !isGlobalMapAdmin ||
            !branchManagementSelect.value;
    }
});

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

addRegionNameButton.addEventListener('click', function () {
    if (!isMapAdmin) return;
    var name = normalizeRegionName(newRegionNameInput.value);
    if (!name) {
        newRegionNameInput.focus();
        return;
    }

    var added = addBranchRegionName(name);
    regionFilter.value = name;
    newRegionNameInput.value = '';
    showSelectedRegion(name);
    if (added) {
        saveRegions();
        locationResult.textContent = 'ناوی ناوچە زیاد کرا؛ ئێستا لە نەخشەکە سنوورەکەی بە polygon بکێشە.';
    } else {
        locationResult.textContent = 'ئەم ناوە پێشتر لە کۆمبۆی ئەم لقەدا هەیە.';
    }
});

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

regionStatsModeButton.addEventListener('click', function () {
    setBoundaryStatsMode('region');
});

branchStatsModeButton.addEventListener('click', function () {
    setBoundaryStatsMode('branch');
});

populationEditor.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!isMapAdmin || !selectedRegionLayer ||
        selectedRegionLayer.kind === 'named-point') return;

    var rawValue = populationCountInput.value.trim();
    var population = rawValue === '' ? null : Number(rawValue);
    if (population !== null &&
        (!Number.isSafeInteger(population) || population < 0)) {
        boundaryStatsNote.textContent =
            'ژمارەی دانیشتوان دەبێت ژمارەیەکی تەواو و سفر یان زیاتر بێت.';
        populationCountInput.focus();
        return;
    }

    selectedRegionLayer.populationCount = population;
    updateBoundaryStats();
    savePopulationButton.disabled = true;
    var saved = await saveRegions();
    savePopulationButton.disabled = !isMapAdmin;
    if (saved) {
        boundaryStatsNote.textContent = population === null ?
            'زانیاریی دانیشتوان لەم ناوچەیە سڕایەوە و گۆڕانکارییەکان خەزن کران.' :
            'ژمارەی دانیشتوان لەگەڵ سنووری ناوچەکە خەزن کرا.';
    } else {
        boundaryStatsNote.textContent =
            'ژمارەکە لە ماپەکە دانرا، بەڵام لە cloud خەزن نەکرا؛ پەیوەندی و مۆڵەتەکان بپشکنە.';
    }
});

refreshBuildingStatsButton.addEventListener('click', function () {
    buildingCountCache.clear();
    updateBoundaryStats();
});

refreshBoundaryWeatherButton.addEventListener('click', updateBoundaryWeather);
window.setInterval(updateBoundaryWeather, 15 * 60 * 1000);
document.addEventListener('visibilitychange', function () {
    syncWeatherEffects();
});
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function () {
    syncWeatherEffects();
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

function commitRegionBoundary(regionLayer, name, parentRegionId) {
    regionLayer.regionId = regionLayer.regionId || createRegionId();
    regionLayer.parentRegionId = parentRegionId || null;
    regionLayer.regionName = normalizeRegionName(name);
    regionLayer.filterName = regionLayer.regionName;
    addBranchRegionName(regionLayer.regionName);
    enableRegionSelection(regionLayer);
    addRegionLabel(regionLayer);

    var title = document.createElement('b');
    title.textContent = regionLayer.regionName;
    regionLayer.bindPopup(title);
    drawnItems.addLayer(regionLayer);
    buildingCountCache.clear();
    pendingRegionLayer = null;
    pendingRegionParentId = null;
    namedPointDialog.hidden = true;
    namedPointNameInput.value = '';
    namedPointTitle.textContent = 'ناوی خاڵ';
    namedPointNameLabel.textContent = 'ناوی شوێن';
    regionFilter.value = regionLayer.regionName;
    selectRegion(regionLayer);
    showSelectedRegion(regionFilter.value);
    saveRegions();
    sync3DRegions();
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

        commitRegionBoundary(pendingRegionLayer, pointName, pendingRegionParentId);
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

    var selectedName = regionFilter.value;
    if (!parentRegion && selectedName && branchRegionNames.includes(selectedName) &&
        !getSelectedRegionLayer(selectedName)) {
        commitRegionBoundary(layer, selectedName, null);
        locationResult.textContent = 'سنووری «' + selectedName + '» خەزن کرا.';
        return;
    }

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
    buildingCountCache.clear();
    updateBoundaryStats();
    saveRegions();
    sync3DRegions();
    updateMapFocusBlurOverlay();
    update3DFocusBlurOverlay();
});
map.on(L.Draw.Event.DELETED, function () {
    buildingCountCache.clear();
    updateBoundaryStats();
    saveRegions();
    sync3DRegions();
    updateMapFocusBlurOverlay();
    update3DFocusBlurOverlay();
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

applyDayNightMode();
setMapMode('3d');
initializeOnlineAccess();