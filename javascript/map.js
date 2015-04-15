var firstPopState = true;

var latlngToPoint = function(map, latlng, z) {
  var normalizedPoint = map.getProjection().fromLatLngToPoint(latlng);
  var scale = Math.pow(2, z);
  var pixelCoordinate = new google.maps.Point(normalizedPoint.x * scale, normalizedPoint.y * scale);
  return pixelCoordinate; 
};

var pointToLatlng = function(map, point, z) {
  var scale = Math.pow(2, z);
  var normalizedPoint = new google.maps.Point(point.x / scale, point.y / scale);
  var latlng = map.getProjection().fromPointToLatLng(normalizedPoint);
  return latlng; 
};

var Map = new function() {
  var _this = this;
  this.map  = null;
  this.geocoder = null;
  this.overlay  = null;
  this.geoMarker  = null;
  this.language   = 'en';
  this.autoload   = true;
  this.searchMode = false;
  
  _this.geolocationControl = null;
  _this.geolocationControlIndex = null;

  _this.lockControl = null;
  _this.lockControlIndex = null;

  _this.findControl = null;
  _this.findControlIndex = null;
  
  this.marker = null;
  this.markerSizes = {
    desktop: 90,
    tablet: 72,
    mobile: 45
  };

  // For CENTER mode
  this.markerOverlay = null;

  // For FIXED mode
  this.markerGraphic = null;
  this.markerLayer = null;
  this.markerRenderer = null;
  this.markerSymbols = {
    desktop: null,
    tablet: null,
    mobile: null
  };
  
  this.mapModes = {
    CENTER: 1,
    FIXED: 2,
    DIRECTIONS: 3
  };
  this.previousMapMode = null;
  this.mapMode = this.mapModes.CENTER;
  
  this.basemap = null;
  this.streetsOverlayLayer = null;

  this.geolocation = null;
  // --
  
  this.initialise = function() {
    require(["esri/map",
         "esri/dijit/LocateButton",
         "esri/dijit/Search",
         "esri/layers/ArcGISTiledMapServiceLayer",
         "esri/layers/GraphicsLayer",
         "esri/graphic",
         "esri/renderers/SimpleRenderer",
         "esri/symbols/PictureMarkerSymbol"], 
         function(EsriMap, LocateButton, Search, ArcGISTiledMapServiceLayer,
                  GraphicsLayer, Graphic, SimpleRenderer, PictureMarkerSymbol) {
      $('.menu-mobile .change-three-word-lang').css({display: 'block'});
    
      var streetViewEnable = (window.innerWidth > 1025) ? true : false;

      _this.basemap = (window.mobilecheck) ? "hybrid" : "streets";

      var mapOptions = {
        center: [_this.position.lng,_this.position.lat],
        zoom: _this.zoom,
        basemap: _this.basemap
      };


      _this.map = new EsriMap('mapDiv', mapOptions);

      Wordbar.setHistoryIcons();

      // google.maps.event.addListener(Map.map, 'rightclick', function(e) {
      //  Menu.set('map').show(e);
      // });

      // Set up a collection of symbols for us to use in FIXED mode
      _this.markerSymbols = {};
      var markerUrl = "http://map.what3words.com/images/map/marker.png";
      for (var sizeClass in _this.markerSizes) {
        var size = _this.markerSizes[sizeClass],
            symbol = new PictureMarkerSymbol(markerUrl,size,size);
        symbol.yoffset = size/2;
        _this.markerSymbols[sizeClass] = symbol;
      }          

      _this.map.on("load", function () {
        if (Map.autoload) {
          Map.getWords();
        } else {
          Wordbar.setWords(Map.searchLoaded);
        }

        _this.streetsOverlayLayer = new ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer");
        _this.map.addLayer(_this.streetsOverlayLayer);

        // Set up the FIXED mode GraphicsLayer (this moves with the map)
        _this.markerLayer = new GraphicsLayer();
        _this.markerLayer.renderer = new SimpleRenderer();
        _this.markerLayer.renderer.symbol = _this.markerSymbols.desktop;
        _this.markerLayer.hide();
        _this.map.addLayer(_this.markerLayer);

        _this.markerGraphic = new Graphic(_this.map.extent.getCenter());
        _this.markerLayer.add(_this.markerGraphic);

        _this.setMode(_this.mapModes.CENTER);

        _this.repositionMarker();

        _this.map.on("extent-change", function (deltaInfo) {
          _this.updateMarker();
        });
      });

      _this.map.on("resize", function (e) {
        _this.setResponsiveMarkerSize();
        _this.repositionMarker();
      });
      
      _this.map.on("click", function (e) {
        if (e.button == 2) {
          Menu.set('map').show(e);
        }
      });

      _this.markerOverlay = $("w3w-marker");
      
      // Add geolocation control to map
      _this.geolocationControl = document.createElement('div');
      _this.geolocationControl.id = "locate-button";

      _this.addGeolocationControl();

      // Add lock control to map
      _this.lockControl = document.createElement('div');
      _this.lockControl.className = "map-control lock";
      _this.lockControl.innerHTML = '<div class="inner">' + transLockPin + '</div>';

      _this.addLockControl();
      
      // Add find pin control
      _this.findControl = document.createElement('div');
      _this.findControl.className = "map-control find-pin";
      _this.findControl.innerHTML = '<div class="inner">' + transFindPin + '</div>';


      var locateButton = new LocateButton({
        map: _this.map
      }, "locate-button");

      locateButton.on('locate', function (e) {
        _this.geolocation = e.graphic.geometry;
      });

      locateButton.startup();

      var searchBar = new Search({
        map: _this.map,
        enableInfoWindow: false,
        enableHighlight: false,
        caption: ""
      }, "arcgis-search");

      searchBar.on('select-result', function (e) {
        _this.markerGraphic.geometry = e.result.feature.geometry;
        _this.markerLayer.remove(_this.markerGraphic);
        _this.markerLayer.add(_this.markerGraphic);

        if (_this.geolocation !== null) {
          _this.setMode(Map.mapModes.FIXED);
          require(["esri/geometry/Extent"], function (Extent) {
            var geolocation = _this.geolocation,
                resultLocation = _this.markerGraphic.geometry;
            var ext1 = new Extent(geolocation.x,geolocation.y,
                                  geolocation.x,geolocation.y,
                                  geolocation.spatialReference),
                ext2 = new Extent(resultLocation.x,resultLocation.y,
                                 resultLocation.x,resultLocation.y,
                                 resultLocation.spatialReference),
                ext3 = ext1.union(ext2);
            _this.map.setExtent(ext3, true);
          });
        }
      });

      // Marker menu
      MarkerMenu.initialise();

      $(document).on('click', '.map-control.lock', function(e) {
        e.preventDefault();
        if (Map.mapMode === Map.mapModes.DIRECTIONS) {
          return;
        }
        
        _this.toggleLock();
        
        if (_this.markerLocked) {
          Map.setMode(Map.mapModes.FIXED);
        } else {
          Map.setMode(Map.mapModes.CENTER);
        }
      });

      $(document).on('click', '.map-control.find-pin', function(e){
        e.preventDefault();
        if (Map.mapMode === Map.mapModes.FIXED || Map.mapMode === Map.mapModes.DIRECTIONS) {
          if (!Map.marker) {
            return;
          }
          var position = Map.marker.getPosition();
          if (!position) {
            return;
          }
          Map.map.panTo(position);
        }
      });
      
      // grid = new Graticule(Map.map);
    });
  };

  this.setPosition = function (lat,lng) {
    _this.markerGraphic.geometry.setLatitude(lat);
    _this.markerGraphic.geometry.setLongitude(lng);

    if (typeof GeoMarker !== 'undefined' && GeoMarker.getPosition() !== null) {
      // Show geolocation and marker
    } else {
      // Removing and adding the graphic clears up the cache.
      _this.markerLayer.remove(_this.markerGraphic);
      _this.markerLayer.add(_this.markerGraphic);
      _this.map.centerAndZoom(_this.markerGraphic.geometry, 18);
    }

    // Map.map.getStreetView().setVisible(false);
  };

  this.repositionMarker = function() {
    // Reposition the div
    var marker = document.getElementById("w3w-marker"),
        h = marker.offsetHeight,
        w = marker.offsetWidth,
        center = _this.map.toScreen(_this.map.extent.getCenter()),
        xMargin = center.x - w/2,
        yMargin = center.y - h;
    $(marker).animate({
      "left": xMargin + "px",
      "top": yMargin + "px"
    }, 200);

    if (Map.mapMode === Map.mapModes.CENTER) {
      _this.markerGraphic.setGeometry(_this.map.extent.getCenter()); 
    }
  };

  this.addFindControl = function() {
    if (_this.marker && !_this.map.getBounds().contains(_this.marker.getPosition())) {
      _this.findControlIndex = _this.addMapControl(_this.findControl);
    }
    // if (!_this.findControlListener) {
    //  _this.findControlListener = google.maps.event.addListener(_this.map, 'center_changed', function(e){
    //    if (!_this.marker || Map.searchMode) {
    //      return;
    //    }
    //    if (!_this.map.getBounds().contains(_this.marker.getPosition())) {
    //      if (!_this.findControlIndex) {
    //        _this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(_this.findControl);
    //        _this.findControlIndex = Map.map.controls[google.maps.ControlPosition.LEFT_TOP].length - 1;
    //      }
    //    } else {
    //      if (_this.findControlIndex) {
    //        Map.map.controls[google.maps.ControlPosition.LEFT_TOP].removeAt(_this.findControlIndex);
    //        _this.findControlIndex = null;
    //      }
    //    }
    //  });
    // }
  };

  this.removeFindControl = function() {
    if (_this.findControlIndex) {
      _this.removeMapControl(_this.findControlIndex);
      _this.findControlIndex = null;
    }
    _this.findControlIndex = null;
    // if (_this.findControlListener) {
    //  google.maps.event.removeListener(_this.findControlListener);
    //  _this.findControlListener = null;
    // }
  };

  this.addLockControl = function() {
    if (!_this.lockControlIndex) {
      _this.lockControlIndex = _this.addMapControl(_this.lockControl);
    }
  };

  this.removeLockControl = function() {
    if (_this.lockControlIndex) {
      _this.removeMapControl(_this.lockControlIndex);
      _this.lockControlIndex = null;
    }
  };

  this.addGeolocationControl = function() {
    if (!_this.geolocationControlIndex) {
      _this.geolocationControlIndex = _this.addMapControl(_this.geolocationControl);
    }
  };

  this.removeGeolocationControl = function() {
    if (_this.geolocationControlIndex) {
      _this.removeMapControl(_this.geolocationControlIndex);
      _this.geolocationControlIndex = null;
    }
  };

  this.addMapControl = function(control) {
    $('#map-controls').append($(control));
    return $('map-controls').children().length - 1;
  };

  this.removeMapControl = function(index) {
    $('#map-controls > :eq(' + index + ')').detach();
  };
  
  this.toggleLock = function() {
    if (_this.markerLocked) {
      _this.unlockPin();
    } else {
      _this.lockPin();
    }
  };
  
  this.lockPin = function() {
    _this.markerLocked = true;
    $(_this.lockControl).addClass('locked').children('.inner').html(transUnlockPin);
    Menu.menu.find('.lock').addClass('locked').html(transUnlockPin);
  };
  
  this.unlockPin = function() {
    _this.markerLocked = false;
    $(_this.lockControl).removeClass('locked').children('.inner').html(transLockPin);
    Menu.menu.find('.lock').removeClass('locked').html(transLockPin);
  };
  
  this.setMode = function(mode) {
    if (_this.mapMode === mode) {
      return;
    }
    
    var found = false;
    
    for(var prop in _this.mapModes) {
      if (_this.mapModes.hasOwnProperty(prop)) {
        if(_this.mapModes[prop] === mode) {
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      throw 'Requested map mode is unrecognised';
      return;
    }
    
    _this.previousMapMode = _this.mapMode;
    _this.mapMode = mode;
    
    switch (_this.mapMode) {
      case _this.mapModes.CENTER:
        _this.removeFindControl();
        _this.addLockControl();
        
        _this.unlockPin();
        
        _this.switchToCentered();
      break;

      case _this.mapModes.FIXED:
        _this.addLockControl();
        _this.addFindControl();
                
        _this.lockPin();
        
        _this.switchToFixed();
      break;
      
      case _this.mapModes.DIRECTIONS:
        _this.removeLockControl();
        _this.addFindControl();
        
        _this.switchToFixed();
      break;
    }
    
    _this.updateMarker();
  };
  
  this.switchToCentered = function() {
    this.map.centerAt(this.markerGraphic.geometry).then(function () {
      $("#w3w-marker").show();
      _this.markerLayer.hide();
    });
  };
  
  this.switchToFixed = function() {
    _this.markerLayer.show();
    $(_this.markerLayer.getNode()).show({
      complete: function() {
        $("#w3w-marker").hide();
      }
    })
  };
  
  this.getResponsiveMarkerSize = function() {
    var markerSize = null;
    
    if (window.innerWidth > 1025) {
      markerSize = "desktop";
    }
    if (window.innerWidth > 601 && window.innerWidth < 1025) {
      markerSize = "tablet";
    }
    if (window.innerWidth < 601) {
      markerSize = "mobile";
    }
    
    return markerSize;
  };
  
  this.setResponsiveMarkerSize = function() {
    var markerSizeClass = this.getResponsiveMarkerSize();
    _this.markerSize = this.markerSizes[markerSizeClass];
    _this.markerSymbol = this.markerSymbols[markerSizeClass];
  };
  
  this.setMarkerSize = function() {
    if (!_this.markerRenderer) { return; }

    if (Words.oneword) {
      this.markerSymbol.url = "http://map.what3words.com/images/map/marker-oneword.png";
    } else {
      this.markerSymbol.url = "http://map.what3words.com/images/map/marker.png";
    }

    this.markerRenderer.symbol = this.markerSymbol;
    this.markerLayer.redraw();
  };
  
  this.getCoords = function () {
    var p = _this.map.getCenter();
    return { lat: p.lat().toFixed(6), lng: p.lng().toFixed(6) };
  };
  
  this.getCoordsString = function () {
    var p = _this.map.getCenter();
    return p.lat().toFixed(6) + ',' + p.lng().toFixed(6);
  };
  
  this.getWords = function(position, callback) {
    var _this = this;
    
    var loadingTimeout = setTimeout(function() { Wordbar.setWords(transLoading + 'â€¦'); }, 500);
    
    if (!position) { // || !(position instanceof google.maps.LatLng)) {
      switch (_this.mapMode) {
        case _this.mapModes.CENTER:
          position = _this.map.geographicExtent.getCenter();
        break;
        
        case _this.mapModes.FIXED:
        case _this.mapModes.DIRECTIONS:
          position = _this.markerGraphic.geometry;
        break;
      }
    }
    
    var positionString = position.getLatitude().toFixed(6) + ',' + position.getLongitude().toFixed(6);
        
    $.get(root + '/position/' + positionString, { lang: Map.language, debug: 1 }, function (res) {
      clearTimeout(loadingTimeout);
      if (res.hasOwnProperty('error')) {
        Popup.loadPopup('error', res, true);
      } else if (res.hasOwnProperty('words')) {
        
        var words = res.words.join('.');
        Wordbar.setWords(words);

        // var position = Map.map.geographicExtent.getCenter();
        
        // Set new words
        Words.words = words;
        Words.oneword = false;
        Words.latitude = position.getLatitude();
        Words.longitude = position.getLongitude();
        Words.info = null;
        
        Words.appendToHistory();
        Words.display();
        
        if (typeof callback !== 'undefined') {
          callback.call();
        }
      }
    }, 'json');
  };
    
  this.getWordsLanguage = function(langCode, callback) {
    $.get(root + '/position/' + Map.getCoordsString(), { lang: langCode, debug: 1 }, function (res) {
      var words = null;
      
      if (res.hasOwnProperty('words'))
      {
        var words = res.words.join('.');
      }
      
      if (typeof callback !== 'undefined') {
        callback.apply(Words, [words]);
      }
    }, 'json');
  };
  
  this.updateMarker = function(callback) {
    if (Map.searchMode) return;
    
    switch (_this.mapMode) {
      case _this.mapModes.CENTER:
        _this.markerGraphic.geometry = _this.map.extent.getCenter();
        _this.getWordsCenter(callback);
      break;
      
      case _this.mapModes.FIXED:
      case _this.mapModes.DIRECTIONS:
        _this.getWordsFixed(callback);
      break;
    }
    ga('send', 'event', 'Action', 'move_pin');
  };
  
  this.getWordsCenter = function(callback) {
    var mapCenter = Map.map.geographicExtent.getCenter();
    
    if (mapCenter && Words.positionSet() && 
        mapCenter.y.toFixed(6) === Words.lat().toFixed(6) && 
        mapCenter.x.toFixed(6) === Words.lng().toFixed(6)) {
      return;
    }
    
    _this.getWords(null, callback);
  };
  
  this.getWordsFixed = function(callback) {
    if (_this.markerGraphic === null || !_this.markerGraphic.geometry) {
      throw 'Marker not set';
      return;
    }
    var position = _this.markerGraphic.geometry;
    
    if (Words.positionSet() && 
        position.getLatitude().toFixed(6) === Words.lat().toFixed(6) && 
        position.getLongitude().toFixed(6) === Words.lng().toFixed(6)) { 
      return;
    }
    
    _this.getWords(position, callback);
  };
  
  this.setGeoMarker = function(callback, selfie) {
    if (!navigator.geolocation) {
      Popup.loadPopup('geolocation-error');
      return;
    }
    if (!_this.geoMarker || !_this.geoMarker.getPosition()) {
      _this.geoMarker = new GeolocationMarker(Map.map);
      var listener = google.maps.event.addListener(_this.geoMarker, 'geolocation_error', function() {
        if (selfie) {
          Popup.loadPopup('geolocation-error-selfie');
          google.maps.event.removeListener(listener);
        } else {
          Popup.loadPopup('geolocation-error');
          google.maps.event.removeListener(listener);
        }
      });
      var firstLocateEvent = google.maps.event.addListener(_this.geoMarker, 'position_changed', function() {
        callback.call(_this);
        google.maps.event.removeListener(firstLocateEvent);
      });
    } else {
      callback.call(_this);
    }
  };
};



Words = new function() {
  this.oneword = false;
  this.words = '';
  this.latitude = null;
  this.longitude = null;
  this.info = null;
  
  this.positionSet = function() {
    var _this = this;
    if (_this.latitude && _this.longitude) {
      return true;
    } else {
      return false;
    }
  };
  
  this.appendToHistory = function() {
    var _this = this;
    if (typeof Storage === "undefined") {
      return false;
    }
    
    var history = (localStorage.wordHistory) ? JSON.parse(localStorage.wordHistory) : Array();
      
    if (history.length) {
      var latestItem = history[history.length - 1];
      if (latestItem.words === _this.words) {
        return true;
      }
      
      var bytes = lengthInUtf8Bytes(JSON.stringify(history));
      while (lengthInUtf8Bytes(JSON.stringify(history)) > 524288) {
        history.splice(0, 1);
      }
    }
    
    history.push(this);
    localStorage.wordHistory = JSON.stringify(history);
    
    Wordbar.setHistoryIcons();
    Wordbar.historyIndex = 1;
  };
    
  this.display = function() {
    var _this = this;
    if (_this.oneword) {
      $('html').addClass('oneword');
      if (_this.info) {
        oneWordDetails.setInfo(_this);
      }
      if (Map.marker) {
        Map.setResponsiveMarkerSize();
        Map.setMarkerSize();
      }
    } else {
      $('html').removeClass('oneword');
      oneWordDetails.hideDetails();
      if (Map.marker) {
        Map.setResponsiveMarkerSize();
        Map.setMarkerSize();
      }
    }
    Wordbar.setWords(_this.words);
    if (_this.oneword && typeof Map.editing === 'undefined') {
      if (typeof window.history.pushState == 'function') {
        window.history.pushState('string', this.words, '/' + this.words);
      }
    }
  };
  
  this.lat = function() {
    var _this = this;
    return parseFloat(_this.latitude);
  };
  
  this.lng = function() {
    var _this = this;
    return parseFloat(_this.longitude);
  };
  
  this.getPosition = function() {
    return new google.maps.LatLng(this.latitude, this.longitude);
  };
};

var oneWordDetails = new function() {
  var _this   = this;
  this.contentMobile  = $('#oneword-details-mobile');
  
  this.word   = null;
  this.name   = null;
  this.address1   = null;
  this.address2   = null;
  this.address3   = null;
  this.postcode   = null;
  this.city   = null;
  
  this.website    = null;
  this.telephone    = null;
  this.email    = null;
  
  this.deliveryNotes  = null;
  this.generalNotes = null;
  
  this.facebook   = null;
  this.twitter    = null;
  this.google   = null;
  this.linkedin   = null;
  this.instagram    = null;
  
  this.setBottomPosition = function() {
    var height = this.contentMobile.outerHeight();
    this.contentMobile.css({bottom: - height + 'px'});
  };
  
  this.resetMobileInfo = function() {
    if (!this.contentMobile.hasClass('active')) {
      $('#oneword-details-toggle').addClass('animate');
    }

    this.contentMobile.find('.location .name').html('');
    this.contentMobile.find('.location .address').html('');
    
    this.contentMobile.find('section.description .contact-details p').css({display: 'none'});
    this.contentMobile.find('.description .website').html('');
    this.contentMobile.find('.description .tel').html('');
    this.contentMobile.find('.description .email').html('');
    
    this.contentMobile.find('.notes p.delivery-notes').html('');
    this.contentMobile.find('.notes p.general-notes').html('');
    
    this.contentMobile.find('section.location').css({display: 'none'});
    this.contentMobile.find('section.description').css({display: 'none'});
    this.contentMobile.find('section.notes').css({display: 'none'});
    this.contentMobile.find('section.delivery-notes').css({display: 'none'});
    this.contentMobile.find('section.general-notes').css({display: 'none'});
    
    this.contentMobile.find('section.social').css({display: 'none'});
    this.contentMobile.find('section.social a').not('.gps').not('.email').css({display: 'none'});
  };
  
  this.renderMobileInfo = function() {
    this.resetMobileInfo();
    
    this.socialDisplay  = false;
    this.descriptionDisplay = false;
    this.notesDisplay = false;
    
    var address = this.getAddressFormatted();
    
    if (address.length || (this.name && this.name.length)) {
      this.contentMobile.find('.location .name').html(this.name);
      this.contentMobile.find('.location .address').html(address);
      this.contentMobile.find('section.location').css({display: 'block'});
    }
    
    if (this.website && this.website.length) {
      var website = '<a target="_blank" href="' + this.website + '">' + this.website + '</a>';
      this.contentMobile.find('.description .website').html(website);
      this.contentMobile.find('.description .website').parent('p').css({display: 'block'});
      this.descriptionDisplay = true;
    }
    
    if (this.telephone && this.telephone.length) {
      this.contentMobile.find('.description .telephone').html('<a href="tel:' + this.telephone + '">' + this.telephone + '</a>');
      this.contentMobile.find('.description .telephone').parent('p').css({display: 'block'});
      this.descriptionDisplay = true;
    }
    
    if (this.email && this.email.length) {
      var email = '<a href="mailto:' + this.email + '">' + this.email + '</a>';
      this.contentMobile.find('.description .email').html(email);
      this.contentMobile.find('.description .email').parent('p').css({display: 'block'});
      this.descriptionDisplay = true;
    }
    
    if (this.descriptionDisplay) {
      this.contentMobile.find('section.description').css({display: 'block'});
    }
    
    if (this.deliveryNotes && this.deliveryNotes.length) {
      var deliveryNotes = this.deliveryNotes.replace(/\b((([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))\b/g, '<a href="mailto:$1">$1</a>');
      var deliveryNotes = deliveryNotes.replace(/\b(https?:\/\/[\da-z\.-]+\.[a-z\.]{2,6}[^ \r\n]+)\b/ig, '<a rel="nofollow" target="_blank" href="$1">$1</a>');
      var deliveryNotes = deliveryNotes.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
      
      this.contentMobile.find('section.notes p.delivery-notes').html(deliveryNotes);
      this.contentMobile.find('section.delivery-notes').css({display: 'block'});
      this.notesDisplay = true;
    }
    
    if (this.generalNotes && this.generalNotes.length) {
      this.contentMobile.find('section.notes p.general-notes').html(this.generalNotes.replace(/\b((([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))\b/g, '<a href="mailto:$1">$1</a>').replace(/\b(https?:\/\/[\da-z\.-]+\.[a-z\.]{2,6}[^ \r\n]+)\b/ig, '<a rel="nofollow" target="_blank" href="$1">$1</a>').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2'));
      this.contentMobile.find('section.general-notes').css({display: 'block'});
      this.notesDisplay = true;
    }
    
    if (this.facebook && this.facebook.length) {
      this.contentMobile.find('.notes .social .facebook').attr('href', this.facebook);
      this.contentMobile.find('.notes .social .facebook').css({display: 'inline-block'});
      this.socialDisplay = true;
      this.notesDisplay = true;
    }
    
    if (this.twitter && this.twitter.length) {
      this.contentMobile.find('.notes .social .twitter').attr('href', this.twitter);
      this.contentMobile.find('.notes .social .twitter').css({display: 'inline-block'});
      this.socialDisplay = true;
      this.notesDisplay = true;
    }
    
    if (this.google && this.google.length) {
      this.contentMobile.find('.notes .social .googleplus').attr('href', this.google);
      this.contentMobile.find('.notes .social .googleplus').css({display: 'inline-block'});
      this.socialDisplay = true;
      this.notesDisplay = true;
    }
    
    if (this.linkedin && this.linkedin.length) {
      this.contentMobile.find('.notes .social .linkedin').attr('href', this.linkedin);
      this.contentMobile.find('.notes .social .linkedin').css({display: 'inline-block'});
      this.socialDisplay = true;
      this.notesDisplay = true;
    }
    
    if (this.instagram && this.instagram.length) {
      this.contentMobile.find('.notes .social .instagram').attr('href', this.instagram);
      this.contentMobile.find('.notes .social .instagram').css({display: 'inline-block'});
      this.socialDisplay = true;
      this.notesDisplay = true;
    }
    
    if (this.notesDisplay) {
      this.contentMobile.find('section.notes').css({display: 'block'});
    }
    
    if (this.socialDisplay) {
      this.contentMobile.find('section.social').css({display: 'block'});
    }
    
    this.setBottomPosition();
  };
  
  this.getAddressFormatted = function() {
    var address = Array();
    if (this.address1 && this.address1.length)  address.push(this.address1);
    if (this.address2 && this.address2.length)  address.push(this.address2);
    if (this.address3 && this.address3.length)  address.push(this.address3);
    if (this.city && this.city.length)    address.push(this.city);
    if (this.postcode && this.postcode.length)  address.push(this.postcode);
    
    if (!address.length) {
      return '';
    }
    return address.join('<br>');
  };
  
  this.showDesktopInfo = function() {
    this.contentDesktop.show();
    $('#side #explain').hide();
  };
  
  this.hideDesktopInfo = function() {
    this.contentDesktop.hide();
    $('#side #explain').show();
  };
  
  this.showMobileToggle = function() {
    $('#oneword-details-toggle').show();
  };
  
  this.hideMobileToggle = function() {
    $('#oneword-details-toggle').hide();
    $('#oneword-details-mobile').removeClass('active');
  };
  
  // info box
  $('#oneword-details-toggle').click(function(e){
    e.preventDefault();
    
    _this.toggle();
  });
  
  this.setData = function(data) {
    this.word   = data.words;
    this.name   = data.info.name;
    this.address1   = data.info.address1;
    this.address2   = data.info.address2;
    this.address3   = data.info.address3;
    this.postcode   = data.info.postcode;
    this.city   = data.info.city;

    this.website    = data.info.website;
    this.telephone    = data.info.telephone;
    this.email    = data.info.email;

    this.deliveryNotes  = data.info.delivery_notes;
    this.generalNotes = data.info.notes;

    this.facebook   = data.info.social_facebook;
    this.twitter    = data.info.social_twitter;
    this.google   = data.info.social_google;
    this.linkedin   = data.info.social_linkedin;
    this.instagram    = data.info.social_instagram;
  };
  
  this.setInfo = function(data) {
    if (
      (typeof data.info.name === 'undefined' || data.info.name.length < 1) &&
      (typeof data.info.address1 === 'undefined' || data.info.address1.length < 1) &&
      (typeof data.info.address2 === 'undefined' || data.info.address2.length < 1) &&
      (typeof data.info.address3 === 'undefined' || data.info.address3.length < 1) &&
      (typeof data.info.postcode === 'undefined' || data.info.postcode.length < 1) &&
      (typeof data.info.city === 'undefined' || data.info.city.length < 1) &&
      (typeof data.info.website === 'undefined' || data.info.website.length < 1) &&
      (typeof data.info.telephone === 'undefined' || data.info.telephone.length < 1) &&
      (typeof data.info.email === 'undefined' || data.info.email.length < 1) &&
      (typeof data.info.deliveryNotes === 'undefined' || data.info.deliveryNotes.length < 1) &&
      (typeof data.info.generalNotes === 'undefined' || data.info.generalNotes.length < 1) &&
      (typeof data.info.social_facebook === 'undefined' || data.info.social_facebook.length < 1) &&
      (typeof data.info.social_twitter === 'undefined' || data.info.social_twitter.length < 1) &&
      (typeof data.info.social_google === 'undefined' || data.info.social_google.length < 1) &&
      (typeof data.info.social_linkedin === 'undefined' || data.info.social_linkedin.length < 1) &&
      (typeof data.info.social_instagram === 'undefined' || data.info.social_instagram.length < 1)
    ) {
      this.resetMobileInfo();
      this.hideMobileToggle();
      return;
    }
    this.setData(data);
    this.renderMobileInfo();
    this.showMobileToggle();
  };

  this.toggle = function() {
    $('#oneword-details-mobile').toggleClass('active');
    if ($('#oneword-details-mobile').hasClass('active')) {
      Wordbar.hide();
      $('#oneword-details-toggle').removeClass('animate');
    }
  };
  
  this.hideDetails = function() {
    this.resetMobileInfo();
    this.hideMobileToggle();
  };
};

var Wordbar = new function() {
  var _this = this;
  this.words = $('#word-view');
  
  this.activity = false;
  this.active = false;

  this.historyIndex = 1;
  
  $('#word-view .wordbar-toggle').on('click', function(){
    _this.toggle();
  });
  
  this.words.on('click', '.display', function(){
    if (_this.active) {
      _this.hide();
    } else {
      _this.show();
    }
  });
  
  this.words.touchwipe({
    wipeUp: function() { _this.hide(); },
    wipeDown: function() { _this.show(); },
    min_move_x: 20,
    min_move_y: 20,
    preventDefaultEvents: true
  });
  
  this.words.on('click', '.share', function(){
    Sharebox.show(Words.words, Words.lat(), Words.lng(), Words.oneword);
    _this.hide();
  });
  
  this.words.on('click', '.open-maps', function(){
    var getDirections = function(currentPosition) {
      if (!currentPosition) {
        alert('Could not determine your location. Please try again later.');
        return;
      }
    };
    
    if (Map.geoMarker) {
      var currentPosition = Map.geoMarker.getPosition();
      getDirections(currentPosition);
    } else {
      Map.setGeoMarker(function(){
        if (!Map.geoMarker || !Map.geoMarker.getPosition()) {
          alert('Could not determine your location. Please try again later.');
          return;
        }
        var currentPosition = Map.geoMarker.getPosition();
        getDirections(currentPosition);
      });
    }
  });
  
  this.words.on('click', '.move-oneword', function(){
    Popup.loadPopup('move-oneword');
  });
  
  this.words.on('click', '.buy', function (){
    _this.hide();
    Sharebox.hide();
    Popup.loadPopup('oneword', Map.getCoords(), true);
  });
  
  this.words.on('click', '.history', function(e){
    e.preventDefault();
    if ($(this).hasClass('back')) {
      _this.historyBack();
    }
    if ($(this).hasClass('forward')) {
      _this.historyForward();
    }
  });
  
  // --
  
  this.historyBack = function() {
    var history = JSON.parse(localStorage.wordHistory);
    if (_this.historyIndex < history.length) {
      _this.historyIndex++;
    } else {
      return;
    }
    var historyItem = history[history.length - _this.historyIndex];
    _this.historyLoad(historyItem);
  };
  
  this.historyForward = function() {
    var history = JSON.parse(localStorage.wordHistory);
    if (_this.historyIndex > 1) { 
      _this.historyIndex--;
    } else {
      return;
    }
    
    var historyItem = history[history.length - _this.historyIndex];
    _this.historyLoad(historyItem);
  };
  
  this.historyLoad = function(historyItem) {
    var _this = this;
    var position = new google.maps.LatLng(historyItem.latitude, historyItem.longitude);
    
    if (Map.mapMode === Map.mapModes.CENTER) {
      Map.setMode(Map.mapModes.FIXED);
      Map.marker.setPosition(position);
      Map.map.panTo(position);
    } else {
      if (Map.marker) {
        Map.marker.setPosition(position);
        Map.map.setCenter(position);
        if (Map.mapMode === Map.mapModes.DIRECTIONS) {
          var getDirections = function(currentPosition) {
            if (!currentPosition || !Map.marker) {
              alert('Could not determine your location. Please try again later.');
              return;
            }
            var endPosition = Map.marker.getPosition();
            if (!Directions.getDirections(currentPosition, endPosition)) {
              return; 
            }
          };
          if (Map.geoMarker) {
            var currentPosition = Map.geoMarker.getPosition();
            getDirections(currentPosition);
          } else {
            Map.setGeoMarker(function(){
              if (!Map.geoMarker || !Map.geoMarker.getPosition()) {
                alert('Could not determine your location. Please try again later.');
                return;
              }
              var currentPosition = Map.geoMarker.getPosition();
              getDirections(currentPosition);
            });
          }
        }
      }
    }
    
    Words.words = historyItem.words;
    Words.oneword = historyItem.oneword;
    Words.latitude  = historyItem.latitude;
    Words.longitude = historyItem.longitude;
    Words.info  = historyItem.info;
    Words.display();
    Wordbar.setHistoryIcons();
  };
  
  this.setHistoryIcons = function() {
    if (typeof window.localStorage !== 'undefined' && typeof localStorage.wordHistory !== 'undefined') {
      var history = JSON.parse(localStorage.wordHistory);
      
      if (history.length > 1 && _this.historyIndex < history.length) {
        this.words.find('.history.back').show();
      } else {
        this.words.find('.history.back').hide();
      }
      
      if (_this.historyIndex > 1) {
        this.words.find('.history.forward').show();
      } else {
        this.words.find('.history.forward').hide();
      }
    }
  };
  
  this.toggle = function () {
    _this.words.toggleClass('active');
    Sharebox.hide();
    if (Directions.active) { 
      Directions.close();
    }
    $('#oneword-details-mobile').removeClass('active');
    $('html').removeClass('menu-active');
    Popup.hidePopups({target : {id : 'popup-container'}});
  };
  
  this.show = function() {
    _this.active = true;
    _this.words.addClass('active');
    
    Sharebox.hide();
    if (Directions.active) {
      Directions.close();
    }
    $('#oneword-details-mobile').removeClass('active');
    $('html').removeClass('menu-active');
    Popup.hidePopups({target : {id : 'popup-container'}});
  };
  
  this.hide = function() {
    _this.active = false;
    _this.words.removeClass('active');
  };
  
  this.setWords = function (str) {
    _this.words.find('.display').text(str);
  };
  
  this.showWords = function () {
    return _this.words.find('.display').text();
  };
};

var Directions = new function () {
  // TODO - Cleanup
  return;

  var _this = this;
  this.result = null;
  this.travel_mode = null;
  this.directionsDisplay = new google.maps.DirectionsRenderer({ draggable: false, preserveViewport: true, markerOptions: { visible: false } });
  this.directionsService = new google.maps.DirectionsService();
  this.directionMoveEvent = null;
  
  this.content = $('#directions');
  this.content.on('click', '.icons a', function(e) {
    e.preventDefault();
    Directions.setMode($(this).data('mode'));
    $(this).addClass('active').siblings().removeClass('active');
    
    var getDirections = function(currentPosition) {
      if (!currentPosition) {
        alert('Could not determine your location. Please try again later.');
        return;
      }
      Map.setMode(Map.mapModes.DIRECTIONS);
      var endPosition = (Map.marker) ? Map.marker.getPosition() : Map.map.getCenter();
      if (!Directions.getDirections(currentPosition, endPosition)) {
        return; 
      }
      Wordbar.hide();
    };
    
    if (Map.geoMarker) {
      var currentPosition = Map.geoMarker.getPosition();
      getDirections(currentPosition);
    } else {
      Map.setGeoMarker(function(){
        if (!Map.geoMarker || !Map.geoMarker.getPosition()) {
          alert('Could not determine your location. Please try again later.');
          return;
        }
        var currentPosition = Map.geoMarker.getPosition();
        getDirections(currentPosition);
      });
    }
  });
  
  this.content.on('click', '.button.close', function(e) {
    _this.close();
  });
  
  this.content.on('click', '.directions-header .toggle', function (e) {
    Directions.content.toggleClass('minimised');
  });
  
  this.close = function() {
    _this.content.removeClass('active');
    _this.directionsDisplay.setMap(null);
    _this.directionMoveEvent.remove();
    delete _this.directionMoveEvent;
    
    $('#directions .directions-menu .icons a').removeClass('active');
    $('#directions .directions-menu .icons a.driving').addClass('active');
    
    Map.setMode(Map.previousMapMode);
  };
  
  this.setMode = function (mode) {
    switch (mode) {
      case 'cycling': this.travel_mode = google.maps.TravelMode.BICYCLING; break;
      case 'public':  this.travel_mode = google.maps.TravelMode.TRANSIT; break;
      case 'walking': this.travel_mode = google.maps.TravelMode.WALKING; break;
      case 'driving':
      default:  
        mode = 'driving';
        this.travel_mode = google.maps.TravelMode.DRIVING; break;
    }
  };
  
  this.getDirections = function (startPos, endPos) {
    // TODO - Cleanup
    alert("Directions!");

    return;

    if (typeof startPos === 'undefined' || typeof endPos === 'undefined') {
      alert('Find your location first');
      return false;
    }
        
    var request = {
      origin: startPos,
      destination: endPos,
      travelMode: Directions.travel_mode
    };
    
    if (window.innerWidth < 601) {
      $('#directions').addClass('noTransition').addClass('minimised');
    } else {
      $('#directions').removeClass('minimised');
    }
    
    this.directionsService.route(request, function(result, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        Map.setMode(Map.mapModes.DIRECTIONS);

        if (!_this.directionMoveEvent) {
          _this.directionMoveEvent = google.maps.event.addListener(Map.marker, 'dragend', function(e){
            var currentPosition = GeoMarker.getPosition();
            if (typeof currentPosition === 'undefined') {
              return;
            }
            var endPosition = Map.marker.getPosition();
            Directions.getDirections(currentPosition, endPosition);
          });
        }
        
        _this.result = result;
        _this.setDirectionsList();
        Directions.directionsDisplay.setDirections(result);
        
        var zoomLevel = 33;
        var viewportWidth = $('#map-canvas').width();
        var viewportHeight = $('#map-canvas').height();

        var menuWidth = (window.innerWidth < 601) ? 0 : 300;
        var menuHeight  = (window.innerHeight > 601) ? 0 : 80;
        
        var markerHeight = Map.markerSize.height / 2;
        var markerWidth = Map.markerSize.width / 2;

        var rightMostLatLng = (startPos.lng() > endPos.lng()) ? startPos : endPos;
        var leftMostLatLng  = (startPos.lng() > endPos.lng()) ? endPos : startPos;
        var topMostLatLng = (startPos.lat() > endPos.lat()) ? startPos : endPos;
        var bottomMostLatLng  = (startPos.lat() > endPos.lat()) ? endPos : startPos;

        do {
          zoomLevel--;
          var rightMostPoint = latlngToPoint(Map.map, rightMostLatLng, zoomLevel);
          var leftMostPoint = latlngToPoint(Map.map, leftMostLatLng, zoomLevel);
          var topMostPoint = latlngToPoint(Map.map, topMostLatLng, zoomLevel);
          var bottomMostPoint = latlngToPoint(Map.map, bottomMostLatLng, zoomLevel);
          
          //adjust topmost point for marker if it is the pin
          if (topMostLatLng === endPos) {
            topMostPoint.y -= markerHeight;
          }

          var offsetX = rightMostPoint.x - leftMostPoint.x;
          var offsetY = bottomMostPoint.y - topMostPoint.y;
        } while (
          (leftMostLatLng === endPos && (offsetX + markerWidth) > (viewportWidth - menuWidth)) || 
          (leftMostLatLng === startPos && (offsetX + markerWidth) > (viewportWidth - menuWidth)) || 
          (offsetY + markerHeight) > viewportHeight
        );
          
        // Set new center
        var xPos = (rightMostPoint.x + leftMostPoint.x) / 2;
        xPos += menuWidth / 2;
        
        var yPos = (bottomMostPoint.y + topMostPoint.y) / 2;
        yPos += menuHeight / 2;
        
        var centerPoint = new google.maps.Point(xPos, yPos);
        var centerLatLng = pointToLatlng(Map.map, centerPoint, zoomLevel);
        
        Map.map.panTo(centerLatLng);
        Map.map.setZoom(zoomLevel);
        
        $('#directions').removeClass('noTransition');
        Directions.content.addClass('active');
      } else {
        _this.result = null;
        var directionsList = _this.content.find('.directions-list');
        var directionsDistance = _this.content.find('.directions-header .distance');
        var directionsDuration = _this.content.find('.directions-header .time');

        directionsList.html('Could not find any directions to this location.');
        directionsDistance.html('');
        directionsDuration.html('');

        alert('We could not find directions from your position, the pin may be too far away from your current location.');
        return;
      }
    });
    
    this.directionsDisplay.setMap(Map.map);
    
    return true;
  };
  
  this.setDirectionsList = function() {
    var _this = this;
    
    var directions = Array();
    var totalDistance = 0;
    var totalDuration = 0;
    
    var directionsList = _this.content.find('.directions-list');
    var directionsDistance = this.content.find('.directions-header .distance');
    var directionsDuration = this.content.find('.directions-header .time');
    
    var warnings = _this.result.routes[0].warnings;
    for (var i in warnings)
    {
      warnings[i] = "<p class='warning'>" + warnings[i] + "</p>";
    }
    var warnings_output = warnings.join('');
    _this.content.find('.directions-container').find('.warning').remove();
    _this.content.find('.directions-container').prepend(warnings_output);
    
    var legs = _this.result.routes[0].legs;
    
    for (var i in legs)
    {
      totalDistance += legs[i].distance.value;
      totalDuration += legs[i].duration.value;
      
      for (var y in legs[i].steps)
      {
        directions.push(legs[i].steps[y].instructions);
      }
    }
    directionsDistance.html(Math.round(totalDistance / 1000) + " km");
    directionsDuration.html(elapsedHR(totalDuration, 1));
    var output = "<li>" + directions.join('</li><li>') + "</li>";
    directionsList.html(output);
  };
  
  this.setMode();
};

var Infobox = new function() {
  
  this.infobox = $('#infobox');
  
  this.infobox
    .on('click', '.button.save', function() {
      Popup.loadPopup('save-location', { oneword: Map.searchLoaded });
    })
    .on('click', '.button.return', function() {
      typeof init === 'function' ? init() : location.reload();
    });
  
};

var Menu = new function() {
  
  this.menu = $('<div id="rc-menu"/>').css({ display: 'none', opacity: 0 }).appendTo($('#map'));
  this.data = null;
  
  // --
  
  this.set = function(set) {
    this.menu.children().not('.find-pin').hide();
    this.menu.children('.' + set).show();
    return this;
  };
  
  this.show = function(e) {
    Menu.menu.stop().css({ display: 'block' }).fadeTo(70, 0.96);
    
    var mouse_event = null;
    
    for (var i in e) 
      if (typeof e[i] === 'object' && e[i].hasOwnProperty('offsetX'))
        mouse_event = e[i];
    
    if (mouse_event !== null) {
      pos = Map.overlay.getProjection().fromLatLngToContainerPixel(Map.marker.getPosition());
      Menu.menu.css({ top: pos.y + mouse_event.offsetY - 94, left: pos.x + mouse_event.offsetX - 152/2 });
    } else {
      Menu.menu.css({top: e.pixel.y, left: e.pixel.x });
    }
      
    $('.marker.change-lang').show();
    
    Menu.data = e;
  };
  
  this.hide = function() {
    Menu.menu.stop().fadeTo(150, 0, function() { $(this).css({ display: 'none', left: -200 }); });
  };
  
  // --
  
  $('<div class="find-pin">' + transFindPin + '</div>').css({display: 'none'}).appendTo(this.menu)
    .on('click', function(){
      if (Map.marker && Map.marker.getPosition()) {
        Map.map.panTo(Map.marker.getPosition());
      }
    });
  $('<div class="map">' + transPlacePinHere + '</div>').appendTo(this.menu)
    .on('click', function() {
      switch (Map.mapMode) {
        case Map.mapModes.CENTER:
          Map.map.setCenter(Menu.data.latLng);
          Map.getWords();
        break;
        
        case Map.mapModes.FIXED:
          Map.marker.setPosition(Menu.data.latLng);
          Map.getWords();
        break;
        
        case Map.mapModes.DIRECTIONS:
          Map.marker.setPosition(Menu.data.latLng);
          Map.getWords(Map.marker.getPosition());
          
          if (typeof GeoMarker === 'undefined') {
            return;
          }
          var currentPosition = GeoMarker.getPosition();
          if (typeof currentPosition === 'undefined' || !currentPosition) {
            return;
          }
          var endPosition = Menu.data.latLng;
          Directions.getDirections(currentPosition, endPosition);
        break;
      }
    });
  $('<div class="map lock grey-top">' + transLockPin + '</div>').appendTo(this.menu)
    .on('click', function(){
      Map.toggleLock();
      if (Map.markerLocked) {
        Map.setMode(Map.mapModes.FIXED);
      } else {
        Map.setMode(Map.mapModes.CENTER);
      }
    });
  $('<div class="marker share">' + transShare + '</div>').appendTo(this.menu)
    .on('click', function() {
      Sharebox.populate();
      Sharebox.show();
    });
  $('<div class="marker">' + transBuyOneWord + '</div>').appendTo(this.menu)
    .on('click', function() {
      ga('send', 'event', 'Action', 'rightclick_buyoneword');
      Popup.loadPopup('oneword', Map.getCoords(), true);
    });
  $('<div class="marker">' + transCentreMap + '</div>').appendTo(this.menu)
    .on('click', function() {
      Map.map.setCenter(Map.map.getCenter());
      setTimeout(function() {
        console.log();
      }, 100);
    });
    $('<div class="map context-dark red-top">' + transDirToPin + '</div>').appendTo(this.menu)
    .on('click', function() {
      var getDirections = function(currentPosition) {
        if (!currentPosition) {
          alert('Could not determine your location. Please try again later.');
          return;
        }
        var endPosition = (Map.marker) ? Map.marker.getPosition() : Map.map.getCenter();
        Directions.setMode('driving');
        if (!Directions.getDirections(currentPosition, endPosition)) {
          return; 
        }
        _this.hide();
      };
      
      if (Map.geoMarker) {
        var currentPosition = Map.geoMarker.getPosition();
        getDirections(currentPosition);
      } else {
        Map.setGeoMarker(function(){
          if (!Map.geoMarker || !Map.geoMarker.getPosition()) {
            alert('Could not determine your location. Please try again later.');
            return;
          }
          var currentPosition = Map.geoMarker.getPosition();
          getDirections(currentPosition);
        });
      }
    });
  $('<div class="map context-dark grey-top">' + transSharePin + '</div>').appendTo(this.menu)
    .on('click', function() {
      Sharebox.show(Words.words, Words.lat(), Words.lng(), Words.oneword);
    });
  $('<div class="map context-dark red-top">' + transMoveToPin + '</div>').appendTo(this.menu)
    .on('click', function() {
      Popup.loadPopup('move-oneword');
    });
  $('<div class="map context-dark grey-top">' + transBuyOneWord + '</div>').appendTo(this.menu)
    .on('click', function() {
      Popup.loadPopup('oneword', Map.getCoords(), true);
    });
  $('<div class="marker change-lang red-top">' + transChangeLang + '</div>').appendTo(this.menu)
    .on('click', function() {
      Popup.loadPopup('change-word-language', {language: Map.language, words: Wordbar.showWords()});
    });
  
  /*
  languages = rcmenuLanguages['languages'];
  
  for (lang in languages) {
    $('<div class="marker change-lang" data-code="' + languages[lang]['code'] + '">' + languages[lang]['menuItem'] + '</div>').appendTo(this.menu)
      .on('click', function() {
        Map.language = $(this).data('code');
        Map.getWords(Words.getPosition());
      });
  }
  */
  
  $('body').on('click', function() {
    Menu.hide();
    MarkerMenu.hide();
  });
};

var MarkerMenu = new function() {
  var _this = this;
  this.menu = $('<div class="map-menu"></div>').css({ display: 'none', opacity: 0 }).appendTo($('#map'));
  this.markerListener = null;
  
  this.initialise = function() {
    //_this.overlay = new MenuOverlay(Map.map);
  };
  
  this.set = function() {
    _this.menu.html('');
    
    switch (Map.mapMode) {
      case Map.mapModes.CENTER:
        _this.menu.append('<div>' + transLockPin + '</div>');
      break;
      
      case Map.mapModes.FIXED:
        _this.menu.append('<div>' + transUnlockExplore + '</div>');
      break;
    }
  };
  
  this.show = function() {
    _this.set();
    _this.menu.stop().css({ display: 'block' }).fadeTo(70, 0.96);
  };
  
  this.hide = function() {
    _this.menu.stop().fadeTo(150, 0, function() {
      $(this).css({ display: 'none', left: -200 }); 
    });
  };
};

function MenuOverlay(map) { this.setMap(map); }
// MenuOverlay.prototype = new google.maps.OverlayView();
MenuOverlay.prototype.onAdd = function() { 
  var _this = this;
  this.listeners_ = [
    google.maps.event.addListener(this.getMap(), 'idle', function() {
      _this.draw();
    }),
    google.maps.event.addListener(this.getMap(), 'center_changed', function() {
      _this.draw();
    }),
    google.maps.event.addListener(this.getMap(), 'zoom_changed', function() {
      _this.draw();
    })
  ];
};
MenuOverlay.prototype.onRemove = function() {
  for (var i = 0, I = this.listeners_.length; i < I; ++i) {
    google.maps.event.removeListener(this.listeners_[i]);
  }
};
MenuOverlay.prototype.draw = function() { 
  var projection = this.getProjection();
  if (Map.marker) {
    var markerPosition = Map.marker.getPosition();
    var position = projection.fromLatLngToDivPixel(this.getMap().getCenter());
    MarkerMenu.menu.css({top: position.y, left: position.x});
  }
};

$(function() {
  // initialise map
  Map.initialise();
    
  // Responsive JavaScript
  $(window).resize(function() {
    google.maps.event.trigger(Map.map, 'resize'); 
    Map.updateMarker();
    
    oneWordDetails.setBottomPosition();
    
    Map.setResponsiveMarkerSize();
    Map.setMarkerSize();
    
    if (window.innerWidth > 1025) {
      if (typeof Map.map !== 'undefined') {
        if (Map.map.streetViewControl != true) {
          Map.map.setOptions({streetViewControl: true});
        }
      }
    }
    if (window.innerWidth > 601 && window.innerWidth < 1025) {
      if (typeof Map.map !== 'undefined') {
        if (Map.map.streetViewControl != false) {
          Map.map.setOptions({streetViewControl: false});
        }
      }
    }
    if (window.innerWidth < 601) {
      if (typeof Map.map !== 'undefined') {
        if (Map.map.streetViewControl != false) {
          Map.map.setOptions({streetViewControl: false});
        }
      }
    }
  });
});


// Other
if (window.addEventListener)
{
  window.addEventListener('popstate', function(e) {
    if (firstPopState) {
      firstPopState = false;
    }
    else if ($('body').hasClass('pg-home')) {
      var curUrl = location.href;
      curUrl = curUrl.split('?')[0];
      urlSearch = curUrl.substr(curUrl.lastIndexOf('/') + 1);
      urlSearch = decodeURIComponent(urlSearch);
      urlSearch = urlSearch.toLowerCase();
      searchBox = $('#side .search .text').val();
      searchBox = searchBox.toLowerCase();
      if (urlSearch != 'home' && urlSearch != searchBox) location.reload();
    }
  });
}