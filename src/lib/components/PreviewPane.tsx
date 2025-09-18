"use client";

import * as React from "react";
import DOMPurify from "isomorphic-dompurify";
import { useCatalogPreview } from "@/lib/useCatalogPreview";

/*CDN Prefix */
const CDN_PREFIX = "https://mela-cdn-source-prod.s3.us-west-2.amazonaws.com/";

function cdnUrl(path?: string | null) {
  if (!path) return "/placeholder.png";
  // If already absolute, return as-is
  if (/^https?:\/\//i.test(path)) return path;
  // Ensure no leading slash after the prefix
  return CDN_PREFIX + path.replace(/^\/+/, "");
}

/* ==== Types (kept local; TS is structural so they'll match page.tsx) ==== */
type CultureRow = {
  cultureCode?: string;
  translatedName?: string;
  translatedShort?: string;
  translatedLong?: string;
};
type AccessoryRow = { accessorySku?: string; accessoryLabel?: string };
type RecommendationRow = { sku: string };
type DisplayItem = { sku: string; title: string; img: string; href?: string };
type Extras = { accessories?: DisplayItem[]; recommendations?: DisplayItem[] };

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
  imageUrl?: string; // e.g. "/10885h-01-enus.png"
  memberPrice?: string; // e.g. "$14.00"
  nonMemberPrice?: string; // e.g. "$16.00"
  points?: number; // e.g. 10

  recommendations?: RecommendationRow[];
  accessories: AccessoryRow[];
  cultures: CultureRow[];
};

/* ==== Helpers ==== */
function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}

function toDateSpan(on?: string | null, off?: string | null) {
  if (!on && !off) return "";
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");
  return `${fmt(on)} – ${fmt(off)}`;
}

function pickCulture(product: ProductForm, culture: string) {
  const row = product.cultures?.find((c) => (c.cultureCode || "").toLowerCase() === culture.toLowerCase());
  return {
    title: row?.translatedName || product.productName || "Untitled Product",
    short: row?.translatedShort || product.shortDescription || "",
    long: row?.translatedLong || product.longDescription || "",
  };
}

function renderAccessoriesSection(items: DisplayItem[]) {
  if (!items.length) return `<div class="o-productDetails__accessories mb-30 inline-block"><!----></div>`;
  const id = `acc-${Math.random().toString(36).slice(2)}`;
  const count = items.length;

  return `
<div class="o-productDetails__accessories">
  <div class="m-accessoriesAcc" button-label="Add To Cart">
    <div class="w-full md:flex">
      <button type="button"
        aria-label="Accessories (${count})"
        aria-expanded="true"
        aria-controls="${id}"
        class="m-accessoriesAcc__button">
        <span aria-hidden="true" class="m-accessoriesAcc__icon -opened">−</span>
        <span class="m-accessoriesAcc__textWrapper">
          <span class="m-accessoriesAcc__text -button">Accessories</span>
          (${count})
        </span>
      </button>
    </div>
    <div id="${id}" aria-hidden="false" class="m-accessoriesAcc__content">
      <ul>
        ${items
          .map(
            (x) => `
          <li class="m-accessoriesAcc__item">
            <div class="m-accessoriesAcc__media">
              <img src="${escapeHtml(x.img)}" aria-hidden="true" alt="${escapeHtml(x.title)}" class="m-accessoriesAcc__image">
            </div>
            <div class="m-accessoriesAcc__text -content">
              <span class="m-accessoriesAcc__link">${escapeHtml(x.title)}</span>
            </div>
            <p class="m-accessoriesAcc__info">
              <span>
                <button type="button" tabindex="0" class="a-actionIcon">
                  <span class="a-actionIcon__materialIcons">
                    <span aria-hidden="true" class="a-icon material-icons -inherit">add</span>
                    <span aria-hidden="true" class="a-icon material-icons -inherit">shopping_cart</span>
                    <span class="sr-only"></span>
                  </span>
                </button>
              </span>
            </p>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  </div>
</div>`;
}

function renderRecommendedSection(items: DisplayItem[]) {
  if (!items.length) return "";

  const total = items.length;
  const cols  = Math.min(5, total); // hard target: 5-up in preview

  return `
<div class="o-productCarouselVue" style="margin-top:24px;">
  <div class="o-productCarouselVue__header">
    <h3 class="o-productCarouselVue__title">RELATED TO THIS ITEM</h3>
  </div>

<style>
  /* Narrower slides + tight gutters */
  .js-reco-carousel .slick-list { margin: 0 -3px; }
  .js-reco-carousel .slick-slide { padding: 0 3px; box-sizing: border-box; height: auto; }
  .js-reco-carousel .slick-slide > div { height: 100%; }
  .js-reco-carousel .slick-track { display: flex; align-items: stretch; }

  /* Prevent inner blocks from forcing width */
  .js-reco-carousel .m-prodCard.-carousel,
  .js-reco-carousel .m-prodCard__row,
  .js-reco-carousel .m-prodCard__header,
  .js-reco-carousel .m-prodCard__body { min-width: 0 !important; }

  /* Card polish */
  .js-reco-carousel .m-prodCard.-carousel {
    margin: 0; background:#fff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,.04);
  }
  .js-reco-carousel .m-prodCard__heading { min-height: 3.2rem; }
  .js-reco-carousel .m-prodCard__hero { display:block; width:120px; max-width:100%; height:auto; margin:0 auto; }

  /* Hide dots (arrows only) */
  .js-reco-carousel .slick-dots { display: none !important; }

  /* Custom arrows (centered icon) */
  .js-reco-carousel .slick-prev, .js-reco-carousel .slick-next {
    position: absolute;                 /* be explicit */
    top: 50%; transform: translateY(-50%);
    width: 32px; height: 32px; border-radius: 9999px;
    background: rgba(255,255,255,.95); border:1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0,0,0,.06);
    display:flex; align-items:center; justify-content:center;
    padding: 0; line-height: 0; z-index: 2;
  }
  .js-reco-carousel .slick-prev { left: -16px; }
  .js-reco-carousel .slick-next { right: -16px; }
  .js-reco-carousel .slick-prev:before, .js-reco-carousel .slick-next:before { content: none; }

  .js-reco-carousel .slick-prev svg, .js-reco-carousel .slick-next svg {
    display:block; width:18px; height:18px; fill:#111; opacity:.85; pointer-events:none;
  }
  /* tiny optical nudge so chevrons look perfectly centered */
  .js-reco-carousel .slick-prev svg { transform: translateX(1px); }
  .js-reco-carousel .slick-next svg { transform: translateX(-1px); }

  .js-reco-carousel .slick-prev.slick-disabled,
  .js-reco-carousel .slick-next.slick-disabled { opacity:.4; }
</style>


  <div class="o-productCarouselVue__wrapper" aria-label="RELATED TO THIS ITEM" role="region" aria-roledescription="carousel">
    <div class="js-reco-carousel" data-total="${total}" data-cols="${cols}">
      ${items.map(x => `
        <div>
          <article class="m-prodCard -carousel" style="width:100%;">
            <div class="m-prodCard__row -content">
              <div class="m-prodCard__header">
                <div class="m-prodCard__media">
                  <img src="${escapeHtml(x.img)}" alt="${escapeHtml(x.title)}" class="m-prodCard__hero" />
                </div>
                <div class="m-prodCard__heading">
                  <em class="m-prodCard__title">${escapeHtml(x.title)}</em>
                </div>
              </div>
              <div class="m-prodCard__body">
                <div class="m-prodCard__content -bottom">
                  <div class="m-prodCard__pricing">
                    <span class="m-prodCard__text -price -mdBold"><span>$00.00</span></span>
                  </div>
                  <div class="m-prodCard__points">
                    <span class="m-prodCard__text -points">0 Points</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="m-prodCard__row -actions">
              <div class="m-prodCard__button -shelfToggle">
                <button type="button" class="a-button justify-center -shelfToggle w-auto">
                  <span class="sr-only md:not-sr-only md:block">SELECT</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      `).join("")}
    </div>
  </div>
</div>

<script>
(function initSlickForceFive(){
  function run(){
    if (!window.jQuery || !jQuery.fn || !jQuery.fn.slick) return setTimeout(run, 50);
    var $ = jQuery, $el = $('.js-reco-carousel');
    if (!$el.length) return;

    var total = parseInt($el.data('total'), 10) || 0;
    var cols  = parseInt($el.data('cols'), 10)  || 1; // force up to 5

    var prevA = '<button type="button" class="slick-prev" aria-label="Previous">'+
                '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M15.41 16.59 10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>'+
                '</button>';
    var nextA = '<button type="button" class="slick-next" aria-label="Next">'+
                '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>'+
                '</button>';

    if (!$el.hasClass('slick-initialized')) {
      $el.slick({
        slidesToShow: cols,
        slidesToScroll: 1,
        infinite: false,
        arrows: total > cols,
        dots: false,
        swipeToSlide: true,
        touchThreshold: 12,
        lazyLoad: 'ondemand',
        adaptiveHeight: false,
        prevArrow: prevA,
        nextArrow: nextA
      });
    } else {
      $el.slick('slickSetOption', 'slidesToShow', cols, true);
      $el.slick('slickSetOption', 'arrows', total > cols, true);
    }
  }

  window.addEventListener('load', run);
})();
</script>
`;
}



/** PURE builder: no hooks here */
function buildPreviewHtml(product: ProductForm, culture: string, extras: Extras = {}) {
  const { title, short, long } = pickCulture(product, culture);

  const saleWindow = toDateSpan(product.onSaleDate, product.offSaleDate);
  const uomUS = [product.uomValueUS, product.uomTitleUS].filter(Boolean).join(" ");
  const uomCA = [product.uomValueCA, product.uomTitleCA].filter(Boolean).join(" ");
  const uom = [uomUS, uomCA].filter(Boolean).join(" | ");

  const img = cdnUrl(product.imageUrl);
  const member = product.memberPrice || "$18.25";
  const nonMember = product.nonMemberPrice || "$27.00";
  const points = typeof product.points === "number" ? product.points : 10;

  const accessoriesHtml = renderAccessoriesSection(extras.accessories ?? []);
  const recommendedHtml = renderRecommendedSection(extras.recommendations ?? []);


  return `<!doctype html>
<html lang="en"><head>
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,700,700i,900|Material+Icons&amp;display=swap" rel="stylesheet">
  <link href="live.css" rel="stylesheet">
  <link rel="stylesheet" href="/live-preview-tweaks.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick-theme.css">
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/slick-carousel@1.8.1/slick/slick.min.js"></script>

</head>
<body>
  <div class="right">
    <main id="mainContent" role="main" class="relative">
      <div><div></div></div>
      <div class="w-full max-w-xl px-8 mb-40 mx-auto md:mt-30 lg:px-20">
        <div class="preComponentLoader -productDetails -preComponentLoaded">
          <section id="section-pdp-top" class="o-productDetails">
            <div class="md:hidden">
              <h1 class="o-productDetails__heading">${escapeHtml(title)}</h1>
              <p class="o-productDetails__details">
                <span>Item: ${escapeHtml(product.sku || "")}</span>
                <span class="px-3"> | </span>
                <span>Size: <span class="font-bold">${escapeHtml(uom)}</span></span>
              </p>
            </div>

            <div class="w-full mt-20 mb-15 md:block md:w-1_2 md:my-0 md:pr-20 lg:pr-40">
              <div>
                <div>
                  <div aria-label="Media Gallery" class="m-prodMedia">
                    <div aria-hidden="false" class="m-prodMedia__wrapper -thumbs">
                      <nav class="m-prodMedia__actions -thumbs"><div class="m-prodMedia__arrows"></div></nav>
                      <div class="m-prodMedia__list -thumbs slick-vertical slick-initialized slick-slider">
                        <div class="slick-list" style="height: 430px;">
                          <div class="slick-track" style="opacity:1;height:86px;transform:translate3d(0px,0px,0px);">
                            <div class="slick-slide slick-current slick-active active" data-slick-index="0" aria-hidden="false" style="width:109px;">
                              <div><button class="m-prodMedia__thumb" tabindex="0" style="width:100%;display:inline-block;"><img src="${escapeHtml(img)}" alt="Primary Image" class="noLazy loading" data-ll-status="loading"></button></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div id="m-prodMedia" aria-label="Media Gallery" class="m-prodMedia__wrapper -images">
                      <nav class="m-prodMedia__actions -images">
                        <div class="m-prodMedia__counter"><span class="sr-only">Media </span>1 Of 1</div>
                        <div class="m-prodMedia__arrows"></div>
                      </nav>
                      <div class="m-prodMedia__zoom">
                        <div class="m-prodMedia__zoomImage">
                          <img src="${escapeHtml(img)}" alt="..." class="m-prodMedia__image" />
                        </div>
                      </div>
                      <div class="m-prodMedia__list -images slick-initialized slick-slider">
                        <div class="slick-list">
                          <div class="slick-track">
                            <div class="slick-slide slick-current slick-active" data-slick-index="0" aria-hidden="false" style="width:436px;">
                              <div>
                                <div data-zoom="${escapeHtml(img)}" class="m-prodMedia__mediaItem" style="width:100%;display:inline-block;" tabindex="0">
                                  <div class="m-prodMedia__mediaItem__contain">
                                    <img src="${escapeHtml(img)}" class="m-prodMedia__image" alt="${escapeHtml(title)}" />
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
                            <div class="m-prodMedia__arrows -lightbox"></div>
                            <button class="m-prodMedia__close">Close modal</button>
                          </nav>
                          <div class="m-prodMedia__list -lightbox slick-initialized slick-slider">
                            <div class="slick-list draggable">
                              <div class="slick-track" style="opacity:1;width:0;transform:translate3d(0px,0px,0px);">
                                <div class="slick-slide slick-current slick-active" data-slick-index="0" aria-hidden="false" style="width:0;">
                                  <div>
                                    <div class="m-prodMedia__lightboxImage" style="width:100%;display:inline-block;">
                                      <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" class="m-prodMedia__lightboxZoom" data-src="${escapeHtml(img)}">
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
              </div>
            </div>

            <div category="" class="o-productDetails__info">
              <div class="hidden md:block">
                <h1 class="o-productDetails__heading">${escapeHtml(title)}</h1>
                <p class="o-productDetails__details">
                  Item: ${escapeHtml(product.sku || "")}
                  <span class="px-3"> | </span>
                  Size: <span class="font-bold">${escapeHtml(uom)}</span>
                </p>
                ${
                  product.stamp && product.stamp !== ""
                    ? (() => {
                        const stampClassMap: Record<string, string> = {
                          New: "-blueSolid",
                          "Limited Time": "-grayOutlined",
                          "While Supplies Last": "-redSolid",
                          "Black Friday": "-goldSolid",
                          "Special Offer": "-redOutlined",
                        };
                        const stampValue = String(product.stamp).trim();
                        const className = stampClassMap[stampValue] || "-grayOutlined";
                        return `<em class="a-stamp hidden md:inline-flex ${className}">${escapeHtml(product.stamp!)}</em>`;
                      })()
                    : ""
                }
              </div>

              <div class="o-productDetails__desc -desktop">${escapeHtml(short)}</div>

              <div class="o-productDetails__price -desktop">
                <div class="m-productDetailPrice">
                  <div>
                    <p><span class="sr-only">Preferred value at </span>
                      <span class="m-productDetailPrice__primaryPrice">$00.00</span>
                      <span aria-hidden="true" class="m-productDetailPrice__primaryLabel">Member</span>
                    </p>
                  </div>
                  <div>
                    <p class="m-productDetailPrice__secondaryPriceAndLabel">
                      <span class="sr-only">Non-Member </span>$00.00
                      <span aria-hidden="true"> Non-Member</span>
                    </p>
                  </div>
                </div>
                <p class="o-productDetails__points"><span class="sr-only">Earn</span>0<span class="sr-only"> points with this purchase</span> Points</p>
              </div>

              <hr class="o-productDetails__divider">

              <div class="o-productDetails__price -mobile">
                <div class="m-productDetailPrice">
                  <div>
                    <p><span class="sr-only">Preferred value at </span>
                      <span class="m-productDetailPrice__primaryPrice">$14.00</span>
                      <span aria-hidden="true" class="m-productDetailPrice__primaryLabel">Member</span>
                    </p>
                  </div>
                  <div>
                    <p class="m-productDetailPrice__secondaryPriceAndLabel">
                      <span class="sr-only">Non-Member </span>$16.00
                      <span aria-hidden="true"> Non-Member</span>
                    </p>
                  </div>
                </div>
                <p class="o-productDetails__points"><span class="sr-only">Earn</span>0<span class="sr-only"> points with this purchase</span> Points</p>
              </div>

              <div class="relative">
                ${accessoriesHtml}
                <div class="o-productDetails__addList">
                  <!-- (unchanged) -->
                </div>
              </div>

              <div class="o-productDetails__desc -mobile">${escapeHtml(short)}</div>
            </div>
          </section>
        </div>
      </div>

      <nav class="m-jumpLinks">
        <ul class="m-jumpLinks__list">
          <li class="m-jumpLinks__item"><a href="#section-pdp-about" data-smooth-scroll="500" class="m-jumpLinks__link"><span class="m-jumpLinks__title -mobile">About</span> <span class="m-jumpLinks__title -standard">About this product</span></a></li>
          <li class="m-jumpLinks__item -reviews hidden"><a href="#section-pdp-reviews" data-smooth-scroll="1000" class="m-jumpLinks__link"><span class="m-jumpLinks__title -standard">Reviews</span></a></li>
        </ul>
      </nav>

      <section id="section-pdp-about" class="w-full max-w-contain mx-auto">
        <header class="pb-40 sr-only">
          <h2 class="text-3xl text-gray-150 uppercase font-bold leading-base"><span class="block">About</span></h2>
        </header>
        <div id="textLongDescription">
          <div class="font-light px-10">
            ${DOMPurify.sanitize(product.longDescription ?? "", {
              ALLOWED_TAGS: ["p", "strong", "b", "em", "i", "u", "ul", "ol", "li", "br", "a"],
              ALLOWED_ATTR: ["href", "target", "rel"],
            })}
          </div>
        </div>
      </section>

      ${recommendedHtml}

    </main>
  </div>
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
  // 1) Collect all SKUs to look up (even if product is null, call hook with [])
  const skusForLookup = React.useMemo(() => {
    if (!product) return [] as string[];
    const acc = (product.accessories ?? []).map((a) => (a.accessorySku || "").toUpperCase());
    const rec = (product.recommendations ?? []).map((r) => (r.sku || "").toUpperCase());
    return Array.from(new Set([...acc, ...rec].filter(Boolean)));
  }, [product?.accessories, product?.recommendations, !!product]);

  // 2) Fetch catalog metadata once (HOOK AT TOP LEVEL)
  const { bySku: catalog } = useCatalogPreview(skusForLookup);

  // 3) Build iframe HTML (pure)
  const html = React.useMemo(() => {
    if (!product) {
      return `<!doctype html><html><body style="margin:0;font-family:sans-serif">
        <div style="padding:16px">No product yet. Fill the form to see a live preview.</div>
      </body></html>`;
    }

    const accessories: DisplayItem[] = (product.accessories ?? [])
      .map((a) => {
        const sku = (a.accessorySku || "").toUpperCase();
        if (!sku) return null;
        const meta = catalog[sku];
        return {
          sku,
          title: a.accessoryLabel || meta?.productTitle || sku,
          img: cdnUrl(meta?.imagePath),
        };
      })
      .filter(Boolean) as DisplayItem[];

    const recommendations: DisplayItem[] = (product.recommendations ?? [])
      .map((r) => {
        const sku = (r.sku || "").toUpperCase();
        if (!sku) return null;
        const meta = catalog[sku];
        return {
          sku,
          title: meta?.productTitle || sku,
          img: cdnUrl(meta?.imagePath),
        };
      })
      .filter(Boolean) as DisplayItem[];

    return buildPreviewHtml(product, culture, { accessories, recommendations });
  }, [product, culture, catalog]);

  return (
    <aside className="mt-6 xl:mt-0 xl:flex-none xl:w-[860px] xl:sticky xl:top-20">
      <iframe
        title="Live Product Preview"
        srcDoc={html}
        className="w-full h-[900px] rounded-2xl border border-gray-200 shadow-sm px-5 bg-white"
      />
    </aside>
  );
}
