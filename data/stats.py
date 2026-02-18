import pandas as pd
from nba_api.stats.endpoints import leaguedashteamstats

# Fetch current season stats
stats = leaguedashteamstats.LeagueDashTeamStats(season='2025-26')
df = stats.get_data_frames()[0]

# IMPORTANT: To make it an "Oracle", you need a column to predict.
# You can manually add a 'MadePlayoffs' column (1 or 0) based on last year's results 
# so the AI has something to learn from.
df.to_csv('nba_historical_data.csv', index=False)