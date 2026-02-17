"""
NBA Playoff Oracle - Data Fetcher
Fetches NBA data using nba_api for Azure ML Championship Prediction

Data includes: Teams, Players, Standings, Games, Statistics
"""

from nba_api.stats.static import teams, players
from nba_api.stats.endpoints import leaguestandings
from nba_api.live.nba.endpoints import scoreboard
import pandas as pd
import json
import os

# Current season
CURRENT_SEASON = "2025-26"

def get_all_teams():
    """Get all 30 NBA teams (from static data - no API call)"""
    print("Fetching all NBA teams...")
    nba_teams = teams.get_teams()
    df = pd.DataFrame(nba_teams)
    print(f"Found {len(df)} teams")
    return df

def get_all_players():
    """Get all active NBA players (from static data - no API call)"""
    print("Fetching all NBA players...")
    nba_players = players.get_active_players()
    df = pd.DataFrame(nba_players)
    print(f"Found {len(df)} active players")
    return df

def get_current_standings(season=CURRENT_SEASON):
    """Get current NBA standings"""
    print(f"Fetching standings for {season}...")
    try:
        standings = leaguestandings.LeagueStandings(
            league_id="00",
            season=season,
            season_type="Regular Season",
            timeout=60
        )
        df = standings.get_data_frames()[0]
        print(f"Found standings for {len(df)} teams")
        return df
    except Exception as e:
        print(f"Error fetching {season} standings: {e}")
        # Try previous season
        if season == CURRENT_SEASON:
            print("Trying 2024-25 season...")
            return get_current_standings("2024-25")
        return pd.DataFrame()

def get_live_scoreboard():
    """Get today's live scoreboard"""
    print("Fetching live scoreboard...")
    try:
        board = scoreboard.ScoreBoard()
        return board.get_dict()
    except Exception as e:
        print(f"Error: {e}")
        return {}

def build_championship_dataset():
    """
    Build a dataset for championship prediction using standings data
    """
    print("\n" + "="*60)
    print("Building Championship Prediction Dataset")
    print("="*60 + "\n")
    
    # Get all teams (static - fast)
    teams_df = get_all_teams()
    
    # Get all players (static - fast)
    players_df = get_all_players()
    
    # Get standings (single API call)
    standings_df = get_current_standings()
    
    # Build prediction dataset from standings
    if not standings_df.empty:
        # Select relevant columns for ML
        prediction_cols = [
            'TeamID', 'TeamCity', 'TeamName', 'Conference', 'ConferenceRecord',
            'PlayoffRank', 'Division', 'DivisionRank', 'WINS', 'LOSSES', 
            'WinPCT', 'HOME', 'ROAD', 'L10', 'ClinchedPlayoffBirth',
            'PointsPG', 'OppPointsPG', 'DiffPointsPG'
        ]
        
        # Only keep columns that exist
        available_cols = [c for c in prediction_cols if c in standings_df.columns]
        championship_df = standings_df[available_cols].copy()
        
        # Add team abbreviations from static data
        team_abbrev = teams_df[['id', 'abbreviation', 'full_name']].copy()
        team_abbrev.columns = ['TeamID', 'Abbreviation', 'FullName']
        championship_df = championship_df.merge(team_abbrev, on='TeamID', how='left')
        
        # Calculate championship score (simple model)
        championship_df['ChampionshipScore'] = (
            championship_df['WinPCT'] * 40 +
            (championship_df['DiffPointsPG'] if 'DiffPointsPG' in championship_df.columns else 0) * 2 +
            (31 - championship_df['PlayoffRank']) * 2
        )
        
        # Sort by championship score
        championship_df = championship_df.sort_values('ChampionshipScore', ascending=False)
        
    else:
        championship_df = pd.DataFrame()
    
    return championship_df, teams_df, players_df, standings_df

def save_data(championship_df, teams_df, players_df, standings_df, output_dir="data"):
    """Save all data to CSV and JSON files"""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Save teams
    teams_df.to_csv(f"{output_dir}/nba_teams.csv", index=False)
    teams_df.to_json(f"{output_dir}/nba_teams.json", orient="records", indent=2)
    print(f"Saved: {output_dir}/nba_teams.csv & .json")
    
    # Save players
    players_df.to_csv(f"{output_dir}/nba_players.csv", index=False)
    players_df.to_json(f"{output_dir}/nba_players.json", orient="records", indent=2)
    print(f"Saved: {output_dir}/nba_players.csv & .json")
    
    # Save standings
    if not standings_df.empty:
        standings_df.to_csv(f"{output_dir}/nba_standings.csv", index=False)
        standings_df.to_json(f"{output_dir}/nba_standings.json", orient="records", indent=2)
        print(f"Saved: {output_dir}/nba_standings.csv & .json")
    
    # Save championship prediction data
    if not championship_df.empty:
        championship_df.to_csv(f"{output_dir}/championship_prediction_data.csv", index=False)
        championship_df.to_json(f"{output_dir}/championship_prediction_data.json", orient="records", indent=2)
        print(f"Saved: {output_dir}/championship_prediction_data.csv & .json")
    
    print("\nAll data saved successfully!")

def main():
    """Main function to fetch and save all NBA data"""
    print("="*60)
    print("NBA Playoff Oracle - Data Fetcher")
    print("Using nba_api (github.com/swar/nba_api)")
    print("="*60)
    print(f"Target Season: {CURRENT_SEASON}")
    print("="*60 + "\n")
    
    # Build championship dataset
    championship_df, teams_df, players_df, standings_df = build_championship_dataset()
    
    # Display preview
    print("\n" + "="*60)
    print("Championship Prediction Rankings")
    print("="*60)
    if not championship_df.empty:
        preview = championship_df[['TeamName', 'Conference', 'WINS', 'LOSSES', 'WinPCT', 'PlayoffRank', 'ChampionshipScore']].head(15)
        print(preview.to_string(index=False))
    
    # Save data
    print("\n" + "="*60)
    print("Saving Data Files")
    print("="*60)
    save_data(championship_df, teams_df, players_df, standings_df)
    
    # Get live scores
    print("\n" + "="*60)
    print("Today's Games")
    print("="*60)
    live = get_live_scoreboard()
    if live and 'scoreboard' in live:
        games = live['scoreboard'].get('games', [])
        if games:
            for game in games:
                home = game.get('homeTeam', {})
                away = game.get('awayTeam', {})
                status = game.get('gameStatusText', '')
                print(f"{away.get('teamTricode', '???')} {away.get('score', 0)} @ "
                      f"{home.get('teamTricode', '???')} {home.get('score', 0)} - {status}")
        else:
            print("No games scheduled today")
    else:
        print("Could not fetch live scores")
    
    print("\n" + "="*60)
    print("COMPLETE!")
    print("="*60)
    print("Data files saved in 'data/' folder:")
    print("  - nba_teams.csv/json")
    print("  - nba_players.csv/json")
    print("  - nba_standings.csv/json")
    print("  - championship_prediction_data.csv/json")
    print("\nUse these files for Azure ML training!")

if __name__ == "__main__":
    main()
