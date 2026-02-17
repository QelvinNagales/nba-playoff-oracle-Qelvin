"""
Fetch live NBA data: standings, games, and schedule
"""
from nba_api.stats.endpoints import leaguestandings, scoreboardv3, leaguegamelog, scheduleleaguev2
from nba_api.stats.static import teams
import json
from datetime import datetime, timedelta
import os
import time

# Ensure data directory exists
os.makedirs('data', exist_ok=True)

print('=' * 50)
print('NBA LIVE DATA FETCHER')
print('=' * 50)

# Get all teams for reference
all_teams = teams.get_teams()
teams_dict = {t['id']: t for t in all_teams}

# 1. Fetch Current Standings
print('\n[1/3] Fetching NBA Standings...')
try:
    standings = leaguestandings.LeagueStandings(season='2025-26')
    standings_data = standings.get_normalized_dict()
    
    # Process standings for easier use
    processed_standings = {
        'Eastern': [],
        'Western': [],
        'fetched_at': datetime.now().isoformat()
    }
    
    for team in standings_data.get('Standings', []):
        team_info = {
            'rank': team.get('PlayoffRank', team.get('LeagueRank', 0)),
            'team_id': team.get('TeamID'),
            'team_name': team.get('TeamName'),
            'team_city': team.get('TeamCity'),
            'conference': team.get('Conference'),
            'wins': team.get('WINS', 0),
            'losses': team.get('LOSSES', 0),
            'win_pct': team.get('WinPCT', 0),
            'home_record': team.get('HOME', '0-0'),
            'road_record': team.get('ROAD', '0-0'),
            'last_10': team.get('L10', '0-0'),
            'streak': team.get('CurrentStreak', 0),
            'games_back': team.get('ConferenceGamesBack', 0),
        }
        
        if team.get('Conference') == 'East':
            processed_standings['Eastern'].append(team_info)
        else:
            processed_standings['Western'].append(team_info)
    
    # Sort by wins descending
    processed_standings['Eastern'].sort(key=lambda x: (-x['wins'], x['losses']))
    processed_standings['Western'].sort(key=lambda x: (-x['wins'], x['losses']))
    
    # Add rank
    for i, team in enumerate(processed_standings['Eastern'], 1):
        team['rank'] = i
    for i, team in enumerate(processed_standings['Western'], 1):
        team['rank'] = i
    
    with open('data/nba_standings_live.json', 'w') as f:
        json.dump(processed_standings, f, indent=2)
    print(f'   Eastern Conference: {len(processed_standings["Eastern"])} teams')
    print(f'   Western Conference: {len(processed_standings["Western"])} teams')
    print('   Saved to data/nba_standings_live.json')
except Exception as e:
    print(f'   Error fetching standings: {e}')
    processed_standings = {'Eastern': [], 'Western': []}

time.sleep(1)  # Rate limiting

# 2. Fetch Today's Games
print("\n[2/3] Fetching Today's Games...")
today = datetime.now().strftime('%Y-%m-%d')
try:
    sb = scoreboardv3.ScoreboardV3(game_date=today)
    games_data = sb.get_dict()
    
    processed_games = {
        'date': today,
        'games': [],
        'fetched_at': datetime.now().isoformat()
    }
    
    scoreboard_data = games_data.get('scoreboard', {})
    game_list = scoreboard_data.get('games', [])
    
    for game in game_list:
        home_team = game.get('homeTeam', {})
        away_team = game.get('awayTeam', {})
        
        game_info = {
            'game_id': game.get('gameId'),
            'status': game.get('gameStatusText', ''),
            'game_status': game.get('gameStatus', 1),
            'period': game.get('period', 0),
            'game_clock': game.get('gameClock', ''),
            'home_team': {
                'id': home_team.get('teamId'),
                'name': home_team.get('teamName'),
                'city': home_team.get('teamCity'),
                'tricode': home_team.get('teamTricode'),
                'score': home_team.get('score', 0),
                'wins': home_team.get('wins', 0),
                'losses': home_team.get('losses', 0)
            },
            'away_team': {
                'id': away_team.get('teamId'),
                'name': away_team.get('teamName'),
                'city': away_team.get('teamCity'),
                'tricode': away_team.get('teamTricode'),
                'score': away_team.get('score', 0),
                'wins': away_team.get('wins', 0),
                'losses': away_team.get('losses', 0)
            }
        }
        processed_games['games'].append(game_info)
    
    with open('data/nba_games_today.json', 'w') as f:
        json.dump(processed_games, f, indent=2)
    print(f'   Found {len(processed_games["games"])} games today ({today})')
    print('   Saved to data/nba_games_today.json')
except Exception as e:
    print(f'   Error fetching games: {e}')
    processed_games = {'date': today, 'games': []}

time.sleep(1)  # Rate limiting

# 3. Fetch Schedule
print('\n[3/3] Fetching Full Season Schedule...')
try:
    schedule = scheduleleaguev2.ScheduleLeagueV2(season='2025-26')
    schedule_data = schedule.get_dict()
    
    league_schedule = schedule_data.get('leagueSchedule', {})
    game_dates = league_schedule.get('gameDates', [])
    
    processed_schedule = {
        'season': '2025-26',
        'games': [],
        'fetched_at': datetime.now().isoformat()
    }
    
    for date_obj in game_dates:
        game_date = date_obj.get('gameDate', '')
        for game in date_obj.get('games', []):
            home_team = game.get('homeTeam', {})
            away_team = game.get('awayTeam', {})
            
            game_info = {
                'game_id': game.get('gameId'),
                'date': game_date,
                'time': game.get('gameTimeUTC', ''),
                'status': game.get('gameStatusText', ''),
                'home_team': {
                    'id': home_team.get('teamId'),
                    'name': home_team.get('teamName'),
                    'city': home_team.get('teamCity'),
                    'tricode': home_team.get('teamTricode'),
                    'score': home_team.get('score', 0)
                },
                'away_team': {
                    'id': away_team.get('teamId'),
                    'name': away_team.get('teamName'),
                    'city': away_team.get('teamCity'),
                    'tricode': away_team.get('teamTricode'),
                    'score': away_team.get('score', 0)
                },
                'arena': game.get('arenaName', ''),
                'arena_city': game.get('arenaCity', '')
            }
            processed_schedule['games'].append(game_info)
    
    with open('data/nba_schedule_full.json', 'w') as f:
        json.dump(processed_schedule, f, indent=2)
    print(f'   Found {len(processed_schedule["games"])} total games in schedule')
    print('   Saved to data/nba_schedule_full.json')
except Exception as e:
    print(f'   Error fetching schedule: {e}')

print('\n' + '=' * 50)
print('DATA FETCH COMPLETE!')
print('=' * 50)

# Print top teams summary
if processed_standings.get('Eastern'):
    print('\nTOP 8 TEAMS BY CONFERENCE (Playoff Picture):')
    print('\n EASTERN CONFERENCE:')
    for team in processed_standings['Eastern'][:8]:
        print(f"  {team['rank']:2}. {team['team_city']} {team['team_name']:20} ({team['wins']}-{team['losses']})")

    print('\n WESTERN CONFERENCE:')
    for team in processed_standings['Western'][:8]:
        print(f"  {team['rank']:2}. {team['team_city']} {team['team_name']:20} ({team['wins']}-{team['losses']})")

# Print today's games
if processed_games.get('games'):
    print(f"\n TODAY'S GAMES ({processed_games['date']}):")
    for game in processed_games['games']:
        away = game['away_team']
        home = game['home_team']
        status = game['status']
        print(f"  {away['city']} {away['name']} @ {home['city']} {home['name']} - {status}")
else:
    print(f"\n No games scheduled for today ({today})")
