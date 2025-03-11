/* load.js
  - Loading order
--------------------------------------------------------- */
jQuery.noConflict();
jQuery.ajaxSetup({scriptCharset:'utf-8'});

// domready
jQuery(document).ready(function() {
	// disable google map. when ie local.
	if (bindobj.ie && (window.location.protocol=='file:' || bindobj.isCloud)) {
		jQuery('iframe').each(function(){
			var w = this.width, h = this.height;
			if (bindobj.ie90 && this.src.match("https?://maps.google.") != null) {
				jQuery('<div>Googleマップは公開サーバーにアップロードすると表示されます。</div>').css({
					width:w,
					height:h,
					display: 'block',
					color: '#000',
					background: '#fff',
					border: '1px solid #000'
				}).insertAfter(this);
				jQuery(this).remove();
				
			} else if (this.className.indexOf('live-ifrm') > -1) {
				var msg = jQuery('<div>LiVE Connectパーツは<br>アップロードすると表示されます。</div>').css({
					color:'#fff', width:220, height:200, marginLeft:'auto', marginRight:'auto', marginTop:h/2+100
				});
				jQuery('<div>').css({
					width:w,
					height:h,
					display: 'inline-block',
					color: '#000',
					background: '#666 url(' + bindobj.moduleroot + '/js/parts/live_connect.png) center center no-repeat'
				}).append(msg).insertAfter(this);
				jQuery(this).remove();
			}
		});
	}
	
	// cssskin
	if (typeof(bdCssNames) != 'undefined') {
		var len = bdCssNames.area.length;
		for (var i=0; i<len; i++) bd.util.addCss(bindobj.siteroot + bdCssNames.area[ i ]);
		len = bdCssNames.block.length;
		for (var i=0; i<len; i++) bd.util.addCss(bindobj.siteroot + bdCssNames.block[ i ]);
	}
	
	////////// parts
	if (bindobj.printstate) Bindprint.control();
	else Bindprint.set();
	
	////////// blockeditor
	if (bindobj.isLocal && !bindobj.ie52) BindApp.onload();
	
	////////// fx
	if (!bindobj.printstate) initFx();
});

// onload
jQuery(window).load(function(){
	////////// for legacy browser
	legacyCheck();
	
	////////// fixed area
	fixedController();
	
	////////// clear margin if no content
	clearNoContentMargin();
	
	////////// set body min-width
	if (bindobj.iphone || bindobj.ipad || bindobj.android) setBodyWidth();
	
	////////// onload hash scroll
	////////// for ie to using BiND Cart
	if (bindobj.ie && (jQuery('span.bind_cart').size() > 0 || jQuery('div.cartblock').size() > 0))
		setTimeout(function(){fixBodyScrollPosition()}, 1000);
	else
		fixBodyScrollPosition();
	
	////////// set footer
	Bindfooter.set();
	
	// reload
	setTimeout(function(){bd.util.bdRefresh()}, 400);
});

function fixedController() {
	var $win = jQuery(window),
		$header = jQuery('#area-header'),
		$footer = jQuery('#area-footer'),
		$sideA = jQuery('#area-side-a'),
		$sideB = jQuery('#area-side-b'),
		$contents = jQuery('#area-contents'),
		isHeaderFloat = false,
		isFooterFloat = false,
		isFirstView = true,
		isEditMode = bd.util.onEditBlock();
		
	if ( $header.data('float') ) {
		isHeaderFloat = true;
		
		if (isEditMode) {
			$header.css({
				width: '100%'
			});
		} else {
			$header.css({
				position: 'fixed',
				zIndex: 170,
				width: '100%'
			});

			// top margin
			function setBlbrdHeight(){
				var hh = $header.outerHeight(true),
					$blbrd = jQuery('#area-billboard'),
					pos = $blbrd.css('background-position'),
					ary = [];
				
				if (pos == 'undefined' || pos == null || bindobj.ie) {
					ary.push($blbrd[0].currentStyle.backgroundPositionX);
					ary.push($blbrd[0].currentStyle.backgroundPositionY);
				} else {
					ary = pos.split(' ');
				}
				
				$blbrd.css('padding-top', hh + 'px');
				if (ary[1] == '0%' || ary[1] == 'top') $blbrd.css('background-position', ary[0] + ' ' + hh+ 'px');
				if (ary[0] == 'left' && bindobj.ie) $blbrd.css('background-position', ary[0] + ' ' + hh+ 'px');
			}
			setBlbrdHeight();
			// retry
			var retryMills = 400;
			if (bindobj.ie) retryMills = 5000;
			setTimeout(setBlbrdHeight, retryMills);
			
		}
	}
	
	if ( $footer.data('float') ) {
		isFooterFloat = true;
		
		if (isEditMode) {
			$footer.css({
				width: '100%',
				bottom: '0'
			});
		} else {
			$footer.css({
				position:'fixed',
				zIndex: 170,
				width: '100%',
				bottom: '0'
			});
		}
	}
	
	function setSideFloat($side, timer) {
		var $wrap = $side.find('.wrap');
		$side.css('position','relative');
		$wrap.css({
			position: 'absolute',
			top: 0,
			width: $side.width(),
			background: $side.css('background')
		});
		
		$win.scroll(function(e) {
			if (timer > 0) clearTimeout(timer);
			timer = setTimeout( function() {
				var wt = $win.scrollTop();
				if (isHeaderFloat) wt+=$header.outerHeight(true);
				
				var offset = $side.offset().top;
				if (wt > offset) {
					wt-=offset;
				} else {
					wt=0;
				}
				
				var maxH = $contents.height(),
					sideH = $wrap.height();
				if (maxH < sideH + wt) wt = maxH - sideH;
				
				if (wt < 0) {
					wt = 0;
					$contents.height(sideH);
				}
				
				if (isHeaderFloat && isFirstView) {
					wt = 0;
					isFirstView = false;
				}
				
				$wrap.stop().animate({
					top: wt
				},1000,'easeOutExpo');
				
			},100);
		});
	}
	
	if ( $sideA.data('float') ) {
		if (isEditMode == false) {
			var timerA = 0;
			setSideFloat($sideA, timerA);
		}
	}
	
	if ( $sideB.data('float') ) {
		if (isEditMode == false) {
			var timerB = 0;
			setSideFloat($sideB, timerA);
		}
	}
	
	if ( $sideA.data('float') || $sideB.data('float') ) $win.scroll();
}

function setBodyWidth() {
	if (bindobj.isJQueryMobile) return;
	var blks = jQuery('#area-header,#area-billboard,#area-main,#area-footer').find('div.block'),
		maxW = 0;
	for (var i=0,l=blks.length; i<l; i++) {
		var blk = jQuery(blks[ i ]),
			w = blk.outerWidth(true),
			cssW = bd.util.cssNum(blk.css('width'));
		if (cssW > w) w = cssW;
		
		var div = blk.children('div');
		w = div.outerWidth(true);
		cssW = bd.util.cssNum(div.css('width'));
		if (cssW > w) w = cssW;
		
		if (w > maxW) maxW = w;
	}
	if (maxW > 0) {
		jQuery(document.body).css('min-width', maxW + 'px');
		if (bindobj.ipad) {
			jQuery('<meta name="viewport" content="width=' + maxW + '">').appendTo("head");
		}
		jQuery(window).resize();
	}
}

function fixBodyScrollPosition() {
	var h = window.location.hash;
	if (h.length>0) {
		var target = jQuery(h);
		if (target.length>0) scrollBody(target[0]);
	}
}

function clearNoContentMargin() {
	jQuery('div.column.nocontents').each(function(){
		var prt = jQuery(this).parent();
		prt.removeClass('mgn');
		prt.removeClass('mgn-n');
		prt.removeClass('mgn-w');
		prt.removeClass('mgn-xw');
	});
}

