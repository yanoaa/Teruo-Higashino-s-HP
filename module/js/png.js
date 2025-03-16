/* png.js
  - Transparent png for IE (6.0)
  Use filter to view transparent png file correctly.
// IE5.5+ PNG Alpha Fix v1.0RC4
// (c) 2004-2005 Angus Turnbull http://www.twinhelix.com
// This is licensed under the CC-GNU LGPL, version 2.1 or later.
// For details, see: http://creativecommons.org/licenses/LGPL/2.1/

2007 digitalstage Inc. http://www.digitalstage.jp/
--------------------------------------------------------- */

clearpng = {
	alphaimageloader: 'DXImageTransform.Microsoft.AlphaImageLoader',
	spacer: bindobj.dir + 'module/js/parts/spacer.gif',
	
	fix: function() {
		if (!bindobj.ie60) return;
		imgs = new Array();
		bgs = new Array();
		
		for (i=0;i<document.all.length;i++) {
			if (document.all(i).tagName=='IMG') if (document.all(i).src.toLowerCase().indexOf('.png')>0) imgs.push(document.all(i));
			if (document.all(i).currentStyle.backgroundImage.toLowerCase().indexOf('.png')>0) bgs.push(document.all(i));
		}
		for (i=0;i<imgs.length;i++) {
			imgs[i].style.filter += 'progid:' + clearpng.alphaimageloader + '(src="' + imgs[i].src + '",sizingMeghod="scale")';
			imgs[i].src = clearpng.spacer + '?png=' + imgs[i].src;
		}
		for (i=0;i<bgs.length;i++) {
			bg = bgs[i].currentStyle.backgroundImage.replace(/^url[('"]+(.*\.png)[)'"]+$/,'$1');
			method = bgs[i].currentStyle.backgroundRepeat=='no-repeat' ? 'crop' : 'scale';
			if (bgs[i].filters[clearpng.alphaimageloader]) {
				fil = bgs[i].filters[clearpng.alphaimageloader];
				fil.Enabled = true;
				fil.src = bg;
				fil.sizingMethod = method;
			}
			else bgs[i].style.filter = 'progid:' + clearpng.alphaimageloader + '(src="' + bg + '",sizingMethod=' + method + '")';
			bgs[i].style.zoom = 1;
			if (bgs[i].parentElement.href) bgs[i].style.cursor = 'pointer';
			bgs[i].style.backgroundImage = 'none';
		}
	},
	
	fixone: function(e) {
		if (!bindobj.ie60) return;
		// img
		if (e.tagName=='IMG' && e.src.toLowerCase().indexOf('.png')>0) {
			e.style.filter += 'progid:' + clearpng.alphaimageloader + '(src="' + e.src + '",sizingMeghod="scale")';
			e.src = clearpng.spacer + '?png=' + e.src;
			
		// css background
		} else if (e.currentStyle && e.currentStyle.backgroundImage.toLowerCase().indexOf('.png')>0) {
			var bg = e.currentStyle.backgroundImage.replace(/^url[('"]+(.*\.png)[)'"]+$/,'$1');
			var method = e.currentStyle.backgroundRepeat=='no-repeat' ? 'crop' : 'scale';
			if (e.filters[clearpng.alphaimageloader]) {
				fil = e.filters[clearpng.alphaimageloader];
				fil.Enabled = true;
				fil.src = bg;
				fil.sizingMethod = method;
			}
			else e.style.filter = 'progid:' + clearpng.alphaimageloader + '(src="' + bg + '",sizingMethod=' + method + '")';
			e.style.zoom = 1;
			if (e.parentElement.href) e.style.cursor = 'pointer';
			e.style.backgroundImage = 'none';
		}
	}
}
