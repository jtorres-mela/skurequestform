"use client";

import * as React from "react";

/* ==== Types (kept local; TS is structural so they'll match page.tsx) ==== */
type CultureRow = { cultureCode?: string; translatedName?: string; translatedShort?: string; translatedLong?: string };
type AccessoryRow = { accessorySku?: string; accessoryLabel?: string };
type RecommendationRow = { sku: string };

type ProductForm = {
  sku: string;
  productName: string;
  shortDescription?: string;
  longDescription?: string;
  stamp?: string | null;
  offSaleMessage?: string | null;

  onSaleDate?: string | null;
  offSaleDate?: string | null;

  uomTitleUS?: string;
  uomValueUS?: string;
  uomTitleCA?: string;
  uomValueCA?: string;

  savingsUS?: string | null;
  savingsCA?: string | null;

  // NEW:
  imageUrl?: string;          // e.g. "/10885h-01-enus.png"
  memberPrice?: string;       // e.g. "$14.00"
  nonMemberPrice?: string;    // e.g. "$16.00"
  points?: number;            // e.g. 10

  recommendations?: { sku: string }[];
  accessories: { accessorySku?: string; accessoryLabel?: string }[];
  cultures: { cultureCode?: string; translatedName?: string; translatedShort?: string; translatedLong?: string }[];
};

/* ==== Helpers you already wrote ==== */
function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]!));
}

function toDateSpan(on?: string|null, off?: string|null) {
  if (!on && !off) return "";
  const fmt = (d?: string|null) => (d ? new Date(d).toLocaleDateString() : "—");
  return `${fmt(on)} – ${fmt(off)}`;
}

function pickCulture(product: ProductForm, culture: string) {
  const row = product.cultures?.find(
    c => (c.cultureCode || "").toLowerCase() === culture.toLowerCase()
  );
  return {
    title: row?.translatedName || product.productName || "Untitled Product",
    short: row?.translatedShort || product.shortDescription || "",
    long:  row?.translatedLong  || product.longDescription  || "",
  };
}

function buildPreviewHtml(product: ProductForm, culture: string) {
  const { title, short, long } = pickCulture(product, culture);

  // Derive bits
  const saleWindow = toDateSpan(product.onSaleDate, product.offSaleDate);
  const uomUS = [product.uomValueUS, product.uomTitleUS].filter(Boolean).join(" ");
  const uomCA = [product.uomValueCA, product.uomTitleCA].filter(Boolean).join(" ");
  const uom = [uomUS, uomCA].filter(Boolean).join(" | ");

  // NEW: fallbacks
  const img = product.imageUrl || "/placeholder.png"; // put a file in /public
  const member = product.memberPrice || "$18.25";
  const nonMember = product.nonMemberPrice || "$27.00";
  const points = typeof product.points === "number" ? product.points : 10;

  return `<!doctype html>
<html lang="en"><head><style id="ace-monokai">.ace-monokai .ace_gutter {background: #2F3129;color: #8F908A}.ace-monokai .ace_print-margin {width: 1px;background: #555651}.ace-monokai {background-color: #272822;color: #F8F8F2}.ace-monokai .ace_cursor {color: #F8F8F0}.ace-monokai .ace_marker-layer .ace_selection {background: #49483E}.ace-monokai.ace_multiselect .ace_selection.ace_start {box-shadow: 0 0 3px 0px #272822;}.ace-monokai .ace_marker-layer .ace_step {background: rgb(102, 82, 0)}.ace-monokai .ace_marker-layer .ace_bracket {margin: -1px 0 0 -1px;border: 1px solid #49483E}.ace-monokai .ace_marker-layer .ace_active-line {background: #202020}.ace-monokai .ace_gutter-active-line {background-color: #272727}.ace-monokai .ace_marker-layer .ace_selected-word {border: 1px solid #49483E}.ace-monokai .ace_invisible {color: #52524d}.ace-monokai .ace_entity.ace_name.ace_tag,.ace-monokai .ace_keyword,.ace-monokai .ace_meta.ace_tag,.ace-monokai .ace_storage {color: #F92672}.ace-monokai .ace_punctuation,.ace-monokai .ace_punctuation.ace_tag {color: #fff}.ace-monokai .ace_constant.ace_character,.ace-monokai .ace_constant.ace_language,.ace-monokai .ace_constant.ace_numeric,.ace-monokai .ace_constant.ace_other {color: #AE81FF}.ace-monokai .ace_invalid {color: #F8F8F0;background-color: #F92672}.ace-monokai .ace_invalid.ace_deprecated {color: #F8F8F0;background-color: #AE81FF}.ace-monokai .ace_support.ace_constant,.ace-monokai .ace_support.ace_function {color: #66D9EF}.ace-monokai .ace_fold {background-color: #A6E22E;border-color: #F8F8F2}.ace-monokai .ace_storage.ace_type,.ace-monokai .ace_support.ace_class,.ace-monokai .ace_support.ace_type {font-style: italic;color: #66D9EF}.ace-monokai .ace_entity.ace_name.ace_function,.ace-monokai .ace_entity.ace_other,.ace-monokai .ace_entity.ace_other.ace_attribute-name,.ace-monokai .ace_variable {color: #A6E22E}.ace-monokai .ace_variable.ace_parameter {font-style: italic;color: #FD971F}.ace-monokai .ace_string {color: #E6DB74}.ace-monokai .ace_comment {color: #75715E}.ace-monokai .ace_indent-guide {background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWPQ0FD0ZXBzd/wPAAjVAoxeSgNeAAAAAElFTkSuQmCC) right repeat-y}
/*# sourceURL=ace/css/ace-monokai */</style><style id="error_marker.css">    .error_widget_wrapper {        background: inherit;        color: inherit;        border:none    }    .error_widget {        border-top: solid 2px;        border-bottom: solid 2px;        margin: 5px 0;        padding: 10px 40px;        white-space: pre-wrap;    }    .error_widget.ace_error, .error_widget_arrow.ace_error{        border-color: #ff5a5a    }    .error_widget.ace_warning, .error_widget_arrow.ace_warning{        border-color: #F1D817    }    .error_widget.ace_info, .error_widget_arrow.ace_info{        border-color: #5a5a5a    }    .error_widget.ace_ok, .error_widget_arrow.ace_ok{        border-color: #5aaa5a    }    .error_widget_arrow {        position: absolute;        border: solid 5px;        border-top-color: transparent!important;        border-right-color: transparent!important;        border-left-color: transparent!important;        top: -5px;    }
/*# sourceURL=ace/css/error_marker.css */</style><style id="ace-tm">.ace-tm .ace_gutter {background: #f0f0f0;color: #333;}.ace-tm .ace_print-margin {width: 1px;background: #e8e8e8;}.ace-tm .ace_fold {background-color: #6B72E6;}.ace-tm {background-color: #FFFFFF;color: black;}.ace-tm .ace_cursor {color: black;}.ace-tm .ace_invisible {color: rgb(191, 191, 191);}.ace-tm .ace_storage,.ace-tm .ace_keyword {color: blue;}.ace-tm .ace_constant {color: rgb(197, 6, 11);}.ace-tm .ace_constant.ace_buildin {color: rgb(88, 72, 246);}.ace-tm .ace_constant.ace_language {color: rgb(88, 92, 246);}.ace-tm .ace_constant.ace_library {color: rgb(6, 150, 14);}.ace-tm .ace_invalid {background-color: rgba(255, 0, 0, 0.1);color: red;}.ace-tm .ace_support.ace_function {color: rgb(60, 76, 114);}.ace-tm .ace_support.ace_constant {color: rgb(6, 150, 14);}.ace-tm .ace_support.ace_type,.ace-tm .ace_support.ace_class {color: rgb(109, 121, 222);}.ace-tm .ace_keyword.ace_operator {color: rgb(104, 118, 135);}.ace-tm .ace_string {color: rgb(3, 106, 7);}.ace-tm .ace_comment {color: rgb(76, 136, 107);}.ace-tm .ace_comment.ace_doc {color: rgb(0, 102, 255);}.ace-tm .ace_comment.ace_doc.ace_tag {color: rgb(128, 159, 191);}.ace-tm .ace_constant.ace_numeric {color: rgb(0, 0, 205);}.ace-tm .ace_variable {color: rgb(49, 132, 149);}.ace-tm .ace_xml-pe {color: rgb(104, 104, 91);}.ace-tm .ace_entity.ace_name.ace_function {color: #0000A2;}.ace-tm .ace_heading {color: rgb(12, 7, 255);}.ace-tm .ace_list {color:rgb(185, 6, 144);}.ace-tm .ace_meta.ace_tag {color:rgb(0, 22, 142);}.ace-tm .ace_string.ace_regex {color: rgb(255, 0, 0)}.ace-tm .ace_marker-layer .ace_selection {background: rgb(181, 213, 255);}.ace-tm.ace_multiselect .ace_selection.ace_start {box-shadow: 0 0 3px 0px white;}.ace-tm .ace_marker-layer .ace_step {background: rgb(252, 255, 0);}.ace-tm .ace_marker-layer .ace_stack {background: rgb(164, 229, 101);}.ace-tm .ace_marker-layer .ace_bracket {margin: -1px 0 0 -1px;border: 1px solid rgb(192, 192, 192);}.ace-tm .ace_marker-layer .ace_active-line {background: rgba(0, 0, 0, 0.07);}.ace-tm .ace_gutter-active-line {background-color : #dcdcdc;}.ace-tm .ace_marker-layer .ace_selected-word {background: rgb(250, 250, 255);border: 1px solid rgb(200, 200, 250);}.ace-tm .ace_indent-guide {background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==") right repeat-y;}
/*# sourceURL=ace/css/ace-tm */</style><style id="ace_editor.css">.ace_br1 {border-top-left-radius    : 3px;}.ace_br2 {border-top-right-radius   : 3px;}.ace_br3 {border-top-left-radius    : 3px; border-top-right-radius:    3px;}.ace_br4 {border-bottom-right-radius: 3px;}.ace_br5 {border-top-left-radius    : 3px; border-bottom-right-radius: 3px;}.ace_br6 {border-top-right-radius   : 3px; border-bottom-right-radius: 3px;}.ace_br7 {border-top-left-radius    : 3px; border-top-right-radius:    3px; border-bottom-right-radius: 3px;}.ace_br8 {border-bottom-left-radius : 3px;}.ace_br9 {border-top-left-radius    : 3px; border-bottom-left-radius:  3px;}.ace_br10{border-top-right-radius   : 3px; border-bottom-left-radius:  3px;}.ace_br11{border-top-left-radius    : 3px; border-top-right-radius:    3px; border-bottom-left-radius:  3px;}.ace_br12{border-bottom-right-radius: 3px; border-bottom-left-radius:  3px;}.ace_br13{border-top-left-radius    : 3px; border-bottom-right-radius: 3px; border-bottom-left-radius:  3px;}.ace_br14{border-top-right-radius   : 3px; border-bottom-right-radius: 3px; border-bottom-left-radius:  3px;}.ace_br15{border-top-left-radius    : 3px; border-top-right-radius:    3px; border-bottom-right-radius: 3px; border-bottom-left-radius: 3px;}.ace_editor {position: relative;overflow: hidden;padding: 0;font: 12px/normal 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;direction: ltr;text-align: left;-webkit-tap-highlight-color: rgba(0, 0, 0, 0);}.ace_scroller {position: absolute;overflow: hidden;top: 0;bottom: 0;background-color: inherit;-ms-user-select: none;-moz-user-select: none;-webkit-user-select: none;user-select: none;cursor: text;}.ace_content {position: absolute;box-sizing: border-box;min-width: 100%;contain: style size layout;font-variant-ligatures: no-common-ligatures;}.ace_dragging .ace_scroller:before{position: absolute;top: 0;left: 0;right: 0;bottom: 0;content: '';background: rgba(250, 250, 250, 0.01);z-index: 1000;}.ace_dragging.ace_dark .ace_scroller:before{background: rgba(0, 0, 0, 0.01);}.ace_selecting, .ace_selecting * {cursor: text !important;}.ace_gutter {position: absolute;overflow : hidden;width: auto;top: 0;bottom: 0;left: 0;cursor: default;z-index: 4;-ms-user-select: none;-moz-user-select: none;-webkit-user-select: none;user-select: none;contain: style size layout;}.ace_gutter-active-line {position: absolute;left: 0;right: 0;}.ace_scroller.ace_scroll-left {box-shadow: 17px 0 16px -16px rgba(0, 0, 0, 0.4) inset;}.ace_gutter-cell {position: absolute;top: 0;left: 0;right: 0;padding-left: 19px;padding-right: 6px;background-repeat: no-repeat;}.ace_gutter-cell.ace_error {background-image: url("${escapeHtml(img)}");background-repeat: no-repeat;background-position: 2px center;}.ace_gutter-cell.ace_warning {background-image: url("${escapeHtml(img)}");background-position: 2px center;}.ace_gutter-cell.ace_info {background-image: url("${escapeHtml(img)}");}.ace_scrollbar {contain: strict;position: absolute;right: 0;bottom: 0;z-index: 6;}.ace_scrollbar-inner {position: absolute;cursor: text;left: 0;top: 0;}.ace_scrollbar-v{overflow-x: hidden;overflow-y: scroll;top: 0;}.ace_scrollbar-h {overflow-x: scroll;overflow-y: hidden;left: 0;}.ace_print-margin {position: absolute;height: 100%;}.ace_text-input {position: absolute;z-index: 0;width: 0.5em;height: 1em;opacity: 0;background: transparent;-moz-appearance: none;appearance: none;border: none;resize: none;outline: none;overflow: hidden;font: inherit;padding: 0 1px;margin: 0 -1px;contain: strict;-ms-user-select: text;-moz-user-select: text;-webkit-user-select: text;user-select: text;white-space: pre!important;}.ace_text-input.ace_composition {background: transparent;color: inherit;z-index: 1000;opacity: 1;}.ace_composition_placeholder { color: transparent }.ace_composition_marker { border-bottom: 1px solid;position: absolute;border-radius: 0;margin-top: 1px;}[ace_nocontext=true] {transform: none!important;filter: none!important;clip-path: none!important;mask : none!important;contain: none!important;perspective: none!important;mix-blend-mode: initial!important;z-index: auto;}.ace_layer {z-index: 1;position: absolute;overflow: hidden;word-wrap: normal;white-space: pre;height: 100%;width: 100%;box-sizing: border-box;pointer-events: none;}.ace_gutter-layer {position: relative;width: auto;text-align: right;pointer-events: auto;height: 1000000px;contain: style size layout;}.ace_text-layer {font: inherit !important;position: absolute;height: 1000000px;width: 1000000px;contain: style size layout;}.ace_text-layer > .ace_line, .ace_text-layer > .ace_line_group {contain: style size layout;position: absolute;top: 0;left: 0;right: 0;}.ace_hidpi .ace_text-layer,.ace_hidpi .ace_gutter-layer,.ace_hidpi .ace_content,.ace_hidpi .ace_gutter {contain: strict;will-change: transform;}.ace_hidpi .ace_text-layer > .ace_line, .ace_hidpi .ace_text-layer > .ace_line_group {contain: strict;}.ace_cjk {display: inline-block;text-align: center;}.ace_cursor-layer {z-index: 4;}.ace_cursor {z-index: 4;position: absolute;box-sizing: border-box;border-left: 2px solid;transform: translatez(0);}.ace_multiselect .ace_cursor {border-left-width: 1px;}.ace_slim-cursors .ace_cursor {border-left-width: 1px;}.ace_overwrite-cursors .ace_cursor {border-left-width: 0;border-bottom: 1px solid;}.ace_hidden-cursors .ace_cursor {opacity: 0.2;}.ace_hasPlaceholder .ace_hidden-cursors .ace_cursor {opacity: 0;}.ace_smooth-blinking .ace_cursor {transition: opacity 0.18s;}.ace_animate-blinking .ace_cursor {animation-duration: 1000ms;animation-timing-function: step-end;animation-name: blink-ace-animate;animation-iteration-count: infinite;}.ace_animate-blinking.ace_smooth-blinking .ace_cursor {animation-duration: 1000ms;animation-timing-function: ease-in-out;animation-name: blink-ace-animate-smooth;}@keyframes blink-ace-animate {from, to { opacity: 1; }60% { opacity: 0; }}@keyframes blink-ace-animate-smooth {from, to { opacity: 1; }45% { opacity: 1; }60% { opacity: 0; }85% { opacity: 0; }}.ace_marker-layer .ace_step, .ace_marker-layer .ace_stack {position: absolute;z-index: 3;}.ace_marker-layer .ace_selection {position: absolute;z-index: 5;}.ace_marker-layer .ace_bracket {position: absolute;z-index: 6;}.ace_marker-layer .ace_error_bracket {position: absolute;border-bottom: 1px solid #DE5555;border-radius: 0;}.ace_marker-layer .ace_active-line {position: absolute;z-index: 2;}.ace_marker-layer .ace_selected-word {position: absolute;z-index: 4;box-sizing: border-box;}.ace_line .ace_fold {box-sizing: border-box;display: inline-block;height: 11px;margin-top: -2px;vertical-align: middle;background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAJCAYAAADU6McMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJpJREFUeNpi/P//PwOlgAXGYGRklAVSokD8GmjwY1wasKljQpYACtpCFeADcHVQfQyMQAwzwAZI3wJKvCLkfKBaMSClBlR7BOQikCFGQEErIH0VqkabiGCAqwUadAzZJRxQr/0gwiXIal8zQQPnNVTgJ1TdawL0T5gBIP1MUJNhBv2HKoQHHjqNrA4WO4zY0glyNKLT2KIfIMAAQsdgGiXvgnYAAAAASUVORK5CYII="),url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA3CAYAAADNNiA5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACJJREFUeNpi+P//fxgTAwPDBxDxD078RSX+YeEyDFMCIMAAI3INmXiwf2YAAAAASUVORK5CYII=");background-repeat: no-repeat, repeat-x;background-position: center center, top left;color: transparent;border: 1px solid black;border-radius: 2px;cursor: pointer;pointer-events: auto;}.ace_dark .ace_fold {}.ace_fold:hover{background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAJCAYAAADU6McMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJpJREFUeNpi/P//PwOlgAXGYGRklAVSokD8GmjwY1wasKljQpYACtpCFeADcHVQfQyMQAwzwAZI3wJKvCLkfKBaMSClBlR7BOQikCFGQEErIH0VqkabiGCAqwUadAzZJRxQr/0gwiXIal8zQQPnNVTgJ1TdawL0T5gBIP1MUJNhBv2HKoQHHjqNrA4WO4zY0glyNKLT2KIfIMAAQsdgGiXvgnYAAAAASUVORK5CYII="),url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA3CAYAAADNNiA5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACBJREFUeNpi+P//fz4TAwPDZxDxD5X4i5fLMEwJgAADAEPVDbjNw87ZAAAAAElFTkSuQmCC");}.ace_tooltip {background-color: #FFF;background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));border: 1px solid gray;border-radius: 1px;box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);color: black;max-width: 100%;padding: 3px 4px;position: fixed;z-index: 999999;box-sizing: border-box;cursor: default;white-space: pre;word-wrap: break-word;line-height: normal;font-style: normal;font-weight: normal;letter-spacing: normal;pointer-events: none;}.ace_folding-enabled > .ace_gutter-cell {padding-right: 13px;}.ace_fold-widget {box-sizing: border-box;margin: 0 -12px 0 1px;display: none;width: 11px;vertical-align: top;background-image: url("${escapeHtml(img)}");background-repeat: no-repeat;background-position: center;border-radius: 3px;border: 1px solid transparent;cursor: pointer;}.ace_folding-enabled .ace_fold-widget {display: inline-block;   }.ace_fold-widget.ace_end {background-image: url("${escapeHtml(img)}");}.ace_fold-widget.ace_closed {background-image: url("${escapeHtml(img)}");}.ace_fold-widget:hover {border: 1px solid rgba(0, 0, 0, 0.3);background-color: rgba(255, 255, 255, 0.2);box-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);}.ace_fold-widget:active {border: 1px solid rgba(0, 0, 0, 0.4);background-color: rgba(0, 0, 0, 0.05);box-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);}.ace_dark .ace_fold-widget {background-image: url("${escapeHtml(img)}");}.ace_dark .ace_fold-widget.ace_end {background-image: url("${escapeHtml(img)}");}.ace_dark</style>
   

  <link href="https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,700,700i,900|Material+Icons&amp;display=swap" rel="stylesheet">
    <link href="live.css" rel="stylesheet">
    <link rel="stylesheet" href="/live-preview-tweaks.css">
</head>

<body>

    

    <div class="right">
        <main id="mainContent" role="main" class="relative">
           
            <div>
                <div></div>
            </div>
           
            <div class="w-full max-w-xl px-8 mb-40 mx-auto md:mt-30 lg:px-20">
                <div class="preComponentLoader -productDetails -preComponentLoaded">
                    <section id="section-pdp-top" class="o-productDetails">
                        <div class="md:hidden">
                            <h1 class="o-productDetails__heading">Modelo Mug</h1>
                            <p class="o-productDetails__details"><span>Item: 10885</span> <span class="px-3"> | </span>
                                <span>Size: <span class="font-bold">${escapeHtml(uom)}</span></span></p>
                            <div class="a-reviewSnippet hidden">
                                <div id="pr-reviewSnippetMobile"></div>
                            </div>
                        </div>
                        <div class="md:hidden"><!----></div>
                        <div class="w-full mt-20 mb-15 md:block md:w-1_2 md:my-0 md:pr-20 lg:pr-40">
                            <div>
                                <div>
                                    <div aria-label="Modelo Mug Media Gallery" data-js="productMedia" class="m-prodMedia">
                                        <div aria-hidden="false" data-label-count="slide {0} out of {1}" data-label-media="Media" data-label-of="Of" data-label-showing="Showing" data-label-selected="Selected" data-label-previous="Previous" data-label-next="Next" data-label-click-to-zoom="ClickToZoom" class="m-prodMedia__wrapper -thumbs">
                                            <nav class="m-prodMedia__actions -thumbs">
                                                <div class="m-prodMedia__arrows"></div>
                                            </nav>
                                            <div class="m-prodMedia__list -thumbs slick-vertical slick-initialized slick-slider">
                                                <div class="slick-list" style="height: 430px;">
                                                    <div class="slick-track" style="opacity: 1; height: 86px; transform: translate3d(0px, 0px, 0px);">
                                                        <div class="slick-slide slick-current slick-active active" data-slick-index="0" aria-hidden="false" style="width: 109px;">
                                                            <div><button aria-label="Modelo Mug - Media 1 Of 1 Selected/Showing" class="m-prodMedia__thumb" tabindex="0" style="width: 100%; display: inline-block;"><img src="${escapeHtml(img)}" alt="Modelo Mug" class="noLazy loading" data-ll-status="loading"></button></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="m-prodMedia" aria-label="Modelo Mug Media Gallery" class="m-prodMedia__wrapper -images">
                                            <nav class="m-prodMedia__actions -images">
                                                <div class="m-prodMedia__counter"><span class="sr-only">Media </span>1
                                                    Of 1</div>
                                                <div class="m-prodMedia__arrows"></div>
                                            </nav>
                                            <div class="m-prodMedia__zoom">
                                                <div class="m-prodMedia__zoomImage"
              <img src="${escapeHtml(img)}" alt="..." class="m-prodMedia__image" />

                                                </div>
                                            </div>
                                            <div class="m-prodMedia__list -images slick-initialized slick-slider">
                                                <div class="slick-list">
                                                    <div class="slick-track">
                                                        <div class="slick-slide slick-current slick-active" data-slick-index="0" aria-hidden="false" style="width: 436px;">
                                                            <div>
                                                                <div data-zoom="${escapeHtml(img)}" class="m-prodMedia__mediaItem" style="width: 100%; display: inline-block;" tabindex="0">
                                                                   
                                                                  
                            <div class="m-prodMedia__mediaItem__contain">
                                <img src="${escapeHtml(img)}" class="m-prodMedia__image" alt="Renew® Intensive Skin Therapy: 8 oz tube" />
                            </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div role="dialog" class="m-prodMedia__wrapper -lightbox">
                                            <div aria-hidden="true" class="m-prodMedia__lightbox">
                                                <nav class="m-prodMedia__actions -lightbox">
                                                    <div class="m-prodMedia__counter -lightbox"><span class="sr-only">Media 1 Of 1</span></div>
                                                    <div class="m-prodMedia__arrows -lightbox"></div> <button class="m-prodMedia__close">Close modal</button>
                                                </nav>
                                                <div class="m-prodMedia__list -lightbox slick-initialized slick-slider">
                                                    <div class="slick-list draggable">
                                                        <div class="slick-track" style="opacity: 1; width: 0px; transform: translate3d(0px, 0px, 0px);">
                                                            <div class="slick-slide slick-current slick-active" data-slick-index="0" aria-hidden="false" style="width: 0px;">
                                                                <div>
                                                                    <div class="m-prodMedia__lightboxImage" style="width: 100%; display: inline-block;"><img src="${escapeHtml(img)}" alt="Modelo Mug" class="m-prodMedia__lightboxZoom" data-src="${escapeHtml(img)}">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div> <!----> <!---->
                        <div category="" class="o-productDetails__info">
                            <div class="hidden md:block">
                                <h1 class="o-productDetails__heading">${escapeHtml(product.productName)}</h1>
                                <p class="o-productDetails__details">
                                    Item: ${escapeHtml(product.sku || "")}
                                    <span class="px-3"> | </span>
                                    Size: <span class="font-bold">${escapeHtml(uom)}</span>
                                </p>
                                <div class="a-reviewSnippet hidden">
                                    <div id="pr-reviewSnippetDesktop" data-pr-component="ReviewSnippet" data-pr-page_id="3472" lang="en" data-pr-mounted="true">
                                        <div class="p-w-r" style="">
                                            <section data-testid="review-snippet" class="pr-review-snippet-container pr-no-reviews">
                                                <div class="pr-snippet-stars-reco-inline pr-snippet-compact">
                                                    <div class="pr-snippet-stars-reco-stars">
                                                        <div class="pr-snippet">
                                                            <div class="pr-snippet-stars-container">
                                                                <div class="pr-snippet-stars pr-snippet-stars-png" role="img" aria-label="Rated 0.0 out of 5 stars">
                                                                    <div aria-hidden="true" class="pr-rating-stars">
                                                                        <div class="pr-star-v4 pr-star-v4-0-filled">
                                                                        </div>
                                                                        <div class="pr-star-v4 pr-star-v4-0-filled">
                                                                        </div>
                                                                        <div class="pr-star-v4 pr-star-v4-0-filled">
                                                                        </div>
                                                                        <div class="pr-star-v4 pr-star-v4-0-filled">
                                                                        </div>
                                                                        <div class="pr-star-v4 pr-star-v4-0-filled">
                                                                        </div>
                                                                    </div>
                                                                    <div aria-hidden="true" class="pr-snippet-rating-decimal">0.0</div>
                                                                </div>
                                                            </div>
                                                            <div class="pr-snippet-read-and-write"><span class="pr-snippet-review-count" style="display: none;">No Reviews</span><a href="" class="pr-snippet-write-review-link pr-underline" rel="nofollow">Write the First Review</a><a class="pr-snippet-review-count" href="#section-pdp-reviews">No Reviews</a></div>
                                                        </div>
                                                    </div>
                                                    <div style="clear: both;"></div>
                                                </div>
                                            </section>
                                        </div>
                                    </div>
                                </div>
                            </div> <!---->
                            <div class="o-productDetails__desc -desktop"> ${escapeHtml(short)}
                            </div>
                            <div class="hidden md:block mb-15">
                                <div></div>
                            </div> <!----> <!---->
                            <div class="o-productDetails__price -desktop">
                                <div class="m-productDetailPrice">
                                    <div>
                                        <p><span class="sr-only">Preferred value at </span> <span class="m-productDetailPrice__primaryPrice">
                                                $00.00
                                            </span> <span aria-hidden="true" class="m-productDetailPrice__primaryLabel">
                                                Member</span> <!----></p> <!----> <!----> <!---->
                                    </div>
                                    <div>
                                        <p class="m-productDetailPrice__secondaryPriceAndLabel"><span class="sr-only">Non-Member </span>
                                            $00.00
                                            <span aria-hidden="true"> Non-Member</span>
                                        </p> <!----> <!----> <!---->
                                    </div>
                                </div>
                                <p class="o-productDetails__points"><span class="sr-only">Earn</span>
                                    0
                                    <span class="sr-only"> points with this purchase</span>
                                    Points
                                </p> <!---->
                            </div> <!---->
                            <hr class="o-productDetails__divider"> <!---->
                            <div class="o-productDetails__price -mobile">
                                <div class="m-productDetailPrice">
                                    <div>
                                        <p><span class="sr-only">Preferred value at </span> <span class="m-productDetailPrice__primaryPrice">
                                                $14.00
                                            </span> <span aria-hidden="true" class="m-productDetailPrice__primaryLabel">
                                                Member</span> <!----></p> <!----> <!----> <!---->
                                    </div>
                                    <div>
                                        <p class="m-productDetailPrice__secondaryPriceAndLabel"><span class="sr-only">Non-Member </span>
                                            $16.00
                                            <span aria-hidden="true"> Non-Member</span>
                                        </p> <!----> <!----> <!---->
                                    </div>
                                </div>
                                <p class="o-productDetails__points"><span class="sr-only">Earn</span>
                                    0
                                    <span class="sr-only"> points with this purchase</span>
                                    Points
                                </p> <!---->
                            </div> <!---->
                            <div class="m-cartAddConfig">
                                <div class="m-cartAddConfig__quantity">
                                    <div class="a-quantity"><button type="button" tabindex="-1" aria-label="Decrease" data-testid="quantityDecrease-button" class="a-quantity__btn"><span aria-hidden="true" class="a-icon material-icons -inherit">remove</span></button> <input role="spinbutton" aria-label="Quantity" aria-valuenow="1" aria-valuetext="1" aria-valuemin="1" aria-valuemax="99" maxlength="2" data-testid="quantity-input" class="a-quantity__input"> <button type="button" tabindex="-1" aria-label="Increase" data-testid="quantityIncrease-button" class="a-quantity__btn"><span aria-hidden="true" class="a-icon material-icons -inherit">add</span></button></div>
                                </div>
                                <div class="m-cartAddConfig__btn"><button type="button" class="a-button h-full w-full justify-center">



                                        Add To Cart
                                    </button></div>
                                <div role="alert" class="m-cartAddConfig__loading">
                                    <div aria-atomic="true" aria-live="assertive" class="a-loadingSpinner -sm "><!---->
                                    </div>
                                </div> <!----> <!----> <!---->
                            </div> <!----> <!---->
                            <div class="relative">
                                <div class="o-productDetails__accessories mb-30 inline-block"><!----></div>
                                <div class="o-productDetails__addList">
                                    <div class="m-shoplistsAddItem m-po__details -addList" gtm-text="Modelo Mug"><button aria-label="Add to List" aria-pressed="true" type="button" class="m-shoplistsAddItem__button">
                                            <div class="o-productDetails__inner"><span aria-hidden="true" class="material-icons mr-5">playlist_add</span> <span>Add To
                                                    List</span></div>
                                        </button>
                                        <div class="m-popUp -shoplists-add-item -pdp hidden">
                                            <div class="m-popUp__content"><button tabindex="0" aria-label="Close Pop-up" class="m-popUp__close"><img src="" alt="Close Pop-up" aria-hidden="true" class="m-popUp__closeImg" data-src="clear2x.png"></button>
                                                <span aria-hidden="true" class="a-arrow -lg -up -filled -shadow absolute -top-13 right-18"><span class="a-arrow__icon border-white"></span></span>
                                                <div class="m-popUp__header border-none">
                                                    <h2 class="m-popUp__headerTitle uppercase text-base pr-40">Add to
                                                        List:</h2> <!----> <!----> <!----> <!---->
                                                    <div class="pl-24"></div>
                                                </div>
                                                <div class="m-popUp__body">
                                                    <div class="m-shoplistsAddItem__wrapper"><!---->
                                                        <div class="m-shoplistsAddItem__list">
                                                            <div class="ps">
                                                                <div class="ps__rail-x" style="left: 0px; bottom: 0px;">
                                                                    <div class="ps__thumb-x" tabindex="0" style="left: 0px; width: 0px;"></div>
                                                                </div>
                                                                <div class="ps__rail-y" style="top: 0px; right: 0px;">
                                                                    <div class="ps__thumb-y" tabindex="0" style="top: 0px; height: 0px;"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="m-createShoplists"><!---->
                                                            <form method="POST" class="m-createShoplists__form">
                                                                <div class="m-createShoplists__field"><label class="m-createShoplists__label">New List
                                                                        Name</label> <input name="new-list-name" autocomplete="off" placeholder="New List Name" type="text" aria-required="true" class="m-createShoplists__input a-input"></div>
                                                                <button type="button" class="m-createShoplists__button a-button">
                                                                    Create
                                                                </button> <!----> <!---->
                                                            </form> <!---->
                                                        </div> <!---->
                                                    </div>
                                                </div> <!---->
                                            </div>
                                        </div> <!----> <!---->
                                    </div>
                                </div>
                            </div>
                            <div class="o-productDetails__desc -mobile">A modern mug that is full of sophistication.
                            </div>
                            <div class="block md:hidden mb-15">
                                <div></div>
                            </div> <!----> <!---->
                        </div> <!---->
                    </section>
                </div>
            </div>
            <nav class="m-jumpLinks">
                <ul class="m-jumpLinks__list">
                    <li class="m-jumpLinks__item"><a href="#section-pdp-about" data-smooth-scroll="500" class="m-jumpLinks__link"><span class="m-jumpLinks__title -mobile">About</span> <span class="m-jumpLinks__title -standard">About this product</span></a></li> <!---->
                    <li class="m-jumpLinks__item -reviews hidden"><a href="#section-pdp-reviews" data-smooth-scroll="1000" class="m-jumpLinks__link"><span class="m-jumpLinks__title -standard">Reviews</span></a></li> <!---->
                </ul>
            </nav>
            <section id="section-pdp-about" class="w-full max-w-contain mx-auto">
                <header class="pb-40 sr-only">
                    <h2 class="text-3xl text-gray-150 uppercase font-bold leading-base"><span class="block">About</span>
                    </h2>
                </header>
                <div>
                    <div id="textLongDescription">
                        <div class="font-light px-10">
                          ${escapeHtml(long)}
                        </div>
                    </div>
                </div>
            </section>
    </main></div>
    


</body></html>`;
}

/* ==== DEFAULT EXPORT: React component that shows the iframe ==== */
export default function PreviewPane({
  product,
  culture = "en-US",
}: {
  product: ProductForm | null;
  culture?: string;
}) {
  // Compute the iframe document when inputs change
  const html = React.useMemo(() => {
    if (!product) return `<!doctype html><html><body style="margin:0;font-family:sans-serif">
      <div style="padding:16px">No product yet. Fill the form to see a live preview.</div>
    </body></html>`;
    return buildPreviewHtml(product, culture);
  }, [product, culture]);



  return (
    <aside className="mt-6 xl:mt-0 xl:flex-none xl:w-[860px] xl:sticky xl:top-20">
      <iframe
        title="Live Product Preview"
        srcDoc={html}
        className="w-full h-[900px] rounded-2xl border border-gray-200 shadow-sm px-5"
        // Add sandbox/allow as needed depending on your live.css or scripts
        // sandbox="allow-same-origin"
      />
    </aside>
  );
}
