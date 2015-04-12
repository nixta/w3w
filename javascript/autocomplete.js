$(document).ready(function(){
	
	$('.w3w-search').parents('form').append($('<input>').attr({type: 'hidden', name: 'autocomplete'}).val('false'));
	
	 $.widget( "app.autocomplete", $.ui.autocomplete, {
		_renderItem: function( ul, item ) {
			var result = this._super( ul, item );
			if (item.logo)
			{
				result.find( "a" )
				      .addClass( "ui-menu-item-icon" )
				      .css( "background-image", "url(" + item.logo + ")" );
			}
			return result;
		}
	});
	
	$('.w3w-search').autocomplete({
		minLength: 0,
		source: function (request, response) {

			var lat = 51.507222;
			var lng = -0.1275;
		
			if (typeof Map !== 'undefined') {
				if (Map.geoMarker !== null) {
					var position = Map.geoMarker.getPosition();
					lat = position.lat();
					lng = position.lng();
				}

				if (!lat || !lng && typeof Words !== 'undefined') {
					lat = Words.latitude;
					lng = Words.longitude;
				}
			}
			$.ajax({
				url: "http://map.what3words.com/calls/autocomplete",
				dataType: "json",
				type: "GET",
				data: $.extend(request, {lat: lat, lng: lng}), 
				success: function (data) {
				response(data.slice(0,6));
				//response(data);
				}
			});			
		}
	}).click(function() { $(this).autocomplete("search", " "); });
	
	$('.w3w-search').on('autocompleteselect', function(event, ui) {
		$(this).parents('form').find('input[name=autocomplete]').val(ui.item.placesReference);
		$(this).val(ui.item.label).parents('form').submit();
	});
	
	$(document).on('input', '.w3w-search', function(e) {
		$(this).parents('form').find('input[name=autocomplete]').val('false');
	});
	
});