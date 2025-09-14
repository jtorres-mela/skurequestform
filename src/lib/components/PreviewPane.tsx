"use client";

import * as React from "react";
import DOMPurify from "isomorphic-dompurify";

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

  recommendations?: RecommendationRow[];
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
<html lang="en"><head>

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
                                                                ${(product.stamp && product.stamp !== "") ? (() => {
                                                                    // Map stamp values to classes
                                                                    const stampClassMap: Record<string, string> = {
                                                                        "New": "-blueSolid",
                                                                        "Limited Time": "-grayOutlined",
                                                                        "While Supplies Last": "-redSolid",
                                                                        "Black Friday": "-goldSolid",
                                                                        "Special Offer": "-redOutlined"
                                                                        // Add more mappings as needed
                                                                    };
                                                                    const stampValue = String(product.stamp).trim();
                                                                    const className = stampClassMap[stampValue] || "-grayOutlined";
                                                                    return `<em class=\"a-stamp hidden md:inline-flex ${className}\">${escapeHtml(product.stamp)}</em>`;
                                                                })() : ""}
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
      ${DOMPurify.sanitize(long ?? "", {
        ALLOWED_TAGS: ["p","strong","b","em","i","u","ul","ol","li","br","a"],
        ALLOWED_ATTR: ["href","target","rel"],
      })}
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
        className="w-full h-[900px] rounded-2xl border border-gray-200 shadow-sm px-5 bg-white"
        // Add sandbox/allow as needed depending on your live.css or scripts
        // sandbox="allow-same-origin"
      />
    </aside>
  );
}
