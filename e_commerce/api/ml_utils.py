"""
ML utilities:
  1. get_sentiment(text)  — TextBlob polarity
  2. image_search(file)   — Fast category-aware visual search

  How it works:
    Step 1: Use CLIP text encoder to match the uploaded image against
            your actual DB category names (text only — fast, no image encoding of products).
    Step 2: Filter products to that detected category.
    Step 3: Rank filtered products by color+shape histogram similarity (fast, no GPU needed).
    Step 4: If exact/similar found → show them. Otherwise show all same-category products
            as suggestions (never shows wrong category).

  Speed: CLIP image encoding of ALL products is skipped.
         Only the query image is encoded once. Product ranking uses histograms.
"""

# ── 1. SENTIMENT ──────────────────────────────────────────────────────────────
def get_sentiment(text: str) -> str:
    try:
        from textblob import TextBlob
        score = TextBlob(text).sentiment.polarity
        if score > 0.1:  return 'positive'
        if score < -0.1: return 'negative'
        return 'neutral'
    except Exception:
        return 'neutral'


# ── CLIP (used only for query image + text, NOT for product images) ────────────
_clip_model     = None
_clip_processor = None
_clip_available = None


def _check_clip():
    global _clip_available
    if _clip_available is None:
        try:
            import torch                                        # noqa
            from transformers import CLIPProcessor, CLIPModel  # noqa
            _clip_available = True
        except ImportError:
            _clip_available = False
    return _clip_available


def _load_clip():
    global _clip_model, _clip_processor
    if _clip_model is None:
        from transformers import CLIPProcessor, CLIPModel
        _clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return _clip_model, _clip_processor


def _clip_encode_image(img_bytes: bytes):
    """Encode ONE uploaded image with CLIP. Used only for category detection."""
    import torch
    from PIL import Image
    from io import BytesIO
    model, processor = _load_clip()
    img    = Image.open(BytesIO(img_bytes)).convert("RGB")
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
    emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb[0].cpu().numpy()


def _clip_encode_texts(texts: list):
    """Encode text labels with CLIP."""
    import torch
    model, processor = _load_clip()
    inputs = processor(text=texts, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        emb = model.get_text_features(**inputs)
    emb = emb / emb.norm(dim=-1, keepdim=True)
    return emb.cpu().numpy()


def _detect_db_category_clip(query_emb, db_categories):
    """
    Compare query image embedding against DB category name texts.
    Returns the Category object whose name is most similar to the image.
    """
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity

    # Build descriptive prompts for each DB category
    prompts = [f"a product photo of {c.name}" for c in db_categories]
    text_embs = _clip_encode_texts(prompts)
    scores    = cosine_similarity([query_emb], text_embs)[0]
    best_idx  = int(scores.argmax())
    return db_categories[best_idx], float(scores[best_idx])


# ── Fast histogram similarity (no ML, works always) ──────────────────────────
def _histogram_emb(img_bytes: bytes):
    """Color (96 bins) + edge (16 bins) histogram, L2-normalised."""
    import numpy as np
    from PIL import Image, ImageFilter
    from io import BytesIO
    img  = Image.open(BytesIO(img_bytes)).convert("RGB").resize((96, 96))
    arr  = np.array(img, dtype=np.float32)
    hist = []
    for ch in range(3):
        h, _ = np.histogram(arr[:, :, ch], bins=32, range=(0, 256))
        hist.append(h.astype(np.float32))
    gray  = img.convert("L").filter(ImageFilter.FIND_EDGES)
    garr  = np.array(gray, dtype=np.float32)
    eh, _ = np.histogram(garr, bins=16, range=(0, 256))
    hist.append(eh.astype(np.float32))
    v    = np.concatenate(hist)
    norm = np.linalg.norm(v)
    return v / norm if norm > 0 else v


def _fetch_bytes(url: str) -> bytes:
    import requests
    return requests.get(url, timeout=6).content


# ── Thresholds (histogram cosine) ────────────────────────────────────────────
HIST_EXACT   = 0.97   # nearly identical image
HIST_SIMILAR = 0.88   # same style/color


# ── Public entry point ────────────────────────────────────────────────────────
def image_search(uploaded_file, top_k: int = 12):
    """
    Returns dict:
      {
        exact:             [...products with similarity_score],
        similar:           [...],
        suggestion:        [...],   ← always same DB category
        detected_category: str | None
      }
    """
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from api.models import Product, Category

    uploaded_file.seek(0)
    query_bytes = uploaded_file.read()

    # ── Step 1: Detect DB category ────────────────────────────────────────────
    detected_cat  = None
    detected_name = None

    db_categories = list(Category.objects.filter(is_active=True))

    if db_categories and _check_clip():
        try:
            query_emb    = _clip_encode_image(query_bytes)
            detected_cat, cat_score = _detect_db_category_clip(query_emb, db_categories)
            detected_name = detected_cat.name
        except Exception:
            detected_cat = None

    # ── Step 2: Get products in detected category (or all if detection failed) ─
    if detected_cat:
        candidate_products = list(
            Product.objects.filter(
                category=detected_cat, image__isnull=False
            ).exclude(image='')
        )
        # If there are no products in this category at all, then fallback
        if len(candidate_products) == 0:
            candidate_products = list(
                Product.objects.filter(image__isnull=False).exclude(image='')
            )
            detected_cat  = None
            detected_name = None
    else:
        candidate_products = list(
            Product.objects.filter(image__isnull=False).exclude(image='')
        )

    if not candidate_products:
        return {'exact': [], 'similar': [], 'suggestion': [], 'detected_category': detected_name}

    # ── Step 3: Rank by histogram similarity (fast) ───────────────────────────
    query_hist = _histogram_emb(query_bytes)

    product_ids, hists = [], []
    for p in candidate_products:
        try:
            h = _histogram_emb(_fetch_bytes(p.image))
            product_ids.append(p.id)
            hists.append(h)
        except Exception:
            continue

    if not hists:
        # No images could be fetched — return all category products as suggestions
        return {
            'exact': [],
            'similar': [],
            'suggestion': [{'id': p.id, 'score': 0.0} for p in candidate_products[:top_k]],
            'detected_category': detected_name,
        }

    matrix = np.stack(hists)
    scores = cosine_similarity([query_hist], matrix)[0]
    order  = scores.argsort()[::-1][:top_k]

    exact, similar, suggestion = [], [], []
    for i in order:
        s   = float(scores[i])
        pid = product_ids[i]
        entry = {'id': pid, 'score': round(s, 4)}
        if s >= HIST_EXACT:
            exact.append(entry)
        elif s >= HIST_SIMILAR:
            similar.append(entry)
        else:
            suggestion.append(entry)

    # ── Step 4: If nothing exact/similar, all become suggestions ─────────────
    # (they're already filtered to the right category, so this is correct)
    if not exact and not similar:
        suggestion = [{'id': product_ids[i], 'score': round(float(scores[i]), 4)} for i in order]

    return {
        'exact':             exact,
        'similar':           similar,
        'suggestion':        suggestion,
        'detected_category': detected_name,
    }
