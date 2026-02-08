import json
import os
import sqlite3

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "intfloat/multilingual-e5-base"

_model: SentenceTransformer | None = None
_db: sqlite3.Connection | None = None
# community_id - centroid ndarray, threshold float
_cache: dict[int, tuple[np.ndarray, float]] = {}


def _ensure_table():
    assert _db is not None
    _db.execute(
        """
        CREATE TABLE IF NOT EXISTS community_topics (
            community_id  INTEGER PRIMARY KEY,
            centroid      BLOB    NOT NULL,
            threshold     REAL    NOT NULL
        )
        """
    )
    _db.commit()


def _embed(text: str) -> np.ndarray:
    assert _model is not None
    return _model.encode(
        [f"passage: {text}"], normalize_embeddings=True
    )[0]


def _embed_many(texts: list[str]) -> np.ndarray:
    assert _model is not None
    return _model.encode(
        [f"passage: {t}" for t in texts], normalize_embeddings=True
    )


def _build_centroid(embeddings: np.ndarray) -> tuple[np.ndarray, float]:
    centroid = embeddings.mean(axis=0)
    norm = np.linalg.norm(centroid)
    if norm > 0:
        centroid /= norm

    sims = (embeddings @ centroid).ravel()
    mu, sigma = float(sims.mean()), float(sims.std())
    threshold = max(mu - 2 * sigma, 0.50)
    return centroid, threshold


def init(db_path: str | None = None):
    """Load the sentence-transformer model and open/create the DB"""
    global _model, _db, _cache

    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)

    if db_path is None:
        db_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "topic_guard.db"
        )

    _db = sqlite3.connect(db_path)
    _ensure_table()

    _cache = {}
    for community_id, centroid, treshold in _db.execute(
        "SELECT community_id, centroid, threshold FROM community_topics"
    ):
        _cache[community_id] = (np.frombuffer(
            centroid, dtype=np.float32).copy(), treshold)

    return True


def update_community(community_id: int, texts: list[str]):
    """Build centroid + threshold for a community from its posts"""
    assert _db is not None and _model is not None, "call init() first"

    if not texts:
        return False

    embeddings = _embed_many(texts)
    centroid, threshold = _build_centroid(embeddings)

    centroid_blob = centroid.astype(np.float32).tobytes()
    _db.execute(
        """
        INSERT INTO community_topics (community_id, centroid, threshold)
        VALUES (?, ?, ?)
        ON CONFLICT(community_id) DO UPDATE SET centroid=excluded.centroid, threshold=excluded.threshold
        """,
        (int(community_id), centroid_blob, threshold),
    )
    _db.commit()

    _cache[int(community_id)] = (centroid.astype(np.float32), threshold)
    return True


def check_topic(community_id: int, text: str):
    """Check if `text` matches the community topic"""
    assert _model is not None, "call init() first"

    community_id = int(community_id)

    # Allow all posts if there is no centroid for the community (no posts yet)
    if community_id not in _cache:
        return json.dumps({"match": True, "score": 1.0})

    centroid, threshold = _cache[community_id]
    text_embedding = _embed(text)
    score = float(text_embedding @ centroid)

    return json.dumps({"match": score >= threshold, "score": round(score, 4)})


def shutdown():
    """Persist and close the DB connection"""
    global _db
    if _db is not None:
        _db.close()
        _db = None

    return True
