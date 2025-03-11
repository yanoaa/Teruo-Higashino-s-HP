jQuery(document).bind("mobileinit", function(){
	jQuery.mobile.ajaxEnabled = false;
	jQuery.mobile.hashListeningEnabled = false;
	jQuery.mobile.loadingMessageTextVisible = true;
	jQuery.mobile.pushStateEnabled = false;
	jQuery.mobile.defaultPageTransition = 'flip';
	jQuery.mobile.loadingMessageTextVisible = true;
	jQuery.mobile.loadingMessage = 'ロード中';
	jQuery.mobile.pageLoadErrorMessage = 'ページの読み込みに失敗しました';
	jQuery.mobile.page.prototype.options.backBtnText = '戻る';
	jQuery.mobile.dialog.prototype.options.closeBtnText = '閉じる';
	jQuery.mobile.selectmenu.prototype.options.closeText= '閉じる';
});

/**
 jQuery Mobileに読み込まれる前の初期化処理
 **/
jQuery(document).bind("pagebeforecreate", function(){
	// page
	jQuery('#page').attr('data-theme', 'a');
	
	var indexBlocks = [];
	
	// block
	jQuery('.block').each(function(){
		var blk = jQuery(this);
		
		// LiVE Connect
		var liveframe = blk.find('iframe.live-ifrm');
		if (liveframe.length > 0) {
			liveframe.before('<span class="jqm-nolive">スマートフォン向けテンプレートではLiVE Connectは使用できません。</span>');
			liveframe.remove();
		}
		
		// listview
		jQuery("ul:jqmData(role='listview')").each(function(){
			jQuery(this).attr('data-inset', 'true').attr('data-theme', 'a');
		});
		
		// index
		if (blk.hasClass('index')) {
			indexBlocks.push(blk);
			
		// album
		} else if (blk.hasClass('album')) {
			jQuery("a:jqmData(role='button')").each(function(){
				this.removeAttribute('data-role');
			});
			
		// tab, accordion
		} else if (blk.hasClass('tab') || blk.hasClass('accordion')) {
			jQuery('.column', blk).each(function(){
				var root = jQuery(this),
					set = jQuery('<div data-role="collapsible-set">').appendTo(root);
				jQuery('div.h2', this).each(function(){
					var bar = jQuery('<div data-role="collapsible">'),
						h2 = jQuery(this);
					// if no contents, dummy div
					var contents = ((h2.next().html() != "") && (typeof(h2.next().attr('data-role')) == 'undefined')) ? h2.next() : jQuery('<div />');
					bar.append(contents);
					bar.prepend(h2.children());
					set.append(bar);
				});
			});
		}
	});
	
	if (indexBlocks.length > 0) {
		var resizeFunc = function() {
			var winW = window.innerWidth;
			for (var i=0,l=indexBlocks.length; i<l; i++) {
				var blk = jQuery(indexBlocks[ i ]),
					cols = blk.find('.column'),
					lhm = cols.parent(),
					totalW = bd.util.cssNum(lhm.css('padding-left')) + bd.util.cssNum(lhm.css('padding-right'));
				cols.each(function(){
					var w = jQuery(this).outerWidth(true);
					if (totalW+w > winW) {
						if (totalW < w) totalW += w;
						return;
					}
					totalW += w;
				});
				lhm.css({
					'width': totalW + 'px',
					'margin-left': 'auto',
					'margin-right': 'auto'
				});
			}
		};
		jQuery(window).bind('resize load', resizeFunc);
	}
	
	// side
	jQuery('#area-side-a').remove();
	jQuery('#area-side-b').remove();
	
	// footer
	jQuery('#area-footer').attr('data-role', 'footer');
	jQuery('#blank-footer').remove();
	
});
