"""
NBA Playoff Oracle - Complete Data Fetcher
Fetches all NBA data including:
- Daily Leaders (points, rebounds, assists, blocks, steals, etc.)
- Season Leaders (per game stats)
- All Players with stats
- Current Standings
- Championship Predictions

Uses nba_api library (pip install nba_api)
"""

from nba_api.stats.endpoints import (
    leaguestandings, 
    leagueleaders,
    playergamelogs,
    playerindex,
    commonallplayers,
    leaguedashplayerstats
)
from nba_api.stats.static import teams, players
import json
from datetime import datetime
import os
import time

# Configuration
CURRENT_SEASON = "2025-26"
SEASON_TYPE = "Regular Season"
OUTPUT_DIR = "data"

# Ensure data directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def log(message):
    """Print timestamped log message"""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def save_json(data, filename):
    """Save data to JSON file"""
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    log(f"Saved: {filepath}")

# ===== 1. FETCH STANDINGS =====
def fetch_standings():
    """Fetch current NBA standings for both conferences"""
    log("Fetching NBA Standings...")
    try:
        standings = leaguestandings.LeagueStandings(
            season=CURRENT_SEASON,
            season_type=SEASON_TYPE
        )
        data = standings.get_normalized_dict()
        
        result = {
            'Eastern': [],
            'Western': [],
            'fetched_at': datetime.now().isoformat(),
            'season': CURRENT_SEASON
        }
        
        for team in data.get('Standings', []):
            team_info = {
                'rank': team.get('PlayoffRank', 0),
                'team_id': team.get('TeamID'),
                'team_name': team.get('TeamName'),
                'team_city': team.get('TeamCity'),
                'conference': team.get('Conference'),
                'wins': team.get('WINS', 0),
                'losses': team.get('LOSSES', 0),
                'win_pct': team.get('WinPCT', 0),
                'home_record': team.get('HOME', '0-0'),
                'road_record': team.get('ROAD', '0-0'),
                'conf_record': team.get('ConferenceRecord', '-'),
                'div_record': team.get('DivisionRecord', '-'),
                'ot_record': team.get('OT', '0-0'),
                'last_10': team.get('L10', '0-0'),
                'streak': team.get('CurrentStreak', 0),
                'games_back': team.get('ConferenceGamesBack', 0),
                'points_pg': team.get('PointsPG', 0),
                'opp_points_pg': team.get('OppPointsPG', 0),
                'diff_points': team.get('DiffPointsPG', 0),
            }
            
            if team.get('Conference') == 'East':
                result['Eastern'].append(team_info)
            else:
                result['Western'].append(team_info)
        
        # Sort by wins
        result['Eastern'].sort(key=lambda x: (-x['wins'], x['losses']))
        result['Western'].sort(key=lambda x: (-x['wins'], x['losses']))
        
        # Update ranks
        for i, team in enumerate(result['Eastern'], 1):
            team['rank'] = i
        for i, team in enumerate(result['Western'], 1):
            team['rank'] = i
        
        save_json(result, 'nba_standings_live.json')
        log(f"  Eastern: {len(result['Eastern'])} teams | Western: {len(result['Western'])} teams")
        return result
    except Exception as e:
        log(f"  Error: {e}")
        return {'Eastern': [], 'Western': []}

# ===== 2. FETCH SEASON LEADERS =====
def fetch_season_leaders():
    """Fetch season statistical leaders"""
    log("Fetching Season Leaders...")
    try:
        leaders = leagueleaders.LeagueLeaders(
            season=CURRENT_SEASON,
            season_type_all_star=SEASON_TYPE,
            per_mode48='PerGame'
        )
        data = leaders.get_dict()
        
        result_set = data.get('resultSet', {})
        headers = result_set.get('headers', [])
        rows = result_set.get('rowSet', [])
        
        players_data = []
        for row in rows:
            player_dict = dict(zip(headers, row))
            players_data.append({
                'rank': player_dict.get('RANK', 0),
                'player_id': player_dict.get('PLAYER_ID'),
                'player_name': player_dict.get('PLAYER'),
                'team_id': player_dict.get('TEAM_ID'),
                'team': player_dict.get('TEAM'),
                'gp': player_dict.get('GP', 0),
                'min': player_dict.get('MIN', 0),
                'pts': player_dict.get('PTS', 0),
                'reb': player_dict.get('REB', 0),
                'ast': player_dict.get('AST', 0),
                'stl': player_dict.get('STL', 0),
                'blk': player_dict.get('BLK', 0),
                'fgm': player_dict.get('FGM', 0),
                'fga': player_dict.get('FGA', 0),
                'fg_pct': player_dict.get('FG_PCT', 0),
                'fg3m': player_dict.get('FG3M', 0),
                'fg3a': player_dict.get('FG3A', 0),
                'fg3_pct': player_dict.get('FG3_PCT', 0),
                'ftm': player_dict.get('FTM', 0),
                'fta': player_dict.get('FTA', 0),
                'ft_pct': player_dict.get('FT_PCT', 0),
                'tov': player_dict.get('TOV', 0),
                'eff': player_dict.get('EFF', 0),
            })
        
        # Calculate fantasy points for each player
        # NBA Fantasy formula: PTS + 1.2*REB + 1.5*AST + 3*STL + 3*BLK - TOV
        for player in players_data:
            player['fantasy_pts'] = round(
                player['pts'] + 
                1.2 * player['reb'] + 
                1.5 * player['ast'] + 
                3 * player['stl'] + 
                3 * player['blk'] - 
                player['tov'], 1
            )
        
        # Create categorized leaders with NBA.com-style minimum attempt filters
        # FG%: min 300 FGA or ~6 FGA per game
        # 3P%: min 1.5 3PA per game (roughly 82+ attempts)
        # FT%: min 2.0 FTA per game
        season_leaders = {
            'fetched_at': datetime.now().isoformat(),
            'season': CURRENT_SEASON,
            'points': sorted(players_data, key=lambda x: -x['pts'])[:10],
            'rebounds': sorted(players_data, key=lambda x: -x['reb'])[:10],
            'assists': sorted(players_data, key=lambda x: -x['ast'])[:10],
            'steals': sorted(players_data, key=lambda x: -x['stl'])[:10],
            'blocks': sorted(players_data, key=lambda x: -x['blk'])[:10],
            # FG%: minimum 6 FGA per game to qualify
            'fg_pct': sorted([p for p in players_data if p['fga'] >= 6.0], key=lambda x: -x['fg_pct'])[:10],
            # 3P%: minimum 1.5 3PA per game to qualify  
            'fg3_pct': sorted([p for p in players_data if p['fg3a'] >= 1.5], key=lambda x: -x['fg3_pct'])[:10],
            # FT%: minimum 2.0 FTA per game to qualify
            'ft_pct': sorted([p for p in players_data if p['fta'] >= 2.0], key=lambda x: -x['ft_pct'])[:10],
            # 3PM: sorted by TOTAL 3-pointers made (fg3m * gp)
            'fg3m': sorted(players_data, key=lambda x: -(x['fg3m'] * x['gp']))[:10],
            'ftm': sorted(players_data, key=lambda x: -(x['ftm'] * x['gp']))[:10],
            'efficiency': sorted(players_data, key=lambda x: -x['eff'])[:10],
            # Fantasy Points Per Game
            'fantasy_pts': sorted(players_data, key=lambda x: -x['fantasy_pts'])[:10],
            'all_players': players_data
        }
        
        save_json(season_leaders, 'nba_season_leaders.json')
        log(f"  Found {len(players_data)} players with season stats")
        return season_leaders
    except Exception as e:
        log(f"  Error: {e}")
        return {}

# ===== 3. FETCH ALL PLAYERS =====
def fetch_all_players():
    """Fetch all active NBA players with biographical info"""
    log("Fetching All Players with Bio Info...")
    try:
        # Use playerindex endpoint for biographical data
        player_idx = playerindex.PlayerIndex(
            season=CURRENT_SEASON,
            league_id='00'  # NBA
        )
        data = player_idx.get_dict()
        
        result_sets = data.get('resultSets', [])
        if not result_sets:
            # Fallback to commonallplayers
            all_players_data = commonallplayers.CommonAllPlayers(
                is_only_current_season=1,
                league_id='00',
                season=CURRENT_SEASON
            )
            data = all_players_data.get_dict()
            result_sets = data.get('resultSets', [])
        
        if not result_sets:
            return []
            
        headers = result_sets[0].get('headers', [])
        rows = result_sets[0].get('rowSet', [])
        
        players_data = []
        for row in rows:
            player_dict = dict(zip(headers, row))
            # Handle different column names from different endpoints
            players_data.append({
                'id': player_dict.get('PERSON_ID') or player_dict.get('PLAYER_ID'),
                'full_name': f"{player_dict.get('PLAYER_FIRST_NAME', '')} {player_dict.get('PLAYER_LAST_NAME', '')}".strip() or player_dict.get('PLAYER_NAME', ''),
                'first_name': player_dict.get('PLAYER_FIRST_NAME', ''),
                'last_name': player_dict.get('PLAYER_LAST_NAME', ''),
                'team_id': player_dict.get('TEAM_ID'),
                'team_abbreviation': player_dict.get('TEAM_ABBREVIATION', player_dict.get('TEAM_SLUG', '')),
                'jersey_number': player_dict.get('JERSEY_NUMBER', ''),
                'position': player_dict.get('POSITION', ''),
                'height': player_dict.get('HEIGHT', ''),
                'weight': player_dict.get('WEIGHT', ''),
                'college': player_dict.get('COLLEGE', ''),
                'country': player_dict.get('COUNTRY', 'USA'),
                'draft_year': player_dict.get('DRAFT_YEAR', ''),
                'draft_round': player_dict.get('DRAFT_ROUND', ''),
                'draft_number': player_dict.get('DRAFT_NUMBER', ''),
                'is_active': True
            })
        
        # Sort by last name
        players_data.sort(key=lambda x: (x.get('last_name') or x.get('full_name', '')).split()[-1] if x.get('full_name') else '')
        
        save_json(players_data, 'nba_players.json')
        log(f"  Found {len(players_data)} players with bio info")
        return players_data
    except Exception as e:
        log(f"  Error: {e}")
        # Fallback to static data
        try:
            all_players = players.get_active_players()
            players_data = []
            for player in all_players:
                players_data.append({
                    'id': player.get('id'),
                    'full_name': player.get('full_name'),
                    'first_name': player.get('first_name'),
                    'last_name': player.get('last_name'),
                    'is_active': player.get('is_active', True)
                })
            players_data.sort(key=lambda x: x['last_name'])
            save_json(players_data, 'nba_players.json')
            log(f"  Fallback: Found {len(players_data)} players (basic info only)")
            return players_data
        except:
            return []

# ===== 4. FETCH PLAYER STATS (Detailed) =====
def fetch_player_stats(bio_data=None):
    """Fetch detailed player stats for all players and merge with bio data"""
    log("Fetching Detailed Player Stats...")
    try:
        stats = leaguedashplayerstats.LeagueDashPlayerStats(
            season=CURRENT_SEASON,
            season_type_all_star=SEASON_TYPE,
            per_mode_detailed='PerGame'
        )
        data = stats.get_dict()
        
        result_sets = data.get('resultSets', [])
        if not result_sets:
            return []
        
        headers = result_sets[0].get('headers', [])
        rows = result_sets[0].get('rowSet', [])
        
        # Build bio lookup dictionary
        bio_lookup = {}
        if bio_data:
            for player in bio_data:
                pid = player.get('id')
                if pid:
                    bio_lookup[pid] = player
        
        players_data = []
        for row in rows:
            player_dict = dict(zip(headers, row))
            player_id = player_dict.get('PLAYER_ID')
            bio = bio_lookup.get(player_id, {})
            
            players_data.append({
                'player_id': player_id,
                'player_name': player_dict.get('PLAYER_NAME'),
                'team_id': player_dict.get('TEAM_ID'),
                'team_abbreviation': player_dict.get('TEAM_ABBREVIATION'),
                'age': player_dict.get('AGE', 0),
                'gp': player_dict.get('GP', 0),
                'wins': player_dict.get('W', 0),
                'losses': player_dict.get('L', 0),
                'min': player_dict.get('MIN', 0),
                'pts': player_dict.get('PTS', 0),
                'reb': player_dict.get('REB', 0),
                'ast': player_dict.get('AST', 0),
                'stl': player_dict.get('STL', 0),
                'blk': player_dict.get('BLK', 0),
                'tov': player_dict.get('TOV', 0),
                'fg_pct': player_dict.get('FG_PCT', 0),
                'fg3_pct': player_dict.get('FG3_PCT', 0),
                'ft_pct': player_dict.get('FT_PCT', 0),
                'plus_minus': player_dict.get('PLUS_MINUS', 0),
                'fantasy_pts': player_dict.get('NBA_FANTASY_PTS', 0),
                # Bio data merged from players list
                'jersey_number': bio.get('jersey_number', ''),
                'position': bio.get('position', ''),
                'height': bio.get('height', ''),
                'weight': bio.get('weight', ''),
                'college': bio.get('college', ''),
                'country': bio.get('country', 'USA'),
            })
        
        result = {
            'fetched_at': datetime.now().isoformat(),
            'season': CURRENT_SEASON,
            'players': players_data
        }
        
        save_json(result, 'nba_player_stats.json')
        log(f"  Found stats for {len(players_data)} players")
        return result
    except Exception as e:
        log(f"  Error: {e}")
        return {}

# ===== 5. FETCH ALL TEAMS =====
def fetch_all_teams():
    """Fetch all NBA teams"""
    log("Fetching All Teams...")
    try:
        all_teams = teams.get_teams()
        
        teams_data = []
        for team in all_teams:
            teams_data.append({
                'id': team.get('id'),
                'full_name': team.get('full_name'),
                'abbreviation': team.get('abbreviation'),
                'nickname': team.get('nickname'),
                'city': team.get('city'),
                'state': team.get('state'),
                'year_founded': team.get('year_founded'),
            })
        
        save_json(teams_data, 'nba_teams.json')
        log(f"  Found {len(teams_data)} teams")
        return teams_data
    except Exception as e:
        log(f"  Error: {e}")
        return []

# ===== 6. BUILD CHAMPIONSHIP PREDICTIONS =====
def build_championship_predictions(standings):
    """Build championship prediction scores based on standings"""
    log("Building Championship Predictions...")
    
    all_teams = []
    for conf in ['Eastern', 'Western']:
        for team in standings.get(conf, []):
            # Calculate championship score
            win_pct_score = team['win_pct'] * 40
            diff_score = team.get('diff_points', 0) * 2
            rank_score = (16 - team['rank']) * 3
            
            championship_score = win_pct_score + diff_score + rank_score
            
            all_teams.append({
                'team_id': team['team_id'],
                'team_name': team['team_name'],
                'team_city': team['team_city'],
                'conference': conf[:4],  # 'East' or 'West'
                'rank': team['rank'],
                'wins': team['wins'],
                'losses': team['losses'],
                'win_pct': team['win_pct'],
                'diff_points': team.get('diff_points', 0),
                'championship_score': round(championship_score, 1)
            })
    
    # Sort by championship score
    all_teams.sort(key=lambda x: -x['championship_score'])
    
    result = {
        'fetched_at': datetime.now().isoformat(),
        'season': CURRENT_SEASON,
        'predictions': all_teams
    }
    
    save_json(result, 'championship_prediction_data.json')
    log(f"  Generated predictions for {len(all_teams)} teams")
    return result

# ===== MAIN =====
def main():
    """Fetch all NBA data"""
    print("=" * 60)
    print("NBA PLAYOFF ORACLE - COMPLETE DATA FETCHER")
    print("=" * 60)
    print(f"Season: {CURRENT_SEASON}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Fetch all data with rate limiting
    standings = fetch_standings()
    time.sleep(1)
    
    season_leaders = fetch_season_leaders()
    time.sleep(1)
    
    # Fetch players FIRST to get bio data
    all_players = fetch_all_players()
    time.sleep(1)
    
    # Pass bio data to player stats to merge it
    player_stats = fetch_player_stats(bio_data=all_players)
    time.sleep(1)
    
    all_teams = fetch_all_teams()
    time.sleep(1)
    
    predictions = build_championship_predictions(standings)
    
    print("\n" + "=" * 60)
    print("DATA FETCH COMPLETE!")
    print("=" * 60)
    print("\nFiles saved in 'data/' folder:")
    print("  - nba_standings_live.json")
    print("  - nba_season_leaders.json")
    print("  - nba_players.json")
    print("  - nba_player_stats.json")
    print("  - nba_teams.json")
    print("  - championship_prediction_data.json")
    
    # Print top predictions
    if predictions.get('predictions'):
        print("\n" + "=" * 60)
        print("TOP 10 CHAMPIONSHIP PREDICTIONS")
        print("=" * 60)
        for i, team in enumerate(predictions['predictions'][:10], 1):
            print(f"  {i:2}. {team['team_city']:15} {team['team_name']:15} - Score: {team['championship_score']:.1f}")
    
    return True

if __name__ == "__main__":
    main()
