import torch
import torch.nn as nn
from datetime import datetime
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from database import User, Movie, WatchHistory

# Simulated Transformer Ranker for Advanced Recommendation
class TransformerRankingModel(nn.Module):
    def __init__(self, num_movies, embed_size=64, num_heads=4, num_layers=2):
        super(TransformerRankingModel, self).__init__()
        # Embeddings for movies, time of day, and languages
        self.movie_embedding = nn.Embedding(num_movies, embed_size)
        self.time_embedding = nn.Embedding(24, embed_size)
        
        encoder_layers = nn.TransformerEncoderLayer(d_model=embed_size, nhead=num_heads, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers=num_layers)
        
        # Scoring layer
        self.scoring_mlp = nn.Sequential(
            nn.Linear(embed_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
    def forward(self, movie_seq, time_context):
        # movie_seq shape: (batch_size, seq_len)
        movie_embeds = self.movie_embedding(movie_seq)
        
        # Add temporal context
        time_embeds = self.time_embedding(time_context).unsqueeze(1).expand_as(movie_embeds)
        context_embeds = movie_embeds + time_embeds
        
        # Self-attention over history
        transformer_out = self.transformer_encoder(context_embeds)
        
        # Pool output (e.g., mean pooling)
        pooled_out = transformer_out.mean(dim=1)
        
        # Score
        return self.scoring_mlp(pooled_out)

def get_temporal_context():
        """Returns hour of the day for mood/time-based personalization"""
        return datetime.now().hour

def rank_movies(user_id: int, candidate_movies: list, db: Session):
    """
    Advanced Multilayer Recommendation Logic
    1. Watch-Time Weighting
    2. Multilingual Adaptive Personalization
    3. Temporal Context
    4. Deep Ranking
    """
    
    # In a real app, this model would be trained and loaded.
    # We initialize a mock one for demonstration of the architecture.
    model = TransformerRankingModel(num_movies=10000)
    model.eval()
    
    # 1. Fetch User History & Watch-Time Weighting
    history = db.query(WatchHistory).filter(WatchHistory.user_id == user_id).all()
    user_languages = {}
    
    # Weight movies based on percentage watched (>80% = high weight, <10% = negative)
    weighted_history_ids = []
    for h in history:
        if h.progress_percent >= 80:
            weighted_history_ids.extend([h.movie_id] * 3) # Triple weight
        elif h.progress_percent > 10:
            weighted_history_ids.append(h.movie_id)
            
        # Collect language consumption patterns
        movie = db.query(Movie).filter(Movie.movie_id == h.movie_id).first()
        if movie and movie.languages:
            for lang in movie.languages.split(","):
                user_languages[lang] = user_languages.get(lang, 0) + (h.progress_percent / 100)
                
    # Normalize language preferences (Multilingual Adaptive Personalization)
    top_languages = sorted(user_languages, key=user_languages.get, reverse=True)
    primary_lang = top_languages[0] if top_languages else "English"
    
    
    # 2. Mood & Time-Based Rules
    hour = get_temporal_context()
    is_late_night = hour >= 22 or hour <= 4
    is_morning = 6 <= hour <= 11
    
    # Sequence of past viewed movies
    seq_input = torch.tensor([weighted_history_ids[-10:] if weighted_history_ids else [0]])
    time_input = torch.tensor([hour])

    ranked_candidates = []
    
    # Note: We simulate the batch scoring for simplicity
    with torch.no_grad():
        baseline_score = model(seq_input, time_input).item()

    # Apply hybrid heuristics on top of deep embeddings
    for movie in candidate_movies:
        score = baseline_score + random.uniform(0, 2.0) # Mock model output
        
        # Time-based penalties/boosts
        genres = movie.get("genres", [])
        if is_late_night and any(g in genres for g in ["Horror", "Thriller", "Action"]):
            score += 1.5
        elif is_morning and any(g in genres for g in ["Comedy", "Family", "Animation"]):
            score += 1.2
            
        # Multilingual boost
        movie_langs = movie.get("languages", [])
        if primary_lang in movie_langs:
            score += 2.0
            movie["preferred_language_match"] = primary_lang
            
        ranked_candidates.append({
            "movie": movie,
            "score": score
        })
        
    # Sort by hybrid score
    ranked_candidates.sort(key=lambda x: x["score"], reverse=True)
    return [item["movie"] for item in ranked_candidates]
