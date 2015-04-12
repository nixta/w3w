var root = 'http://map.what3words.com/calls';
//root = 'http://ec2-54-77-134-126.eu-west-1.compute.amazonaws.com:8080/w3w';

// -- Global functions

function p2ll(p)
{
  var ll = p.toString();
  var n = ll.indexOf(','); 
  var lat = ll.slice(1, n);
  var lon = ll.slice(n+2, ll.length-1);
  return [lat, lon];
}

function link_login()
{
  hideSplash();
  Popup.loadPopup('login', undefined, true);
}

function link_signup()
{
  hideSplash();
  Popup.loadPopup('signup');
}

function link_back() 
{
  history.go(-1);
}

function hideSplash()
{
  $('#map .splash').fadeOut(150); 
}

trimLeft = function(string, charlist) {
  if (charlist === undefined)
  charlist = "\s";

  return string.replace(new RegExp("^[" + charlist + "]+"), "");
};

// -- Sharebox

var Sharebox = new function() {
  this.showing = false;   
  this.sharebox = $('#sharebox');
  this.words = null;
  this.position_string = null;
  
  this.populate = function (words, lat, lng, oneword) {
    if (!words || !lat || !lng)
      return;
    
    while (lng > 180) lng -= 360;
    while (lng < -180) lng += 360;
    
    this.words = words;
    this.position_string = lat.toFixed(6) + ',' + lng.toFixed(6);

    var title = ($('html').hasClass('oneword')) ? 'Share OneWord location' : 'Share 3 word location';

    Sharebox.sharebox.find('h2').html(title);
    Sharebox.sharebox.find('.link').focus();
    Sharebox.sharebox.find('.link').val('http://w3w.co/' + this.words);
    Sharebox.sharebox.find('.facebook').attr('href', 'http://www.facebook.com/sharer.php?u=http://map.what3words.com/' + this.words).attr('onclick', "javascript:window.open(this.href,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')");
    Sharebox.sharebox.find('.twitter').attr('href', 'http://twitter.com/share?url=http://w3w.co/' + this.words + '&hashtags=what3words').attr('onclick', "javascript:window.open(this.href,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')");
    Sharebox.sharebox.find('.googleplus').attr('href', 'https://plus.google.com/share?url=http://w3w.co/' + this.words).attr('onclick', "javascript:window.open(this.href,'', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600')");

    if (Map.language === 'ru') {
      Sharebox.sharebox.find('.googlemaps').attr('title', 'Yandex Maps');
      Sharebox.sharebox.find('.googlemaps').attr('href', 'http://maps.yandex.com?text=' + this.position_string);
      Sharebox.sharebox.find('.googlemaps').children('img').attr('src', '/images/popup/maps-yandex.png');
    } else {
      Sharebox.sharebox.find('.googlemaps').attr('title', 'Google Maps');
      Sharebox.sharebox.find('.googlemaps').attr('href', 'http://maps.google.co.uk?q=' + this.position_string);
      Sharebox.sharebox.find('.googlemaps').children('img').attr('src', '/images/popup/maps.png');
    }

    if (words.length > 33) {
      Sharebox.sharebox.find('.link').addClass('long-words');
    }
    if (typeof oneword !== 'undefined') {
      Sharebox.sharebox.find('.bottom').hide();
      Sharebox.sharebox.css('padding-bottom', 20);
    }
  };
  
  this.toggle = function () { if (Sharebox.showing) Sharebox.hide(); else Sharebox.show(); };
  
  this.show = function (words, lat, lng, oneword) {
    Sharebox.populate(words, lat, lng, oneword);
    Sharebox.showing = true; 
    Sharebox.sharebox.stop().css({ display: 'block' });
    Sharebox.sharebox.fadeTo(150, 1).find('.link').select(); 
  };
  
  this.hide = function () { 
    Sharebox.showing = false; 
    Sharebox.sharebox.stop().fadeTo(100, 0, function () { 
      $(this).css({ display: 'none' }); 
    }); 
  };
  
  // --
  
  $('.close', this.sharebox).click(function() {
    Sharebox.hide();
    showShareboxOnPinMove = false;
  });
  
  $('.email', this.sharebox).click(function(e) {
    e.preventDefault();
    ga('send', 'event', 'Action', 'sharebox_click_email');
    Popup.loadPopup('email', { words: Sharebox.words });
  });
  
  $('.gps', this.sharebox).click(function(e) {
    e.preventDefault();
    ga('send', 'event', 'Action', 'sharebox_click_gps');
    Popup.loadPopup('satnav', { position: Sharebox.position_string, words: Sharebox.words });
  });
  
  $('.embed', this.sharebox).click(function(e) {
    e.preventDefault();
    Popup.loadPopup('embed', { words: Sharebox.words });
  });
  
  $('.oneword', this.sharebox).click(function(e) {
    e.preventDefault();
    ga('send', 'event', 'Action', 'sharebox_click_tryoneword');
    Popup.loadPopup('oneword', Sharebox.position_string, true);
  });
  
};

window.mobilecheck = function() {
  var check = false;
  (function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
} 


// -- Generic handlers

(function () {

  if (window.devicePixelRatio >= 2) {

    $('.menu-main img').attr('src', '/images/head/w3w_NewLogo@2x.png');

  }

  window.onresize = function(event) {
       if ($(window).width() > 760) {
        $('nav ul').show();
       }
  };

  var collapse        = $('#collapse');  
        menu        = $('nav ul');  
        menuHeight  = menu.height();
        menuIcon = $('#head .menu-main');  
      toggled = true;

    $(collapse).on('click', function(e) {  
        e.preventDefault();
        menu.toggleClass('view-height');  
        menu.slideToggle();
        if (toggled) {
           menuIcon.hide();
        }
        else {
          setTimeout(function(){
                 menuIcon.fadeIn('200');
          }, 500);   
        }

       toggled = !toggled;

       $('#head span.language ').hover(function(event) {
        event.preventDefault();

        $(this).find('.dropdown').toggle();

       });

    });


  $('#download-app').click(function(e){
    e.preventDefault();
    Popup.loadPopup('download-app', null, true);
  });

  $(document).on('click', '.open-maps', function(e){
    e.preventDefault();
    
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1;
    var isMobile = ua.indexOf("mobile") > -1;

    var citymapperOk = true;
    
    $.ajax({
      url: '/citymapper',
      dataType: "json",
      async: false,
      success: function(citymapper){
        var ps = Map.geoMarker.getPosition();
        var pe = Words.getPosition();
        var lls = p2ll(ps);
        var lle = p2ll(pe);
        for (i = 0; i < Object.keys(citymapper).length; i++) if ( (lls[0] >= parseFloat(citymapper[i].slat) && lls[0] <= parseFloat(citymapper[i].nlat) && lls[1] >= parseFloat(citymapper[i].wlng) && lls[1] <= parseFloat(citymapper[i].elng)) && (lle[0] >= parseFloat(citymapper[i].slat) && lle[0] <= parseFloat(citymapper[i].nlat) && lle[1] >= parseFloat(citymapper[i].wlng) && lle[1] <= parseFloat(citymapper[i].elng)) ) citymapperOk = true;
      }
    });
    
    var googleLine = '<tr><td><img src="/images/map/navigate/Google-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes google-maps" href="#" target="routes">Google Maps</a></div></td></tr>';
    var bingLine = (!navigator.userAgent.match(/iPhone/i) && !(isAndroid && isMobile)) ? '<tr><td><img src="/images/map/navigate/Bing-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes bing-maps" href="#" target="routes">Bing Maps</a></div></td></tr>' : '';
    var appleLine = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? '<tr><td><img src="/images/map/navigate/Apple-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes apple-maps" href="#" target="routes">Apple Maps</a></div></td></tr>' : '';
    var citymapperLine = citymapperOk && (navigator.userAgent.match(/iPhone/i) || (isAndroid && isMobile) || true) ? '<tr><td><img src="/images/map/navigate/Citymapper-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes citymapper" href="#" target="routes">Citymapper</a></div></td></tr>' : '';
    var yandexLine = (currentLanguage == 'ru' || Map.language == 'ru') ? '<tr><td><img src="/images/map/navigate/Yandex-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes yandex-maps" href="#" target="routes">Yandex Maps</a></div></td></tr>' : '';

    Popup.showPopup('<div class="inner"><p>' + transOpenNav + ':</p>' + 
    '<table style="margin:auto;">' + 
    googleLine + 
    bingLine + 
    appleLine + 
    citymapperLine + 
    yandexLine + 
    '</table>' + 
    '<div class="button-row"><a style="padding: 0 15px" class="button dark no" href="#">Cancel</a></div>' + 
    '</div>', 'generic gmapsconf', true);
    
    var confirmHandler = function(e) {
      if ($(e.target).hasClass('no'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
      }
      if ($(e.target).hasClass('google-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ua = navigator.userAgent.toLowerCase();
          var isAndroid = ua.indexOf("android") > -1;
          
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          if ($.browser.mozilla || isAndroid)
          {
            window.open('https://www.google.co.uk/maps/dir/' + ps.toString() + '/' + pe.toString() + '/', 'routes');
          }
          else
          {
            // window.open('comgooglemaps://?saddr=' + ps.toString() + '&daddr=' + pe.toString(), 'routes');
            // window.open('comgooglemaps://?daddr=' + pe.toString(), 'routes');
            setTimeout(function(){
              window.open('https://www.google.co.uk/maps/dir/' + ps.toString() + '/' + pe.toString() + '/', 'routes');
            }, 800);
          }
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('bing-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
                    
          window.open('http://bing.com/maps/default.aspx?rtp=pos.' + lls[0] + '_' + lls[1] + '~pos.' + lle[0] + '_' + lle[1], 'routes');
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('apple-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
          
          // window.open('http://maps.apple.com/?saddr=' + lls[0] + ',' + lls[1] + '&daddr=' + lle[0] + ',' + lle[1], 'routes');
          window.open('http://maps.apple.com/maps?daddr=' + lle[0] + ',' + lle[1], 'routes');
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('citymapper'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
          
          // window.open('citymapper://directions?startcoord=' + lls[0] + ',' + lls[1] + '&endcoord=' + lle[0] + ',' + lle[1], 'routes');
          setTimeout(function(){
            window.open('http://citymapper.com/directions?startcoord=' + lls[0] + ',' + lls[1] + '&endcoord=' + lle[0] + ',' + lle[1], 'routes');
          }, 800);
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('yandex-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
          
          window.open('http://maps.yandex.com/?rtext=' + lls[0] + ',' + lls[1] + '~' + lle[0] + ',' + lle[1] + '&rtm=atm&source=route&l=map', 'routes');
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
    };
    
    $(document).on('click', '.popup.gmapsconf', confirmHandler);

    /*
    if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined') {
      var startPos = Map.geoMarker.getPosition();
      var endPos = Words.getPosition();
      window.location = 'comgooglemaps://?saddr=' + startPos.toString() + '&daddr=' + endPos.toString();
      setTimeout(function(){
        window.open('https://www.google.co.uk/maps/dir/' + startPos.toString() + '/' + endPos.toString() + '/', '_blank'); 
      }, 1000);
    }
    */
  });
  $(document).on('click', '#map .directions-menu .google-maps', function(e){
    e.preventDefault();
    
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1;
    var isMobile = ua.indexOf("mobile") > -1;
    
    var citymapperOk = false;
    
    $.ajax({
      url: '/citymapper',
      dataType: "json",
      async: false,
      success: function(citymapper){
        var ps = Map.geoMarker.getPosition();
        var pe = Words.getPosition();
        var lls = p2ll(ps);
        var lle = p2ll(pe);
        for (i = 0; i < Object.keys(citymapper).length; i++) if ( (lls[0] >= parseFloat(citymapper[i].slat) && lls[0] <= parseFloat(citymapper[i].nlat) && lls[1] >= parseFloat(citymapper[i].wlng) && lls[1] <= parseFloat(citymapper[i].elng)) && (lle[0] >= parseFloat(citymapper[i].slat) && lle[0] <= parseFloat(citymapper[i].nlat) && lle[1] >= parseFloat(citymapper[i].wlng) && lle[1] <= parseFloat(citymapper[i].elng)) ) citymapperOk = true;
      }
    });
    
    var googleLine = '<tr><td><img src="/images/map/navigate/Google-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes google-maps" href="#" target="routes">Google Maps</a></div></td></tr>';
    var bingLine = (!navigator.userAgent.match(/iPhone/i) && !(isAndroid && isMobile)) ? '<tr><td><img src="/images/map/navigate/Bing-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes bing-maps" href="#" target="routes">Bing Maps</a></div></td></tr>' : '';
    var appleLine = (navigator.userAgent.match(/iPhone|iPad|iPod/i)) ? '<tr><td><img src="/images/map/navigate/Apple-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes apple-maps" href="#" target="routes">Apple Maps</a></div></td></tr>' : '';
    var citymapperLine = citymapperOk && (navigator.userAgent.match(/iPhone/i) || (isAndroid && isMobile) || true) ? '<tr><td><img src="/images/map/navigate/Citymapper-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes citymapper" href="#" target="routes">Citymapper</a></div></td></tr>' : '';
    var yandexLine = (currentLanguage == 'ru' || Map.language == 'ru') ? '<tr><td><img src="/images/map/navigate/Yandex-Maps-Icon.png" class="nav-maps"></td><td><div class="button-row"><a style="padding: 0 15px;" class="button yes yandex-maps" href="#" target="routes">Yandex Maps</a></div></td></tr>' : '';

    Popup.showPopup('<div class="inner"><p>' + transOpenNav + ':</p>' + 
    '<table style="margin:auto;">' + 
    googleLine + 
    bingLine + 
    appleLine + 
    citymapperLine + 
    yandexLine + 
    '</table>' + 
    '<div class="button-row"><a style="padding: 0 15px" class="button dark no" href="#">Cancel</a></div>' + 
    '</div>', 'generic gmapsconf', true);
    
    var confirmHandler = function(e) {
      if ($(e.target).hasClass('no'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
      }
      if ($(e.target).hasClass('google-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ua = navigator.userAgent.toLowerCase();
          var isAndroid = ua.indexOf("android") > -1;
          
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          if ($.browser.mozilla || isAndroid)
          {
            window.open('https://www.google.co.uk/maps/dir/' + ps.toString() + '/' + pe.toString() + '/', 'routes');
          }
          else
          {
            // window.open('comgooglemaps://?saddr=' + ps.toString() + '&daddr=' + pe.toString(), 'routes');
            window.open('comgooglemaps://?daddr=' + pe.toString(), 'routes');
            setTimeout(function(){
              window.open('https://www.google.co.uk/maps/dir/' + ps.toString() + '/' + pe.toString() + '/', 'routes');
            }, 800);
          }
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('bing-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
                    
          window.open('http://bing.com/maps/default.aspx?rtp=pos.' + lls[0] + '_' + lls[1] + '~pos.' + lle[0] + '_' + lle[1], 'routes');
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('apple-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
          
          // window.open('http://maps.apple.com/?saddr=' + lls[0] + ',' + lls[1] + '&daddr=' + lle[0] + ',' + lle[1], 'routes');
          window.open('http://maps.apple.com/maps?daddr=' + lle[0] + ',' + lle[1], 'routes');
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('citymapper'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
          
          window.open('citymapper://directions?startcoord=' + lls[0] + ',' + lls[1] + '&endcoord=' + lle[0] + ',' + lle[1], 'routes');
          setTimeout(function(){
            window.open('http://citymapper.com/directions?startcoord=' + lls[0] + ',' + lls[1] + '&endcoord=' + lle[0] + ',' + lle[1], 'routes');
          }, 800);
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
      if ($(e.target).hasClass('yandex-maps'))
      {
        e.preventDefault();
        Popup.hidePopupGeneral();
        if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined')
        {
          var ps = Map.geoMarker.getPosition();
          var pe = Words.getPosition();
          
          var lls = p2ll(ps);
          var lle = p2ll(pe);
          
          window.open('http://maps.yandex.com/?rtext=' + lls[0] + ',' + lls[1] + '~' + lle[0] + ',' + lle[1] + '&rtm=atm&source=route&l=map', 'routes');
        }
        else
        {
          Popup.hidePopupGeneral();
        }
      }
    };
    
    $(document).on('click', '.popup.gmapsconf', confirmHandler);

    /*
    if (typeof Map.geoMarker !== 'undefined' && typeof Words !== 'undefined') {
      var startPos = Map.geoMarker.getPosition();
      var endPos = Words.getPosition();
      window.location = 'comgooglemaps://?saddr=' + startPos.toString() + '&daddr=' + endPos.toString();
      setTimeout(function(){
        window.open('https://www.google.co.uk/maps/dir/' + startPos.toString() + '/' + endPos.toString() + '/', '_blank'); 
      }, 1000);
    }
    */
  });
        
  // -- Global
  
  $('.tooltip-icon').each(function(index){
    $(this).data('index', index);
  });
  
  window.hoverTimeout = new Array();
    
  $('.tooltip-icon').hover(function(){
    var uid = $(this).data('index');
    
    for (var i in window.hoverTimeout) {
      if (window.hoverTimeout[i].index === uid) {
        window.clearTimeout(window.hoverTimeout[i].ref);
      }
    }
    
    var tooltip = $('.tooltip-' + uid);
    if (!tooltip.length) {
      var info = $(this).data('info');
      
      $('.tooltip').remove();
      tooltip = $('<div class="tooltip tooltip-' + uid + '"></div>');
      tooltip.html(info);
      tooltip.data('index', uid);
      $('body').append(tooltip);
      tooltip.css({position: 'absolute', top: $(this).offset().top, left: ($(this).offset().left + $(this).outerWidth() + 5) }).fadeIn(200);
      return;
    }
    tooltip.fadeIn(200);
    
  }, function(){
    var el = $(this);
    var uid = el.data('index');
    var tooltip = $('.tooltip-' + uid);
    
    var ref = window.setTimeout(function(){
      tooltip.fadeOut(200);
      tooltip.remove();
      
      for (var i in window.hoverTimeout) {
        if (window.hoverTimeout[i].index === uid) {
          window.hoverTimeout.splice(i, 1);
        }
      }
    }, 200);
    window.hoverTimeout.push({index: uid, ref: ref});
  });
  
  $(document).on('mouseenter', '.tooltip', function(){
    var uid = $(this).data('index');
    for (var i in window.hoverTimeout) {
      if (window.hoverTimeout[i].index === uid) {
        window.clearTimeout(window.hoverTimeout[i].ref);
      }
    }
  });
  $(document).on('mouseleave', '.tooltip', function(){
    var tooltip = $(this);
    var uid = tooltip.data('index');
    
    var ref = window.setTimeout(function(){
      tooltip.fadeOut(200);
      tooltip.remove();
      
      for (var i in window.hoverTimeout) {
        if (window.hoverTimeout[i].index === uid) {
          window.hoverTimeout.splice(i, 1);
        }
      }
    }, 200);
    window.hoverTimeout.push({index: uid, ref: ref});
  });

  $('.tooltip-icon').click(function(e){
    if (!$(this).hasClass('allow-click')) {
      e.preventDefault();
    }
  });
  
  $('.contact').click(function (e) {
    e.preventDefault();
    Popup.loadPopup('contact', undefined, true);
  });
  
  $('.grant-admin').click(function(e){
    e.preventDefault();
    var el = $(this);
    var user_id = el.data('user');
    
    $.get('/grant-admin/' + user_id, function(response){
      if (typeof response === 'undefined' || typeof response.status === 'undefined' || response.status === 0) {
        if (typeof response.error === 'undefined') { response.error = 'General error'; }
        alert("The following error occurred:\n" + response.error)
        return;
      }
      el.remove();
    }, 'JSON');
  });
  
  $('.claim-user').click(function(e){
    e.preventDefault();
    var el = $(this);
    var user_id = el.data('user');
    
    $.get('/claim-user/' + user_id, function(response){
      if (typeof response === 'undefined' || typeof response.status === 'undefined' || response.status === 0) {
        if (typeof response.error === 'undefined') { response.error = 'General error'; }
        alert("The following error occurred:\n" + response.error)
        return;
      }
      var cell = el.parents('td');
      cell.html('');
      if (response.status == 1 && typeof response.name !== 'undefined') {
        cell.html(response.name);
      }
    }, 'JSON');
  });
  
  $('.page-index a').click(function(e) {
    e.preventDefault(); 
    $('html, body').animate({ scrollTop: $('#index-' + $(this).data('index')).offset().top - 50 }, 500);
  });
  
  $('.to-top').click(function(e) { 
    e.preventDefault(); 
    $('html, body').animate({ scrollTop: 0 }, 500); 
  });
  
  
  
  // -- Head
  
  $('#head .login').click(function (e) {
    e.preventDefault();
    Popup.loadPopup('login', undefined, true);
  });
  
  $('#head .menu-toggle').click(function (e) {
    $('html').removeClass('search-active'); 
    $('html').toggleClass('menu-active');
    if (!$('html').hasClass('menu-active')) {
      $('.menu-mobile .submenu').css({display: 'none'});
    }
  });
  $('#head .menu-search-toggle').click(function (e) {
    if (!$('html').hasClass('search-active')) {
      $('.menu-search').one("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
        $('.menu-search input[name=words]').focus();
      });
    } else {
      $('.menu-search input[name=words]').val('')
    }
    $('html').removeClass('menu-active'); 
    $('html').toggleClass('search-active'); 
  });
  
  $('.menu-mobile').on('click', '.dropdown > a', function (e) {
    e.preventDefault();
    $(this).next().toggle();
  });
  
  $('.menu-search .oneword').click(function(e){
    e.preventDefault();
    var searchInput = $(this).siblings('form').find('input[name=words]');
    if (searchInput.val().indexOf('*') !== -1) {
      searchInput.val(trimLeft(searchInput.val(), '*'));
    } else {
      searchInput.val('*' + trimLeft(searchInput.val(), '*'));
    }
    searchInput.focus();
  });
  
  /*
  $('#head').each(function () {
    var w = 0;
    $(this).children().each(function () { w += $(this).outerWidth(); });
    $(this).css({ 'min-width': w });
  });
  */
  
  // -- Splash
  
  $('#map .splash .show-location').click(function(e){ e.preventDefault(); hideSplash(); });
  $('#map .splash .close-splash').click(function(e){ e.preventDefault(); hideSplash(); });
  $('#map .pointer').css({ left: $('#map').width() / 2, top: $('#map').height() / 2 });
  $('#map .pointer').on('mouseover', function () { $(this).fadeOut(200, function () { $(this).remove(); }); });
  
  // -- Side
  
  /*
  $(document).on('click', '.tooltip .example', function(e) {
    e.preventDefault();
    searchTerm = $(this).data('words');
    
    $('.search .text').val(searchTerm);
    $('.search').submit();
  });
  */
  
  $('#side .get-directions').click(function(e) {
    e.preventDefault();
    Directions.setMode('driving');
    Directions.getDirections();
  });
  
  $('#side .reverse-route').click(function(e) {
    e.preventDefault();
    Directions.getDirections(true);
  });
  
  $('#side .travel-type-bicycling').click(function(e) {
    e.preventDefault();
    Directions.setMode('cycling');
    Directions.getDirections();
  });
  
  $('#side .travel-type-transit').click(function(e) {
    e.preventDefault();
    Directions.setMode('public');
    Directions.getDirections();
  });
  
  $('#side .travel-type-walking').click(function(e) {
    e.preventDefault();
    Directions.setMode('walking');
    Directions.getDirections();
  });
  
  var hoverTimeout = null;

  
  $('.change-three-word-lang').click(function(e){
    e.preventDefault();
    Popup.loadPopup('change-word-language', {language: Map.language, words: Wordbar.showWords()});
  });
  
  $(document).on('input', 'form.search input[name=words]', function(){
    var _input = $(this);
    if (_input.val().length < 3) return;
  });
  
  $(document).on('submit', '.search', function(e) {
    e.preventDefault();
    if (typeof Map !== 'undefined') {
      Map.searchMode = true;
    }
    ga('send', 'event', 'Action', 'search');

    hideSplash();
    Popup.hidePopups();
    Popup.hidePopupGeneral();
    
    if (typeof Directions !== 'undefined' && Directions.active) {
      Directions.close();
    }

    $('#side #error').hide();
    $('.menu-search .error').hide();

    searchTerm = $(this).find('.w3w-search').val();
    var searchField = $(this).find('.text');

    if (typeof Map === 'undefined' || typeof Map.map === 'undefined') {
      location.href = '/' + searchTerm;
      return;
    }

    var bounds = Map.map.geographicExtent;
    var boundsCentre = bounds.getCenter().getLatitude() + ',' + bounds.getCenter().getLongitude();

    OneWordPassword = '';
    if (typeof passwordEntered != 'undefined') OneWordPassword = passwordEntered;

    $.get(root + '/search/' + searchTerm, { centre: boundsCentre, lang: Map.language, password: OneWordPassword, autocomplete: $(this).find('input[name=autocomplete]').val() }, function(res) {
      if (res.hasOwnProperty('error') || (res.type === 'search' && res.lat === 0 && res.lng === 0)) {
        if (res.error == 1) {
          Popup.loadPopup('error', res, true);
        } else {
          $('#side #error').show();
          $('#side #info').hide();
          $('#side #error .text').text(searchTerm);

          $('.menu-search .error').show();
          $('.menu-search .error .text').text(searchTerm);
        }
        return;
      }
      else if (res.type == 'oneword' && res.private == 1) {
        if (typeof notFirstAttempt == 'undefined') notFirstAttempt = false;
        Popup.loadPopup('private', { notFirstAttempt: notFirstAttempt}, true);
      } else {
        searchField.val('');
        $('html').removeClass('search-active'); 

        if (res.type == 'oneword') {
          searchTerm = res.text;
        } else {
          if (typeof res.language !== 'undefined' && res.language !== Map.language) {
            Map.language = res.language;
          }
        }

        if (typeof Map.editing === 'undefined') {
          if (typeof window.history.pushState == 'function')
            window.history.pushState('string', searchTerm, '/' + searchTerm.replace(/ /g,'+'));
        }
        else {
          $('#infobox .save').removeAttr('disabled'); 
          $('#infobox .save').removeClass('disabled');
          $('#infobox .return').removeAttr('disabled'); 
          $('#infobox .return').removeClass('disabled');
        }

        $('#side .search .text').val(searchTerm);

        Map.setPosition(res.lat, res.lng); 

        if (res.type != 'oneword' && res.type != 'w3w' && res.type != 'position') {
          Map.setMode(Map.mapModes.CENTER);
        } else {
          Map.setMode(Map.mapModes.FIXED);
        }

        Words.words = res.text;
        Words.oneword = (res.type == 'oneword') ? true : false;
        Words.latitude = res.lat;
        Words.longitude = res.lng;
        Words.info = (res.hasOwnProperty('info')) ? res.info : null;

        Words.appendToHistory();
        Words.display();

        Map.searchMode = false;
      }
    }, 'json');
  });
}());

Sharebox.sharebox.find('.facebook').click(function(e) { e.preventDefault(); ga('send', 'event', 'Action', 'sharebox_click_facebook'); });
Sharebox.sharebox.find('.twitter').click(function(e)  { e.preventDefault(); ga('send', 'event', 'Action', 'sharebox_click_twitter'); });
Sharebox.sharebox.find('.googleplus').click(function(e) { e.preventDefault(); ga('send', 'event', 'Action', 'sharebox_click_gplus');  });

function resetExamples()
{

}

function elapsedHR(seconds, precision) {

  if (typeof precision === 'undefined') precision = 0;
  var output = Array();

  var temp = seconds;
  var years = Math.floor(temp / 31536000);
  if (years) {
    output.push(years + ' y');
  }
  if (precision === 4) { return output.join(" "); }
  var days = Math.floor((temp %= 31536000) / 86400);
  if (days) {
    output.push(days + 'd');
  }
  if (precision === 3) { return output.join(" "); }
  var hours = Math.floor((temp %= 86400) / 3600);
  if (hours) {
    output.push(hours + 'hr');
  }
  if (precision === 2 || days) { return output.join(" "); }
  var minutes = Math.floor((temp %= 3600) / 60);
  if (minutes) {
    output.push(minutes + 'm');
  }
  if (precision === 1) { return output.join(" "); }
  
  var seconds = temp % 60;
  if (seconds) {
    output.push(seconds + 's');
  }
  
  if (output.length < 1) {
    return 'less then a second';
  }
  else {
    return output.join(" ");
  }
}

function onewordAvailability(oneword, callback)
{
  $.post('/oneword/availability', { oneword: oneword }, function (res) {
    var bool = (res.available === 'available') ? true : false;
    var error = (bool) ? '' : res.available;
    callback.apply(callback, [bool, error]);
  });
}

function lengthInUtf8Bytes(str)
{
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}

// -- Widget generator

function createWidgetGenerator()
{
  html  = '<h1>' + transEmbed + '</h1>';
  html += '<p>' + transWidget + ':<br><label><input type="radio" name="background" value="dark" checked="checked"> ' + transDark + '</label><br><label><input type="radio" name="background" value="light"> ' + transLight + '</label></p>';
  html += '<p>' + transSize + ':<br><label><input type="radio" name="height" value="80" checked="checked"> ' + transLarge + '</label><br><label><input type="radio" name="height" value="60"> ' + transMedium + '</label><br><label><input type="radio" name="height" value="40"> ' + transSmall + '</label></p>';
  html += '<p><a id="embed-preview" href="http://w3w.co/' + widgetString + '" target="_blank"><img src="/calls/embed/' + widgetString + '/dark" height="80"></a></p><p><textarea id="embed-html"><a href="http://w3w.co/' + widgetString + '" target="_blank"><img src="http://what3words.com/calls/embed/' + widgetString + '/dark" height="80"></a></textarea>';
  
  $('.widget-generator').html(html);
  
  $('input[name=background],input[name=height]').change(function(){
    
    backgroundColour = $('input[name=background]:checked').val();
    
    height = $('input[name=height]:checked').val();
    
    $('#embed-preview img').prop('src', '/calls/embed/' + widgetString + '/' + backgroundColour);
    $('#embed-preview img').prop('height', height);
    
    $('#embed-html').html('<a href="http://w3w.co/' + widgetString  + '" target="_blank"><img src="http://what3words.com/calls/embed/' + widgetString + '/' + backgroundColour + '" height="' + height + '"></a>');
    
  });
}

var rad = function(x) {
  return x * Math.PI / 180;
};
