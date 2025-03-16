	/* blockeditor.js
	(C) 2007-2014 digitalstage inc.
	v 20140306
	--------------------------------------------------------- */

	////////// BiND application interface object
	var BindApp = {
		isWorking: false,
		isRealBasicView: false,
		onload: function() {
			BindApp.loadCSS();
			if(!bindobj.isCloud) {
				BindApp.isRealBasicView = true;
				BindApp.call("onload");
				if (!BindApp.isWorking) {
					var ua = navigator.userAgent.toLowerCase();
					var fullUrl = ua.indexOf("msie") > -1 ? window.location.toString() : document.URL;
					BindApp.isWorking = fullUrl.indexOf("?edit") > -1;
				}
				if (BindApp.isWorking) {
					BlockEdit.set();
					if (window.attachEvent) {
						window.attachEvent('onresize',BlockEdit.resize);
						window.attachEvent('onscroll',BlockEdit.scroll);
					} else if (window.addEventListener) {
						window.addEventListener('resize',BlockEdit.resize,false);
						window.addEventListener('scroll',BlockEdit.scroll,false);
					}
				}
				else BlockEdit = null;
			} else {
				BlockEdit.set();
				if (window.attachEvent) {
					window.attachEvent('onresize',BlockEdit.resize);
					window.attachEvent('onscroll',BlockEdit.scroll);
				} else if (window.addEventListener) {
					window.addEventListener('resize',BlockEdit.resize,false);
					window.addEventListener('scroll',BlockEdit.scroll,false);
				}
				else BlockEdit = null;
			}
		},
		call: function(com, p1, p2, p3) {
			if (p2.indexOf('bk') > -1) {
				// ----> block auth
				if(parent.siteAppvlMode>0){
					var blkdat = jQuery('#'+p2).data('auth');
					// ブロック編集権限無し
					if (blkdat && !blkdat.bkauthedit){
						return;
					}
				}
				// <---- block auth
			}
			if(!bindobj.isCloud) {
				if (navigator.platform.indexOf("Win") != -1) {
					window.location.href = "call:" + com +","+ p1 +","+ p2 +","+ p3;
				} else {
					status = "call:" + com +","+ p1 +","+ p2 +","+ p3;
				}
			} else {
				if (p2.indexOf('bk') > -1) {
					p2 = p2.split("bk")[1];
					if (p1 == 'block_edit')    window.parent.openBlockEditor(p2, 0);	// ツールバー：編集
					if (p1 == 'block_up')      window.parent.upBlock(p2);				// ツールバー：上へ
					if (p1 == 'block_down')    window.parent.downBlock(p2);				// ツールバー：下へ
					if (p1 == 'block_add')     window.parent.addBlock(p2);				// ツールバー：追加
					if (p1 == 'block_copy')    window.parent.copyBlock(p2);				// ツールバー：複製
					if (p1 == 'block_public')  window.parent.publicBlock(p2);			// ツールバー：公開
					if (p1 == 'block_delete')  window.parent.deleteBlock(p2);			// ツールバー：削除
					if ((p1 == 'block_blockcopy')  && (window.parent.keepBlockCopy))   window.parent.keepBlockCopy(p2);outFunc();	// ツールバー：ブロックコピー
					if ((p1 == 'block_blockpaste') && (window.parent.keepBlockPaste))  window.parent.keepBlockPaste(p2);			// ツールバー：ブロックペースト
					//if (p1 == 'block_setting') window.parent.openBlockEditor(p2, 1);	// ツールバー：設定
					if (p1 == 'block_backup')     window.parent.dispBackups(p2);                // ツールバー：追加
					// ----> block auth
					if (p1 == 'block_authedit') window.parent.openBlockAuthEdit(p2, function(){BlockEdit.setAuth();});
					//if (p1 == 'block_approval-s1') window.parent.approvalBlock((p2, 1, function(){BlockEdit.setAuth();});
					if (p1 == 'block_approval-s2') window.parent.approvalBlock(p2, 2, function(){BlockEdit.setAuth();});
					if (p1 == 'block_approval-s3') window.parent.approvalBlock(p2, 3, function(){BlockEdit.setAuth();});
					if (p1 == 'block_approval-s4') window.parent.approvalBlock(p2, 4, function(){BlockEdit.setAuth();});
					//if (p1 == 'block_approval-s5') window.parent.approvalBlock(p2, 5, function(){BlockEdit.setAuth();});
					// <---- block auth 

				}
			}
		},
		loadCSS: function() {
			var tag = document.getElementsByTagName('link')[0];
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.type = 'text/css';
			link.href = parent.ctxpath + 'modules/css/blockEditor.css';
			tag.parentNode.appendChild(link);
		}
	}




	////////// global value set
	var Value = new Object();
	Value.rootDir = bindobj.moduleroot;
	Value.preview = false;
	Value.borderWidth = 2;
	Value.outBackground = '#000';
	Value.outBorder = Value.borderWidth + 'px dashed #000';
	Value.outOutline = Value.borderWidth + 'px dashed #fff';
	Value.outOpacity = new Array('0.0','alpha(opacity=0)');
	Value.outOpacityUnPublic = new Array('0.2','alpha(opacity=20)');
	if(!bindobj.isCloud) {
	  Value.outOpacity = new Array('0.0','alpha(opacity=0)');
	  Value.outOpacityUnPublic = new Array('0.3','alpha(opacity=30)');
	}
//	Value.overBackground = '#390';
//	Value.selectedBackground = '#390';
	Value.selectedBorder = Value.borderWidth + 'px solid #fff';
	Value.selectedOpacity = new Array('0.4','alpha(opacity=40)');
	Value.blocks = new Array();
	Value.covers = new Array();
	Value.wraps = new Array();
	Value.areas = new Array();
	Value.areaCovers = new Array();
	Value.areaTitles = new Array();
	Value.areaOpacity = new Array('0.1','alpha(opacity=10)');
	if(!bindobj.isCloud) Value.areaOpacity = new Array('0.2','alpha(opacity=20)');
	Value.currentblock = '';
	Value.windowWidth = 0;
	Value.topOffset = 0;
	Value.noEdit = ' url(' + Value.rootDir + '/js/blockeditor/hidden_pc.png) no-repeat center center';
	Value.noEditoutBackground = Value.outBackground + Value.noEdit;
	Value.noEditoverBackground = Value.outBackground + Value.noEdit;
	Value.noEditselectedBackground = Value.selectedBackground + Value.noEdit;

	Value.widthMargin = 0;
	Value.heightMargin = 0;

	////////// BlockEdit functions
	var BlockEdit = {
		areas:{
			'area-header':{title:'ヘッダ', color:'#68a5f9', rgba:'rgba(0, 114, 187, 0.0)'},
			'area-billboard':{title:'ビルボード', color:'#ff9f42', rgba:'rgba(248, 147, 33, 0.0)'},
			'area-contents':{title:'コンテンツ', color:'#9e94ed', rgba:'rgba(225, 145, 209, 0.0)'},
			'area-main':{title:'メイン', color:'#91d251', rgba:'rgba(57, 183, 76, 0.0)'},
			'area-side-a':{title:'サイドA', color:'#f77e86', rgba:'rgba(240, 103, 119, 0.0)'},
			'area-side-b':{title:'サイドB', color:'#f77e86', rgba:'rgba(240, 103, 119, 0.0)'},
			'area-footer':{title:'フッタ', color:'#5dd9e4', rgba:'rgba(0, 114, 187, 0.0)'}
		},
		form : null,
		buttons : null,
		backupbuttons : null,
		menus : null,
		backupmenus : null,
		clickable : true,
//		toolbarWidth: 295,
		toolbarWidth: 320,
		e: function(id) {
			return document.getElementById(id);
		},
		t: function(tag) {
			return document.getElementsByTagName(tag);
		},
		send: function(id) {
			var obj = new Object();
			obj.id = BlockEdit.e('bind_form_435eu3').className;
			obj.btn = id;

			BindApp.call("command", obj.btn, obj.id);
		},
		backupList: function(id) {
			var obj = new Object();
			obj.id = BlockEdit.e('bind_form_435eu3').className;
			obj.btn = id;
			BindApp.call("command", obj.btn, obj.id);
		},
		preview: function(flg) {
			Value.preview = flg;
			var blocks = Value.blocks;
			var covers = Value.covers;
			var wraps = Value.wraps;
			if (flg) {
				for (var i=0;i<covers.length;i++) {
					var c = covers[i];
					c.style.display = 'none';
					if (jQuery(c).hasClass('blankblock')) blocks[i].style.height = '0px';
					if (bindobj.ie60) {		//forIE6
						wraps[i].style.display = 'none';
						wraps[i].onmouseover = '';
					}
					else blocks[i].onmouseover = '';
				}
				BlockEdit.form.style.display = 'none';
			}
			else if (!flg) {
				if (Value.covers.length<1) BlockEdit.set();
				for (var i=0;i<covers.length;i++) {
					var c = covers[i];
					c.style.display = 'block';
					if (jQuery(c).hasClass('blankblock')) {
						blocks[i].style.height = '100px';
						c.style.height = '100px';
						c.children[0].style.height = '96px';
						if (bindobj.ie60) wraps[i].height = 100;
					}
				}
				if (Value.currentblock.length>0) BlockEdit.e('bind_form_435eu3').style.display = 'block';
				BlockEdit.resize();
			}
			location.reload();
		},
		scroll: function() {
			BlockEdit.moveToolbar();
		},
		resize: function(dummy) {
			//var offset = (dummy==null) ? Value.topOffset:0;
			var offset = 0;
			if (bindobj.ie60) {
				var win = document.body.clientWidth;
				if (win==Value.windowWidth) return;
			}
			var blocks = Value.blocks;
			var covers = Value.covers;
			var wraps = Value.wraps;
			for (var i=0;i<blocks.length;i++) {
				var block = blocks[i];
				var obj = getElementPos(block);
				var c = covers[i];
				try {
						c.style.width = obj.w - (Value.borderWidth*2) + Value.widthMargin + 'px';
						c.style.height = obj.h - (Value.borderWidth*2) + Value.heightMargin + 'px';
						c.children[0].style.width = obj.w - (Value.borderWidth*2) + Value.widthMargin + 'px';
						c.children[0].style.height = obj.h - (Value.borderWidth*2)  + Value.heightMargin + 'px';
				} catch(e) {}
				c.style.left = (obj.x + 3) + 'px';
				c.style.top = (obj.y + offset) + 2 + 'px';
				c.style.lineHeight='14px';
				if (bindobj.ie60) {		//forIE6
					var w = wraps[i];
					w.style.width = obj.w + 'px';
					w.style.height = obj.h + 'px';
					w.style.left = (obj.x + 4) + 'px';
					w.style.top = (obj.y + offset) + 'px';
				c.style.lineHeight='14px';
				}
			}

			var areas = Value.areas;
			var areaCovers = Value.areaCovers;
			var areaTitles = Value.areaTitles;
			for (var i=0; i<areas.length; i++) {
				var obj = getElementPos(areas[i]);
				var c = areaCovers[i];
				c.style.width = obj.w - (Value.borderWidth*2) + 5 + 'px';
				c.style.height = obj.h - (Value.borderWidth*2) + 'px';
				c.style.left = obj.x + 'px';
				c.style.top = (obj.y + offset) + 'px';
				var t = areaTitles[i];
				t.style.left = obj.x + 'px';
				t.style.top = (obj.y + offset) + 'px';
			}

			BlockEdit.moveToolbar();

			if (Bindfooter) Bindfooter.set();
		},
		moveToolbar: function() {
			var form = BlockEdit.form;
			var btns = BlockEdit.buttons;
			if (form != null && form.style.display == 'block') {		//if toolbars is shown
				var blockobj = getElementPos(BlockEdit.e(Value.currentblock));
				form.style.left = blockobj.x + 6 +'px';
				var btop = document.documentElement.scrollTop || document.body.scrollTop;
				btop += Value.topOffset;

				var max = (blockobj.y + blockobj.h - 46);
				if (max < blockobj.y) max = blockobj.y;
				var tp = 0;

				if (blockobj.y < btop && btop < max) {
					tp = btop;
				} else if (max < btop) {
					tp = max;
				} else {
					tp = blockobj.y;
				}

				form.style.top = tp + 3 + 'px';
				form.style.height = (blockobj.y + blockobj.h - tp) + 'px';
				form.style.zIndex = 20000;

				var btns = BlockEdit.buttons;
				//btns.css('left', '1px');
				if((btns.parent().parent().parent()[0].clientWidth - btns.parent()[0].offsetLeft) < btns.width()){
					btns.css('float', 'right');
				}else{
					btns.css('float', 'left');
				}
				btns.css('top', '1px');
				if(parent.isAutoBackup || parent.siteAppvlMode>0){
					var bubtns = BlockEdit.backupbuttons;
					bubtns.css('margin-right', '6px');
					bubtns.css('top', '1px');
				}
				jQuery(".submenu").remove();
				jQuery("#subdiv").remove();

				if(jQuery('#'+Value.currentblock).hasClass('display-none-edit')){
					jQuery('#block_public .icon-eye_none').removeClass('icon-eye_none').addClass('icon-eye');
				}else{
					jQuery('#block_public .icon-eye').removeClass('icon-eye').addClass('icon-eye_none');
				}

				// ----> block auth
				// 右ボタンの表示制御
				if(parent.isAutoBackup || parent.siteAppvlMode>0 || parent.sharableMode>0){
					var buwidth = 0;
					jQuery('#block_backup').hide();
					jQuery('#block_authedit').hide();
					jQuery('#block_approval-s5').hide();
					jQuery('#block_approval-s4').hide();
					jQuery('#block_approval-s3').hide();
					jQuery('#block_approval-s2').hide();
					jQuery('#block_approval-s1').hide();
					
					if(parent.isAutoBackup){
						jQuery('#block_backup').show();
						buwidth += jQuery('#block_backup').width();
					}
					if (parent.siteAppvlMode>0 || parent.sharableMode>0){
						var blkdat = jQuery('#'+Value.currentblock).data('auth');
						if (blkdat){
							if (parent.siteAppvlMode>0){
								if (blkdat.bkauthedit) {
									if (blkdat.admin){
										jQuery('#block_authedit').show();
										buwidth += jQuery('#block_authedit').width();
									}
									if(blkdat.appvlStatus==0){
										// 未編集or承認済
										jQuery('#block_approval-s1').show();
										buwidth += jQuery('#block_approval-s1').width();
									}else if(blkdat.appvlStatus==1){
										// 編集中
										jQuery('#block_approval-s2').show();
										buwidth += jQuery('#block_approval-s2').width();
									}else if(blkdat.appvlStatus==2){
										// 承認依頼中
										if (blkdat.bkauthapvl) {
											jQuery('#block_approval-s3').show();
											jQuery('#block_approval-s4').show();
											buwidth += jQuery('#block_approval-s3').width()+jQuery('#block_approval-s4').width();
										}else{
											jQuery('#block_approval-s5').show();
											buwidth += jQuery('#block_approval-s5').width();
										}
									}else{
									}
								}
							}
							var btnwidth = 0;
							if ((parent.siteAppvlMode>0 && !blkdat.admin) || (!blkdat.areaauth && !blkdat.admin)) {
								jQuery('#block_edit').hide();
								jQuery('#block_up').hide();
								jQuery('#block_down').hide();
								jQuery('#block_add').hide();
								jQuery('#block_copy').hide();
								jQuery('#block_public').hide();
								jQuery('#block_submenu').hide();
								if (blkdat.bkauthedit && blkdat.areaauth) {
									btnwidth += jQuery('#block_edit').width();
									jQuery('#block_edit').show();
								}
							}else{
								btnwidth += jQuery('#block_edit').width();
								btnwidth += jQuery('#block_up').width();
								btnwidth += jQuery('#block_down').width();
								btnwidth += jQuery('#block_add').width();
								btnwidth += jQuery('#block_copy').width();
								btnwidth += jQuery('#block_public').width();
								btnwidth += jQuery('#block_submenu').width();
								jQuery('#block_edit').show();
								jQuery('#block_up').show();
								jQuery('#block_down').show();
								jQuery('#block_add').show();
								jQuery('#block_copy').show();
								jQuery('#block_public').show();
								jQuery('#block_submenu').show();
							}
							if (btnwidth>0){
								jQuery('#buttons').width(btnwidth);
								jQuery('#buttons').show();
							}else{
								jQuery('#buttons').hide();
							}
						}
					}
					if (buwidth>0){
						jQuery('#bubuttons').width(buwidth);
						jQuery('#bubuttons').show();
					}else{
						jQuery('#bubuttons').hide();
					}
				}else{
					jQuery('#bubuttons').show();
				}
				// <---- block auth
			}
		},
		blank: function(block, cover) {
			if (jQuery(cover).hasClass('blankblock')) block.style.height = '100px';
			else {
				var flg = BlockEdit.blankCheck(block);
				if (flg==0 && !Value.preview) {
					Value.blocks[Value.blocks.length-1].style.height = '100px';
					Value.covers[Value.covers.length-1].style.height = '100px';
					Value.covers[Value.covers.length-1].children[0].style.height = '96px';
					Value.covers[Value.covers.length-1].className = 'blankblock';
					if(jQuery(block).hasClass("display-none-edit")) {
						jQuery(Value.covers[Value.blocks.length-1]).addClass("display-none-edit");
					}
					if (bindobj.ie60) Value.wraps[Value.wraps.length-1].height = 100;
				}
			}
		},
		blankCheck: function(block) {
			var blockdivs = block.getElementsByTagName('div');
			var blocktds = block.getElementsByTagName('td');
			var cmcs = new Array();
			var flg = 0;
			for (var j=0;j<blockdivs.length;j++) {
				var cls = blockdivs[j].className;
				if (cls.indexOf('column')>-1 || cls.indexOf('bmc')>-1) cmcs.push(blockdivs[j]);
			}
			for (var j=0;j<blocktds.length;j++) {
				var cls = blocktds[j].className;
				if (cls.indexOf('column')>-1 || cls.indexOf('cmc')>-1) cmcs.push(blocktds[j]);
			}
			for (var j=0;j<cmcs.length;j++) {
				var s = cmcs[j].innerHTML.replace(/\s/g,'');
				s = s.replace(/<!--custom_tags_start-->/g, '');
				s = s.replace(/<!--custom_tags_end-->/g, '');
				if (s != '' && s.match(/^<!--.*?-->$/) == null) {
					flg++;
				}
			}
			if (flg==0 && !Value.preview) {
				block.style.height = '100px';
			} else if (jQuery(block).height() == 0) {
				block.style.height = '100px';
			}
			return flg;
		},
		cover: function(block) {
			var obj = getElementPos(block);

			var cover = document.createElement('div');
			cover.id = 'c_' + block.id;
			var coverChild = document.createElement('div');
			cover.appendChild(coverChild);
			document.body.appendChild(cover);


			if(jQuery(block).hasClass("display-none")){
				// classname change
				jQuery(block).removeClass("display-none");
				jQuery(block).addClass("display-none-edit");
			}
			cover.style.position = 'absolute';
			cover.style.width = obj.w - Value.borderWidth * 2 < 0 ? 'auto' : (obj.w - Value.borderWidth * 2) + Value.heightMargin + 'px';
			coverChild.style.width = obj.w - Value.borderWidth * 2 < 0 ? 'auto' : (obj.w - Value.borderWidth * 2) + Value.heightMargin + 'px';
			cover.style.height = obj.h - Value.borderWidth * 2 < 0 ? 'auto' : (obj.h - Value.borderWidth * 2) + Value.heightMargin + 'px';
			coverChild.style.height = obj.h - Value.borderWidth * 2 < 0 ? 'auto' : (obj.h - Value.borderWidth * 2) + Value.heightMargin + 'px';
			cover.style.left = (obj.x + 4) + 'px';

			cover.style.top = (obj.y + Value.topOffset) + 'px';
			cover.style.cursor = 'pointer';
			cover.style.border = Value.outBorder;
			cover.style.outline = Value.outOutline;
			coverChild.style.background = jQuery(block).hasClass("display-none-edit") ? Value.noEditoutBackground : Value.outBackground;
			coverChild.style.opacity = jQuery(block).hasClass("display-none-edit") ? Value.outOpacityUnPublic[0] : Value.outOpacity[0];    //forSafari
			coverChild.style.filter = jQuery(block).hasClass("display-none-edit") ? Value.outOpacityUnPublic[1] : Value.outOpacity[1];    //forIE

			cover.style.zIndex = 9999;
			coverChild.className = block.className;
			cover.onmouseover = BlockEdit.click;
			cover.onmouseout = function() {
				cover.children[0].style.background = jQuery(block).hasClass("display-none-edit") ? Value.noEditoutBackground : Value.outBackground;
				BlockEdit.hideSize();
			};
			cover.onmousemove = function(e) {
				//BlockEdit.moveSize(e);
			};
			return cover;
		},
		coverArea: function(area) {
			Value.areas.push(area);

			area.style.paddingTop = '24px';
			area.style.paddingBottom = '10px';
			area.style.marginBottom = '2px';

			if (navigator.platform.indexOf("Win") == -1) {
				if (area.id.indexOf('-side-') == -1 && area.id != 'area-main') {
					area.style.paddingLeft = '10px';
					area.style.paddingRight = '10px';
					area.style.width = area.style.width + 20;
				}
			}

			var obj = getElementPos(area);
			var col = BlockEdit.areas[area.id].color;

			var cover = document.createElement('div');
			cover.id = 'ac_' + area.id;
			document.body.appendChild(cover);

			cover.style.position = 'absolute';
			cover.style.width = obj.w - Value.borderWidth * 2 < 0 ? 'auto' : (obj.w - Value.borderWidth * 2) + Value.widthMargin + 'px';
			cover.style.height = obj.h - Value.borderWidth * 2 < 0 ? 'auto' : (obj.h - Value.borderWidth * 2) + Value.heightMargin + 'px';
			cover.style.top = (obj.y + Value.topOffset) + 'px';
			cover.style.left = (obj.x + 4) + 'px';
			cover.style.border = '3px solid ' + col;
			if (bindobj.ie && !bindobj.ie100 && !bindobj.ie110) {
				cover.style.backgroundColor = col;
				cover.style.filter = Value.areaOpacity[1]	//forIE
			} else {
				cover.style.backgroundColor = BlockEdit.areas[area.id].rgba;
			}
			cover.style.zIndex = 1;
			Value.areaCovers.push(cover);

			var useFixed = (area.id == 'area-header' || area.id == 'area-footer' || area.id == 'area-side-a' || area.id == 'area-side-b');

			var title = document.createElement('div');
			document.body.appendChild(title);
			title.innerHTML = BlockEdit.areas[area.id].title;
			title.style.padding = useFixed ? '3px 40px 3px 10px' : '3px 10px';
			title.style.color = '#ffffff';
			title.style.fontSize = '14px';
			//title.style.fontFamily = 'sans-serif';
			title.style.fontFamily = "Helvetica Neue,Helvetica,YuGothic,Yu Gothic,'ヒラギノ角ゴ Pro W3',Hiragino Kaku Gothic Pro,'メイリオ',Meiryo,'ＭＳＰゴシック',sans-serif;";
			title.style.backgroundColor = col;
			title.style.position = 'absolute';
			title.style.top = obj.y + 'px';
			title.style.left = obj.x + 'px';
			title.style.zIndex = 1;
			Value.areaTitles.push(title);

			// fixed
			if (useFixed) {
				var isFixed = (area.getAttribute('data-float') == 'true') || false;
				var floatSw = document.createElement('div');
				floatSw.style.position = 'absolute';
				floatSw.style.float = 'right';
				floatSw.style.top = '4px';
				floatSw.style.left = (title.offsetWidth - 30) + 'px';
				floatSw.style.cursor = 'pointer';
				floatSw.style.width = '20px';
				floatSw.style.height = '20px';
				// ----> block auth
				floatSw.id = area.id+'-floatbtn';
				// <---- block auth
				floatSw.style.lineHeight = '20px';
				if (isFixed == false) {	// 固定していない場合
					floatSw.style.background = 'url(' + Value.rootDir + '/js/blockeditor/icon-float-off.png) no-repeat';
					floatSw.title = 'クリックでエリアを固定します';
				} else {	// 固定している場合
					floatSw.style.background = 'url(' + Value.rootDir + '/js/blockeditor/icon-float-on.png) no-repeat';
					floatSw.title = 'クリックでエリアの固定を解除します';
				}
				// click
				floatSw.onclick = function() {
					var sw = (isFixed) ? "0" : "1";
					if(bindobj.isCloud) {
						window.parent.toggleFloat(area.id, !isFixed);
					} else {
						BindApp.call("togglefloat", area.id, sw);
					}
				};
				title.appendChild(floatSw);
			}

			return cover;
		},
		toolbar: function() {
			var form = document.createElement('form');
			form.id = 'bind_form_435eu3';
			document.body.appendChild(form);
			form.style.display = 'none';
			form.style.position = 'absolute';
			form.ondblclick = function(e) {
				// ----> block auth
				if(parent.siteAppvlMode>0 || parent.sharableMode>0){
					var blkdat = jQuery('#'+this.className).data('auth');
					// ブロック編集権限無し
					if (blkdat){
						if (parent.siteAppvlMode>0 && !blkdat.bkauthedit){
							return;
						}else if (!blkdat.areaauth && !blkdat.admin) {
							return;
						}
					}
				}
				// <---- block auth
				if(!bindobj.isCloud) {
					BlockEdit.send('block_edit');
				} else {
					if (!e) e = window.event;

					if ((e.srcElement && e.srcElement.className == this.className) || e.target == e.currentTarget) {
						BlockEdit.send('block_edit');
					}
				}
			}
			form.onmouseover = function( e ) {
				BlockEdit.dispSize( BlockEdit.e('c_' + form.className), e );
			};
			form.onmouseout = function() {
				BlockEdit.hideSize();
			};
			form.onmousemove = function(e) {
				//BlockEdit.moveSize(e);
			};
			BlockEdit.form = form;

			var menus = makeMenu();
			BlockEdit.buttons = menus;
			jQuery('#bind_form_435eu3').append(menus);
			// ----> block auth
			if(parent.isAutoBackup || parent.siteAppvlMode>0){
				// 右ボタンの作成
				var backupmenus = makeBackupMenu(parent.siteAppvlMode, parent.isAutoBackup);
				BlockEdit.backupbuttons = backupmenus;
				jQuery('#bind_form_435eu3').append(backupmenus);
			}
			// <---- block auth
			jQuery('.blockmenu').hover(
				function(){
					jQuery(this).css("background-color","#747474");
					jQuery(".submenu").remove();
					jQuery("#subdiv").remove();
				},
				function(){
					jQuery(this).css("background-color","#474747");
				}
			);
			jQuery("#block_submenu").hover(
				function(e){
					if(!jQuery(".submenu")[0]){
						var submenus = makeSubmenu(e);
					}
				}
			);
			jQuery('.backupmenu').hover(
				function(){
					jQuery(this).css("background-color","#747474");
				},
				function(){
					jQuery(this).css("background-color","#474747");
				}
			);
		},
		clear: function() {
			if (Value.preview) return;
			BlockEdit.form.style.display = 'none';
			var covers = Value.covers;
			for (var i=0;i<covers.length;i++) {
				var c = covers[i];
				c.style.border = Value.outBorder;
				c.style.outline = Value.outOutline;
				c.children[0].style.background = jQuery(c.children[0]).hasClass("display-none-edit") ? Value.noEditoutBackground : Value.outBackground;
				c.children[0].style.opacity = jQuery(c.children[0]).hasClass("display-none-edit") ? Value.outOpacityUnPublic[0] : Value.outOpacity[0];
				c.children[0].style.filter = jQuery(c.children[0]).hasClass("display-none-edit") ? Value.outOpacityUnPublic[1] : Value.outOpacity[1];
				if(bindobj.isCloud) {
					c.onmouseout = function( e ) {
						e = e || window.event;
						var targetElement = e.target || e.srcElement;
						//targetElement.style.background = Value.outBackground;
						targetElement.style.background = jQuery(targetElement).hasClass("display-none-edit") ? Value.noEditoutBackground : Value.outBackground;
						BlockEdit.hideSize();
					};
				}
			}
			Value.currentblock = '';
		},
		click: function() {
			if(BlockEdit.clickable){
				BlockEdit.clickable = false;
				var covers = Value.covers;
				for (var i=0; i<covers.length; i++) {
					var coverTmp = covers[i];
					if(coverTmp.id != this.id) {
						coverTmp.style.border = Value.outBorder;
						coverTmp.style.outline = Value.outOutline;
						coverTmp.children[0].style.background = jQuery(coverTmp.children[0]).hasClass("display-none-edit") ? Value.noEditoutBackground : Value.outBackground;
						coverTmp.children[0].style.opacity = jQuery(coverTmp.children[0]).hasClass("display-none-edit") ? Value.outOpacityUnPublic[0] : Value.outOpacity[0];
						coverTmp.children[0].style.filter = jQuery(coverTmp.children[0]).hasClass("display-none-edit") ? Value.outOpacityUnPublic[1] : Value.outOpacity[1];
						if(bindobj.isCloud) {
							coverTmp.onmouseout = function( e ) {
								e = e || window.event;
								var targetElement = e.target || e.srcElement;
								targetElement.style.background = jQuery(targetElement).hasClass("display-none-edit") ? Value.noEditoutBackground : "#FF0000";
								BlockEdit.hideSize();
							};
						}
					}
				}

				var cover = BlockEdit.e(this.id);
				//cover.style.border = Value.selectedBorder;
				cover.children[0].style.background = jQuery(cover).hasClass("display-none-edit") ? Value.noEditselectedBackground : Value.selectedBackground;
				cover.children[0].style.opacity = Value.selectedOpacity[0];
				cover.children[0].style.filter = Value.selectedOpacity[1];
				cover.onmouseout = function() {}

				var form = BlockEdit.form;
				var idTmp = this.id.split('_');
				form.className = idTmp[1];
				Value.currentblock = idTmp[1];

				var obj = getElementPos(cover);
				form.style.width = obj.w + 'px';
				form.style.height = obj.h + 'px';
				form.style.display = 'block';
				BlockEdit.moveToolbar();
				BlockEdit.clickable = true;
			}
		},
		dispSize: function( cover, e ) {
			var curW = parseInt(omitPx(cover.style.width)) + Value.borderWidth * 2;
			var curH = parseInt(omitPx(cover.style.height)) + Value.borderWidth * 2;
			if (!BlockEdit.sizeArea) {
				var sizeArea = document.createElement('div');
				sizeArea.style.position = 'absolute';
				sizeArea.style.background = '#FFF';
				sizeArea.style.color = '#000';
				sizeArea.style.display = 'block';
				sizeArea.style.padding = '4px';
				sizeArea.style.fontSize = '11px';
				//sizeArea.style.fontFamily = 'sans-serif';
				sizeArea.style.fontFamily = "Helvetica Neue,Helvetica,YuGothic,Yu Gothic,'ヒラギノ角ゴ Pro W3',Hiragino Kaku Gothic Pro,'メイリオ',Meiryo,'ＭＳＰゴシック',sans-serif;";
				sizeArea.style.opacity = '0.8';
				sizeArea.style.filter = 'alpha(opacity=80)';
				sizeArea.style.zIndex = 10000;
				sizeArea.style.borderRadius = '4px';
				sizeArea.style.lineHeight = '1.4';
				if (bindobj.ie90) {
					jQuery(document.body).prepend(sizeArea);
				} else {
					document.body.appendChild(sizeArea);
				}
				BlockEdit.sizeArea = sizeArea;
			}

			BlockEdit.sizeArea.innerHTML = '';
			if(jQuery(cover.children[0]).hasClass("display-none-edit")) {
				BlockEdit.sizeArea.innerHTML += '＜非公開＞<br />';
			}
			BlockEdit.sizeArea.innerHTML += '幅:' + curW + '  x  高さ:' + curH + '<br />' +
				'モード:' + ((cover.children[0].className.indexOf('bd-sm-smart')>-1) ? "スマート":"エディタ");
			// ----> block auth
			if(parent.siteAppvlMode>0){
				// コメント
				var blkdat = jQuery('#bk'+cover.id.replace("c_bk","")).data('auth');
				if (blkdat){
					BlockEdit.sizeArea.innerHTML += '<br />' + '&nbsp;No.' + blkdat.blockId + ' (' + blkdat.blockdataId + ')';
					BlockEdit.sizeArea.innerHTML += '<br />' +'権限：'+ blkdat.editable;
					//var authname = "";
					//if (var i=0;i<blkdat.editors.length;i++){
					//	authname += '<br />' + blkdat.editors[i];
					//}
					//BlockEdit.sizeArea.innerHTML += '<br />' +''+ blkdat.editors;
				}
			}
			// <---- block auth
			BlockEdit.notMoveSize(e);
			BlockEdit.sizeArea.style.display = 'block';
		},
		notMoveSize: function(e) {
			if (BlockEdit.sizeArea) {
				var pos = jQuery('#bind_form_435eu3').position();
				BlockEdit.sizeArea.style.top = (pos.top + 35) + 'px';
				BlockEdit.sizeArea.style.left = (pos.left + 1) + 'px';
			}
		},
		hideSize: function() {
			if (BlockEdit.sizeArea) BlockEdit.sizeArea.style.display = 'none';
		},
		set: function() {
			if (Value.preview) return;
			var metas = BlockEdit.t('meta');
			for (var i=0; i<metas.length; i++) {
				var m = metas[i];
				if (m.name == 'bind-mobile' && m.content == 'true') {
					Value.topOffset = 90;
					break;
				}
			}
			var divs = BlockEdit.t('div');
			if (document.all) Value.windowWidth = document.body.clientWidth;	//forIE onresize bug
			if (Value.covers.length>0 && bindobj.ie60) for (var i=0;i<Value.blocks.length;i++) {	//forIE6
				Value.wraps[i].style.display = 'block';
				BlockEdit.blank(Value.blocks[i], Value.covers[i]);
			}
			if (Value.covers.length>0) {
				for (var i=0;i<Value.blocks.length;i++) BlockEdit.blank(Value.blocks[i], Value.covers[i]);	//forIE7,Safari
			} else {
				for (var i=0;i<divs.length;i++) {
					var div = divs[i];
					var id = div.id;
					if (id.indexOf('bk')==0 && div.className.indexOf('block')==0) {
						Value.blocks.push(div);
						if (bindobj.ie60) BlockEdit.ie60set(div);	//forIE6
						var cover = BlockEdit.cover(div);
						Value.covers.push(cover);
						BlockEdit.blank(div, cover);
					}
				}

				for (var i=0;i<divs.length;i++) {
					var div = divs[i];
					var id = div.id;
					if (id.indexOf('bk')==0 && div.className.indexOf('block')==0) {
						if(!bindobj.isCloud) {
							Value.blocks.push(div);
							if (bindobj.ie60) BlockEdit.ie60set(div);	//forIE6
							var cover = BlockEdit.cover(div);
							Value.covers.push(cover);
							BlockEdit.blank(div, cover);
						}
					} else if (id in BlockEdit.areas) {
						if (div.offsetHeight > 0) BlockEdit.coverArea(div);

					}
				}
				// ----> block auth
				BlockEdit.setAuth();
				// <---- block auth

				BlockEdit.resize(null);

				BlockEdit.toolbar();
				BlockEdit.e('page').onclick = BlockEdit.clear;
				if (bindobj.ie60) BlockEdit.e('page').style.width = '100%';	//forIE6

				//jQuery('.display-none-edit').css('background', 'url(' + Value.rootDir + '/js/blockeditor/hidden_pc.png) no-repeat center center');
			}
		},
		// ----> block auth
		setAuth: function() {
			if (Value.preview) return;
			if(parent.siteAppvlMode>0 || parent.sharableMode>0){
				// 全ブロックに権限DATAをセット
				var bklist = [];
				for (var i=0;i<Value.covers.length;i++) {
					bklist[i] = Value.covers[i].id.replace("c_bk","");
				}
				window.parent.checkPageBlockAuth(bklist, function(json){
					if(json.bkauth){
						for (var j=0;j<json.bkauth.length;j++) {
							var blk = json.bkauth[j];
							if (blk.result){
								jQuery('#bk'+blk.blockId).data('auth', blk);
								if(blk.bkauthedit){
								}
							}
						}
					}
				});
			}
			//_bind.blockEdit.areas
			if (window.parent.checkAreaNameAuth){
				for (var j=0;j<Value.areas.length;j++){
					var areaId = Value.areas[j].id;
					window.parent.checkAreaNameAuth(areaId, function(json){
						if (json.authFlg)
						var areafloatbtn = jQuery('#'+areaId+'-floatbtn');
						if (areafloatbtn){
							areafloatbtn.show();
						}
						var areamenubtn = jQuery('#'+areaId+'-areamenubtn');
						if (areamenubtn){
							areamenubtn.show();
						}
					},function(json){
						var areafloatbtn = jQuery('#'+areaId+'-floatbtn');
						if (areafloatbtn){
							areafloatbtn.hide();
						}
						var areamenubtn = jQuery('#'+areaId+'-areamenubtn');
						if (areamenubtn){
							areamenubtn.hide();
						}
					});
				}
			}
		},
		// <---- block auth
		ie60set: function(block) {		//forIE6
			var ie6obj = getElementPos(block);
			var wrap = document.createElement('img');
			wrap.src = Value.rootDir + '/js/blockeditor/block.gif';
			wrap.id = 'w_' + block.id;
			wrap.width = ie6obj.w;
			wrap.height = ie6obj.h;
			wrap.style.display = 'block';
			wrap.style.position = 'absolute';
			wrap.style.left = ie6obj.x + 'px';
			wrap.style.top = ie6obj.y + 'px';
			document.body.appendChild(wrap);
			Value.wraps.push(wrap);
		}
	};

	function omitPx(src) {
		return src.replace('px', '');
	}

	////////// get the element's position (caluculating from the corner of the screen)
	function getElementPos(element) {
		var obj = new Object();
		obj.w = element.offsetWidth;
		obj.h = element.offsetHeight;
		obj.x = element.offsetLeft;
		obj.y = element.offsetTop;
		while(element.offsetParent) {
			element = element.offsetParent;
			obj.x += element.offsetLeft;
			obj.y += element.offsetTop;
		}
		return obj;
	}


	//////////デザイン変更
	var makeSubmenu = function(e){
		var isPastable = false;
		window.parent.isPastable(function(){isPastable = true;});
		//表示位置の特定
		var top = "top:30px;"
		var spaceY = jQuery(window).height() - e.clientY;
				if(spaceY < 127){
			top = "top:-97px;"
		}
		var subDiv = jQuery("<div></div>",{
			id:"subdiv",
			style: "cursor: pointer;font-size:14px;position:absolute;width:152px;height:97px;background-color:#f1f2f2;left:200px;" + top
				+ "border-radius: 3px 3px 3px 3px; box-shadow: 1px 1px 2px;"
			});
		var marginDiv = jQuery("<div></div>",{
			class:'submenu',
			style: "height:3px;background-color:#f1f2f2;position:absolute;top:0px;"
			});
		subDiv.append(marginDiv);
		var blockCopyDiv = makeMenuItem('block_blockcopy','submenu submenuItem ',clickEdit,'ブロックをコピー','',3);
		marginDiv.after(blockCopyDiv);
		//ペーストボタンを無効にするかどうか
		var pasteDiv = null;
		if(isPastable){
			pasteDiv = makeMenuItem('block_blockpaste','submenu submenuItem ',clickEdit,'ブロックをペースト','',33);
		}else{
			pasteDiv = makeMenuItem('block_blockpaste','submenu submenuItem ',function(){},'ブロックをペースト','',33);
			pasteDiv.click(function(){
				outFunc();
			});
		}
		blockCopyDiv.after(pasteDiv);
		var deleteDiv = makeMenuItem('block_delete','submenu submenuItem ',clickEdit,'ブロックを削除','',63);
		pasteDiv.after(deleteDiv);

		deleteDiv.after(jQuery("<div></div>",{
			class:'submenu',
			style: "height:3px;background-color:#f1f2f2;position:absolute;top:94px;"
			}));

		jQuery("#buttons").append(subDiv);
		subDiv.hover(inFunc,outFunc);
		jQuery('.submenuItem').hover(
			function(){
				jQuery(this).css("background-color","#c7cbc9");
			},
			function(){
				jQuery(this).css("background-color","#f1f2f2");
			}
		);
		return subDiv;
	};

	var inFlg = false;
	var inFunc = function(){
		inFlg = true;
	};
	var outFunc = function(){
		if(inFlg){
			jQuery("#subdiv").remove();
			jQuery(".submenu").remove();
			inFlg = false;
		}
	};

	var makeSingleButton = function(divId,divClass,spanClass,clickFunc,width,height,top,icon,content,pos,op,mainText,textPos,txtop){
		var stylefont = "font-family: Helvetica Neue,Helvetica,YuGothic,Yu Gothic,'ヒラギノ角ゴ Pro W3',Hiragino Kaku Gothic Pro,'メイリオ',Meiryo,'ＭＳＰゴシック',sans-serif;";
		var mainDiv = jQuery("<div></div>",{
			id:divId,
			class:divClass,
//			style: "cursor: pointer;width:"+width+"px;height:"+height+"px;background-color:#474747;top:"+top+"px;" + pos
			style: "cursor: pointer;width:"+width+"px;height:"+height+"px;letter-spacing:normal;" +
				"top:"+top+"px;" + pos + ";" +
				"user-select:none;-ms-user-select:none;-mox-user-select:none;-webkit-user-select:none;"
				// + stylefont
			});
		if(!textPos){
			var tooltipItem = jQuery("<span></span>",{
				class: spanClass,
				style: "color:#FFFFFF;font-size:14px;" + stylefont + op,
				tooltiptext:content,
				text:mainText
				});
		}else{
			var tooltipItem = jQuery("<span></span>",{
				class: spanClass,
				style: "color:#FFFFFF;font-size:14px;" + stylefont + op,
				tooltiptext:content
				});
		}
		if (icon!="") {
			var iconStyle = "font-family: digitalstage;font-size:18px;";
			if(!op){
				iconStyle="line-height:1.5;padding:5px;" + iconStyle;
			}
			var icon = jQuery("<span></span>",{
				class: icon,
				style: iconStyle,
				});
			tooltipItem.append(icon);
		}
		if(textPos){
			var text = jQuery("<span></span>",{
				style: "line-height: 1.5; font-size: 14px;" + stylefont + txtop,
				text: mainText,
				});
			tooltipItem.append(text);
		}
		mainDiv.append(tooltipItem);

		mainDiv.bind("click",{id : divId},clickFunc);

		return mainDiv;
	};

	var makeMenuItem = function(divId,divClass,clickFunc,menuText,content,top){

		var menuItem = jQuery("<div></div>",{
			id: divId,
			class: divClass,
			text: menuText,
			tooltiptext: content,
			style: "text-indent:6px;line-height:30px;background-color:#f1f2f2;"
			+ "user-select:none;-ms-user-select:none;-mox-user-select:none;-webkit-user-select:none;"
			+ "font-family: Helvetica Neue,Helvetica,YuGothic,Yu Gothic,'ヒラギノ角ゴ Pro W3',Hiragino Kaku Gothic Pro,'メイリオ',Meiryo,'ＭＳＰゴシック',sans-serif;"
			+ "font-size:14px;color:#333;position:absolute;top:" + top +"px;width:152px;"
									});
		menuItem.bind("click",{id : divId},clickFunc);

		return menuItem;
	};

	var clickEdit = function(e){
		BlockEdit.send(e.data.id);
	};
	var makeMenu = function(){
		var editDiv = makeSingleButton('block_edit','blockmenu','',clickEdit,'62','30','0','icon-pencil','','font-size: 14px;float:left;','','編集',true);
		var upDiv = makeSingleButton('block_up','blockmenu','tooltips_down',clickEdit,'28','30','0','icon-pagetop','ブロックを１つ上に移動します。','float:left;','');
		var downDiv = makeSingleButton('block_down','blockmenu','tooltips_down',clickEdit,'28','30','0','icon-pagedown','ブロックを１つ下に移動します。','float:left;','');
		var addDiv = makeSingleButton('block_add','blockmenu','tooltips_down',clickEdit,'28','30','0','icon-file_add3','１つ下にブロックを追加します。','float:left;','');
		var copyDiv = makeSingleButton('block_copy','blockmenu','tooltips_down',clickEdit,'28','30','0','icon-files','１つ下に選択されたブロックを複製します。','float:left;','');
		var publicDiv = makeSingleButton('block_public','blockmenu','tooltips_down',clickEdit,'28','30','0','icon-eye_none','ブロックの表示・非表示を切り替えます。','float:left;','');
		var submenuDiv = makeSingleButton('block_submenu','blockmenu','',clickEdit,'40','30','0','icon-bottom_arrow','その他のメニューを表示します。','float:left;',' padding: 5px 0px 0px 2px;position:absolute;','…');
		var menuDiv = jQuery("<div></div>",{
			id:'buttons',
			style: "display:inline-block;width:242px; height:30px; background-color: #474747;"//background-color: #99CC00;"//background-color:transparent;"
			+ "font-family: Helvetica Neue,Helvetica,YuGothic,Yu Gothic,'ヒラギノ角ゴ Pro W3',Hiragino Kaku Gothic Pro,'メイリオ',Meiryo,'ＭＳＰゴシック',sans-serif;"
			});

		menuDiv.append(editDiv);
		menuDiv.append(upDiv);
		menuDiv.append(downDiv);
		menuDiv.append(addDiv);
		menuDiv.append(copyDiv);
		menuDiv.append(publicDiv);
		menuDiv.append(submenuDiv);
		return menuDiv;
	};

	var clickBackup = function(e){
		BlockEdit.backupList(e.data.id);
	};
	var makeBackupMenu = function(siteAppvlMode, isAutoBackup){
		var mwidth = 0;
		//var backupDiv = makeSingleButton('block_backup','backupmenu','tooltips_down_left',clickBackup,'40','36','0','icon-backup','バックアップリスト','','font-size:26px;padding: 4px 8px;');
		var backupDiv = makeSingleButton('block_backup','backupmenu','tooltips_down_left',clickBackup,'30','30','0','icon-backup','バックアップリスト','float:right;','');
		if (isAutoBackup){
			mwidth += 30;
		}
		var authDiv = makeSingleButton('block_authedit','backupmenu','tooltips_down_left',clickEdit,'30','30','0','icon-block_user','ブロック権限編集','float:right;display:none;','');

		//var makeSingleButton =(divId, divClass, spanClass, clickFunc, width, height, top, icon, content, pos,op,mainText,textPos){
		var pos = 'float:right;display:none;text-align:center;';
		var op = 'display:inline-block;line-height:30px;';
		var txtop = 'padding:2px 3px;border-radius: 2px 2px 2px 2px;color:#FFFFFF;';
		var appvlDiv1 = makeSingleButton('block_approval-s1','backupmenu','',clickEdit,'40','30','0','','OK',pos,op,'OK',true,txtop+'background-color:#474747;');
		var appvlDiv2 = makeSingleButton('block_approval-s2','backupmenu','',clickEdit,'75','30','0','','承認依頼',pos,op,'承認依頼',true,txtop+'background-color:#668866;');
		var appvlDiv3 = makeSingleButton('block_approval-s3','backupmenu','',clickEdit,'75','30','0','','差し戻し',pos,op,'差し戻し',true,txtop+'background-color:#884733;');
		var appvlDiv4 = makeSingleButton('block_approval-s4','backupmenu','',clickEdit,'75','30','0','','承認する',pos,op,'承認する',true,txtop+'background-color:#668866;');
		var appvlDiv5 = makeSingleButton('block_approval-s5','backupmenu','',clickEdit,'75','30','0','','承認待ち',pos,op,'承認待ち',true,txtop+'background-color:#666666;');

		var menuDiv = jQuery("<div></div>",{
			id:'bubuttons',
			style: "display:inline-block;float:right;width:"+mwidth+"px; height:30px; background-color: #474747;"//background-color: #99CC00;"//background-color:transparent;"
			+ "font-family: Helvetica Neue,Helvetica,YuGothic,Yu Gothic,'ヒラギノ角ゴ Pro W3',Hiragino Kaku Gothic Pro,'メイリオ',Meiryo,'ＭＳＰゴシック',sans-serif;"
		});
		if (isAutoBackup){
			menuDiv.append(backupDiv);
		}
		if (siteAppvlMode>0){
			menuDiv.append(authDiv);
			menuDiv.append(appvlDiv5);
			menuDiv.append(appvlDiv4);
			menuDiv.append(appvlDiv3);
			menuDiv.append(appvlDiv2);
			menuDiv.append(appvlDiv1);
		}
		return menuDiv;
	};
