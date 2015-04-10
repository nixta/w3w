// Derivative of work by Bill Chadwick
// http://www.bdcc.co.uk/Gmaps/BdccGmapBits.htm
//
// Including adaptions from Matthew Shen
//
// Reworked 2013 by Liberty Tech for what3words

var Graticule = (function() {
	
	function _(map)
	{
		this.set('container', document.createElement('DIV'));
		this.setMap(map);
	}
	
	// _.prototype = new google.maps.OverlayView();
	
	_.prototype.onAdd = function() {
		var self = this;
		this.getPanes().mapPane.appendChild(this.get('container'));

		function redraw()
		{
			self.draw();
		}
		this.idleHandler_ = google.maps.event.addListener(this.getMap(), 'idle', redraw);

		function changeColor()
		{
			self.draw();
		}
		changeColor();
		this.typeHandler_ = google.maps.event.addListener(this.getMap(), 'maptypeid_changed', changeColor);
	};
	
	_.prototype.clear = function() {
		var container = this.get('container');
		while (container.hasChildNodes()) {
			container.removeChild(container.firstChild);
		}
	};
	
	_.prototype.onRemove = function()
	{
		this.get('container').parentNode.removeChild(this.get('container'));
		this.set('container', null);
		google.maps.event.removeListener(this.idleHandler_);
		google.maps.event.removeListener(this.typeHandler_);
	};

	function _bestTextColor(overlay)
	{
		var type = overlay.getMap().getMapTypeId();
		var GMM = google.maps.MapTypeId;
		if (type === GMM.HYBRID) return '#fff';
		if (type === GMM.ROADMAP) return '#000';
		if (type === GMM.SATELLITE) return '#fff';
	};
	
	function cos_degrees(n)
	{
		n = n * (Math.PI / 180);
		return Math.cos(n);	
	}

	function latLngToPixel(overlay, lat, lng)
	{
		return overlay.getProjection().fromLatLngToDivPixel(
		new google.maps.LatLng(lat, lng));
	}

	function npx(n)
	{
		return n.toString() + 'px';
	}

	function createLine(x, y, w, h, color)
	{
		var d = document.createElement('DIV');
		var s = d.style;
		s.position = 'absolute';
		s.overflow = 'hidden';
		s.backgroundColor = color;
		if (color == '#fff')
			s.opacity = 0.1;
		else
			s.opacity = 0.05;
		var s = d.style;
		s.left = npx(x);
		s.top = npx(y);
		s.width = npx(w);
		s.height = npx(h);
		return d;
	};

	var span = 50000;
	
	function verticalLine(px, color)
	{
		return createLine(px - 1, -span, 3, 2 * span, color);
	}
	
	function horziontalLine(py, color)
	{
		return createLine(-span, py - 2, 2 * span, 3, color);
	}

	_.prototype.draw = function()
	{
		var color = _bestTextColor(this);

		this.clear();
		
	  	if (this.getMap().getZoom() < 20) return;


		// Determine grid interval
		
		var bnds = this.getMap().getBounds();
		if (!bnds) return;

		var sw = bnds.getSouthWest(),
		ne = bnds.getNorthEast();
		var l = sw.lng(),
		b = sw.lat(),
		r = ne.lng(),
		t = ne.lat();
		if (l == r) { l = -180.0; r = 180.0; }
		if (t == b) { b = -90.0; t = 90.0; }
		
		Yt = Math.floor((t + 90) * 24);
		Yb = Math.floor((b + 90) * 24);
		
		Wy = Math.max(1, Math.floor(1546 * cos_degrees((Yt + 0.5)/24 - 90)));		
		var nLat = 24 * 1546;
		var nLng = 24 * Wy;
		
		//console.log('Yt = ' + Yt + ', Yb = ' + Yb);
		
		l = Math.floor(l * nLng) / nLng;
		b = Math.floor(b * nLat) / nLat;
		t = Math.ceil(t * nLat) / nLat;
		r = Math.ceil(r * nLng) / nLng;
		

		// Vertical lines
		
		if (Yt == Yb && 1 == 2)
		{
			for (var lo = l; lo < r; lo += 1 / nLng)
			{
				var px = latLngToPixel(this, b, lo).x;
				this.get('container').appendChild(verticalLine(px, color));
			}
		}
		else
		{
			Wyt = Math.max(1, Math.floor(1546 * cos_degrees((Yt + 0.5)/24 - 90)));	
			Wyb = Math.max(1, Math.floor(1546 * cos_degrees((Yb + 0.5)/24 - 90)));	
			
			var nLngt = 24 * Wyt;
			var nLngb = 24 * Wyb;
			
			lt = Math.floor(l * nLngt) / nLngt;
			lb = Math.floor(l * nLngb) / nLngb;
			
			blat = Yt / 24 - 90;
			var by = latLngToPixel(this, blat, 0).y;

			for (var lo = lt; lo < r; lo += 1 / nLngt)
			{
				var px = latLngToPixel(this, b, lo).x;
				
				line = createLine(px - 1, -span, 3, span + by, color);
				this.get('container').appendChild(line);
			}
			
			for (var lo = lb; lo < r; lo += 1 / nLngb)
			{
				var px = latLngToPixel(this, b, lo).x;
				line = createLine(px - 1, by, 3, span, color);
				this.get('container').appendChild(line);
			}
		}
		
	  
		// Horizontal lines
		
		for (; b <= t; b += 1 / nLat)
		{
			var py = latLngToPixel(this, b, l).y;
			this.get('container').appendChild(horziontalLine(py, color));
		}
	};

	return _;
})();