/**
 * NBA Live Data Loader
 * Loads and displays real NBA data from fetched JSON files
 */

const NBA_DATA = {
    standings: null,
    gamesToday: null,
    schedule: null,
    seasonLeaders: null,
    playerStats: null,
    teams: null,
    predictions: null,
    loaded: false
};

// Team logo URLs 
const TEAM_LOGOS = {};
const TEAM_COLORS = {
    'ATL': { primary: '#E03A3E', secondary: '#C1D32F' },
    'BOS': { primary: '#007A33', secondary: '#BA9653' },
    'BKN': { primary: '#000000', secondary: '#FFFFFF' },
    'CHA': { primary: '#1D1160', secondary: '#00788C' },
    'CHI': { primary: '#CE1141', secondary: '#000000' },
    'CLE': { primary: '#860038', secondary: '#FDBB30' },
    'DAL': { primary: '#00538C', secondary: '#002B5E' },
    'DEN': { primary: '#0E2240', secondary: '#FEC524' },
    'DET': { primary: '#C8102E', secondary: '#1D42BA' },
    'GSW': { primary: '#1D428A', secondary: '#FFC72C' },
    'HOU': { primary: '#CE1141', secondary: '#000000' },
    'IND': { primary: '#002D62', secondary: '#FDBB30' },
    'LAC': { primary: '#C8102E', secondary: '#1D428A' },
    'LAL': { primary: '#552583', secondary: '#FDB927' },
    'MEM': { primary: '#5D76A9', secondary: '#12173F' },
    'MIA': { primary: '#98002E', secondary: '#F9A01B' },
    'MIL': { primary: '#00471B', secondary: '#EEE1C6' },
    'MIN': { primary: '#0C2340', secondary: '#236192' },
    'NOP': { primary: '#0C2340', secondary: '#C8102E' },
    'NYK': { primary: '#006BB6', secondary: '#F58426' },
    'OKC': { primary: '#007AC1', secondary: '#EF3B24' },
    'ORL': { primary: '#0077C0', secondary: '#C4CED4' },
    'PHI': { primary: '#006BB6', secondary: '#ED174C' },
    'PHX': { primary: '#1D1160', secondary: '#E56020' },
    'POR': { primary: '#E03A3E', secondary: '#000000' },
    'SAC': { primary: '#5A2D81', secondary: '#63727A' },
    'SAS': { primary: '#C4CED4', secondary: '#000000' },
    'TOR': { primary: '#CE1141', secondary: '#000000' },
    'UTA': { primary: '#002B5C', secondary: '#00471B' },
    'WAS': { primary: '#002B5C', secondary: '#E31837' }
};

// Load all data files
async function loadNBAData() {
    try {
        const [standingsRes, gamesTodayRes, scheduleRes, leadersRes, playerStatsRes, teamsRes, predictionsRes] = await Promise.all([
            fetch('data/nba_standings_live.json').catch(() => null),
            fetch('data/nba_games_today.json').catch(() => null),
            fetch('data/nba_schedule_full.json').catch(() => null),
            fetch('data/nba_season_leaders.json').catch(() => null),
            fetch('data/nba_player_stats.json').catch(() => null),
            fetch('data/nba_teams.json').catch(() => null),
            fetch('data/championship_prediction_data.json').catch(() => null)
        ]);

        if (standingsRes && standingsRes.ok) {
            NBA_DATA.standings = await standingsRes.json();
            console.log('Standings loaded:', NBA_DATA.standings);
        }
        
        if (gamesTodayRes && gamesTodayRes.ok) {
            NBA_DATA.gamesToday = await gamesTodayRes.json();
            console.log('Games today loaded:', NBA_DATA.gamesToday);
        }
        
        if (scheduleRes && scheduleRes.ok) {
            NBA_DATA.schedule = await scheduleRes.json();
            console.log('Schedule loaded:', NBA_DATA.schedule);
        }
        
        if (leadersRes && leadersRes.ok) {
            NBA_DATA.seasonLeaders = await leadersRes.json();
            console.log('Season leaders loaded:', NBA_DATA.seasonLeaders);
        }
        
        if (playerStatsRes && playerStatsRes.ok) {
            NBA_DATA.playerStats = await playerStatsRes.json();
            console.log('Player stats loaded:', NBA_DATA.playerStats);
        }
        
        if (teamsRes && teamsRes.ok) {
            NBA_DATA.teams = await teamsRes.json();
            console.log('Teams loaded:', NBA_DATA.teams);
        }
        
        if (predictionsRes && predictionsRes.ok) {
            NBA_DATA.predictions = await predictionsRes.json();
            console.log('Predictions loaded:', NBA_DATA.predictions);
        }

        NBA_DATA.loaded = true;
        return true;
    } catch (error) {
        console.error('Error loading NBA data:', error);
        return false;
    }
}

// Get team logo URL
function getTeamLogo(teamId) {
    return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
}

// Render standings table
function renderStandingsTable(conference, containerId) {
    if (!NBA_DATA.standings) return;
    
    const teams = NBA_DATA.standings[conference] || [];
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
        <div class="standings-table-wrapper">
            <h2 class="conference-title">${conference} Conference</h2>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th>W</th>
                        <th>L</th>
                        <th>PCT</th>
                        <th>GB</th>
                        <th>HOME</th>
                        <th>AWAY</th>
                        <th>L10</th>
                        <th>STRK</th>
                    </tr>
                </thead>
                <tbody>
                    ${teams.map((team, i) => `
                        <tr class="${i < 6 ? 'playoff-team' : i < 10 ? 'playin-team' : ''}">
                            <td class="rank">${team.rank}</td>
                            <td class="team-cell">
                                <img src="${getTeamLogo(team.team_id)}" alt="${team.team_name}" class="team-logo-small">
                                <span class="team-name">${team.team_city} ${team.team_name}</span>
                            </td>
                            <td class="wins">${team.wins}</td>
                            <td class="losses">${team.losses}</td>
                            <td>${(team.win_pct).toFixed(3)}</td>
                            <td>${team.games_back || '-'}</td>
                            <td>${team.home_record || '-'}</td>
                            <td>${team.road_record || '-'}</td>
                            <td>${team.last_10 || '-'}</td>
                            <td>${team.streak || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="standings-legend">
                <span class="playoff-indicator">Top 6: Playoff seeding</span>
                <span class="playin-indicator">7-10: Play-In Tournament</span>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Render today's games
function renderTodaysGames(containerId) {
    if (!NBA_DATA.gamesToday) return;
    
    const games = NBA_DATA.gamesToday.games || [];
    const container = document.getElementById(containerId);
    if (!container) return;

    if (games.length === 0) {
        container.innerHTML = `
            <div class="no-games">
                <h3>No Games Scheduled Today</h3>
                <p>Check back later for upcoming matchups!</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="games-grid">
            ${games.map(game => `
                <div class="game-card">
                    <div class="game-status">${game.status}</div>
                    <div class="game-teams">
                        <div class="team away">
                            <img src="${getTeamLogo(game.away_team.id)}" alt="${game.away_team.name}" class="team-logo">
                            <span class="team-name">${game.away_team.city} ${game.away_team.name}</span>
                            <span class="team-record">(${game.away_team.wins}-${game.away_team.losses})</span>
                            <span class="team-score">${game.away_team.score || '-'}</span>
                        </div>
                        <div class="vs">@</div>
                        <div class="team home">
                            <img src="${getTeamLogo(game.home_team.id)}" alt="${game.home_team.name}" class="team-logo">
                            <span class="team-name">${game.home_team.city} ${game.home_team.name}</span>
                            <span class="team-record">(${game.home_team.wins}-${game.home_team.losses})</span>
                            <span class="team-score">${game.home_team.score || '-'}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// Render schedule
function renderSchedule(containerId, filterDate = null) {
    if (!NBA_DATA.schedule) return;
    
    const games = NBA_DATA.schedule.games || [];
    const container = document.getElementById(containerId);
    if (!container) return;

    // Group games by date
    const gamesByDate = {};
    games.forEach(game => {
        const date = game.date ? game.date.split('T')[0] : 'Unknown';
        if (!gamesByDate[date]) gamesByDate[date] = [];
        gamesByDate[date].push(game);
    });

    // Get sorted dates
    const dates = Object.keys(gamesByDate).sort().reverse().slice(0, 7); // Last 7 days

    const html = `
        <div class="schedule-container">
            ${dates.map(date => `
                <div class="schedule-date">
                    <h3>${formatDate(date)}</h3>
                    <div class="schedule-games">
                        ${gamesByDate[date].map(game => `
                            <div class="schedule-game-row">
                                <span class="away-team">
                                    <img src="${getTeamLogo(game.away_team.id)}" class="team-logo-tiny">
                                    ${game.away_team.tricode || game.away_team.name}
                                </span>
                                <span class="score">${game.away_team.score || 0} - ${game.home_team.score || 0}</span>
                                <span class="home-team">
                                    <img src="${getTeamLogo(game.home_team.id)}" class="team-logo-tiny">
                                    ${game.home_team.tricode || game.home_team.name}
                                </span>
                                <span class="game-status-mini">${game.status || 'Final'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// Format date helper
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

// Get championship prediction based on standings
function getPredictionData() {
    if (!NBA_DATA.standings) return null;
    
    const east = NBA_DATA.standings.Eastern || [];
    const west = NBA_DATA.standings.Western || [];
    
    // Top teams by record
    const eastTop = east.slice(0, 4);
    const westTop = west.slice(0, 4);
    
    // Simple prediction: team with best record wins
    const eastChamp = east[0];
    const westChamp = west[0];
    
    // Finals prediction: best overall record
    const champion = eastChamp && westChamp ? 
        (eastChamp.wins > westChamp.wins ? eastChamp : westChamp) : 
        (eastChamp || westChamp);
    
    return {
        eastContenders: eastTop,
        westContenders: westTop,
        eastConferenceChamp: eastChamp,
        westConferenceChamp: westChamp,
        nbaChampion: champion,
        confidence: calculateConfidence(champion, east.concat(west))
    };
}

// Calculate prediction confidence
function calculateConfidence(champion, allTeams) {
    if (!champion || allTeams.length === 0) return 50;
    
    const totalWins = allTeams.reduce((sum, t) => sum + t.wins, 0);
    const avgWins = totalWins / allTeams.length;
    const champWins = champion.wins;
    
    // Higher confidence if champion is significantly above average
    const diff = champWins - avgWins;
    const maxDiff = 30; // Assume 30 games above average is maximum
    const confidence = Math.min(95, 50 + (diff / maxDiff) * 45);
    
    return Math.round(confidence);
}

// ========== Season Leaders Functions ==========

// Render season leaders grid for Stats page
function renderSeasonLeaders(category = 'points', limit = 10) {
    if (!NBA_DATA.seasonLeaders) {
        console.log('Season leaders data not loaded');
        return;
    }
    
    const leaders = NBA_DATA.seasonLeaders[category] || [];
    if (leaders.length === 0) return;
    
    // Find the container for season leaders on Stats page
    const containers = document.querySelectorAll('.LeadersGrid__Item, .leaders-item, [class*="LeaderCard"], [class*="leader"]');
    
    // Also try to find the stats table bodies
    const statTables = document.querySelectorAll('.Crom_body__UYOcU');
    
    console.log(`Rendering ${category} leaders:`, leaders.slice(0, limit));
    return leaders.slice(0, limit);
}

// Get top performers by category
function getTopLeaders(category, limit = 5) {
    if (!NBA_DATA.seasonLeaders) return [];
    return (NBA_DATA.seasonLeaders[category] || []).slice(0, limit);
}

// Create a leader card HTML
function createLeaderCard(player, rank, category, statKey) {
    const statValue = player[statKey] || player.pts || 0;
    return `
        <div class="leader-card" data-rank="${rank}">
            <div class="leader-rank ${rank <= 3 ? 'top-three' : ''}">${rank}</div>
            <div class="leader-player">
                <img src="https://cdn.nba.com/headshots/nba/latest/260x190/${player.player_id}.png" 
                     alt="${player.player_name}" 
                     onerror="this.src='https://cdn.nba.com/headshots/nba/latest/260x190/fallback.png'">
                <div class="leader-info">
                    <span class="player-name">${player.player_name}</span>
                    <span class="player-team">${player.team}</span>
                </div>
            </div>
            <div class="leader-stat">
                <span class="stat-value">${typeof statValue === 'number' ? statValue.toFixed(1) : statValue}</span>
                <span class="stat-label">${category.toUpperCase()}</span>
            </div>
        </div>
    `;
}

// Render all leader categories for Stats page
function renderAllLeaders() {
    if (!NBA_DATA.seasonLeaders) return;
    
    const categories = [
        { key: 'points', label: 'Points', statKey: 'pts' },
        { key: 'rebounds', label: 'Rebounds', statKey: 'reb' },
        { key: 'assists', label: 'Assists', statKey: 'ast' },
        { key: 'steals', label: 'Steals', statKey: 'stl' },
        { key: 'blocks', label: 'Blocks', statKey: 'blk' }
    ];
    
    let html = '<div class="season-leaders-container">';
    
    categories.forEach(cat => {
        const leaders = (NBA_DATA.seasonLeaders[cat.key] || []).slice(0, 5);
        if (leaders.length === 0) return;
        
        html += `
            <div class="leader-category">
                <h3 class="category-title">${cat.label} Leaders</h3>
                <div class="leader-list">
                    ${leaders.map((p, i) => createLeaderCard(p, i + 1, cat.label, cat.statKey)).join('')}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// ========== Players Page Functions ==========

// Global state for players pagination
let playersCurrentPage = 0;
let playersPerPage = 50;
let filteredPlayers = [];
let allPlayersData = [];

// Initialize players data
function initPlayersData() {
    if (!NBA_DATA.playerStats || !NBA_DATA.playerStats.players) return [];
    allPlayersData = NBA_DATA.playerStats.players;
    filteredPlayers = [...allPlayersData];
    return filteredPlayers;
}

// Search/filter players
function filterPlayers(searchTerm = '', letterFilter = '', teamFilter = '') {
    if (!allPlayersData.length) initPlayersData();
    
    filteredPlayers = allPlayersData.filter(player => {
        const nameMatch = !searchTerm || 
            player.player_name.toLowerCase().includes(searchTerm.toLowerCase());
        const letterMatch = !letterFilter || 
            player.player_name.split(' ').pop()[0].toUpperCase() === letterFilter;
        const teamMatch = !teamFilter || 
            player.team_abbreviation === teamFilter;
        return nameMatch && letterMatch && teamMatch;
    });
    
    playersCurrentPage = 0;
    return filteredPlayers;
}

// Get players for current page
function getPlayersPage(page = 0) {
    const start = page * playersPerPage;
    const end = start + playersPerPage;
    return filteredPlayers.slice(start, end);
}

// Total pages
function getTotalPlayersPages() {
    return Math.ceil(filteredPlayers.length / playersPerPage);
}

// Create player row HTML
function createPlayerRow(player) {
    // Height comes as string like "6-8" from NBA API
    let heightStr = '-';
    if (player.height) {
        if (typeof player.height === 'string' && player.height.includes('-')) {
            // Format "6-8" -> "6'8""
            const parts = player.height.split('-');
            heightStr = parts[0] + "'" + parts[1] + '"';
        } else if (typeof player.height === 'number') {
            const heightFeet = Math.floor(player.height / 12);
            const heightInches = player.height % 12;
            heightStr = `${heightFeet}'${heightInches}"`;
        } else {
            heightStr = player.height;
        }
    }
    
    // Weight handling
    const weightStr = player.weight ? `${player.weight} lbs` : '- lbs';
    
    return `
        <tr class="RosterRow_row__2_hNz player-data-row" data-player-id="${player.player_id}">
            <td class="primary text RosterRow_primaryCol__1lto4">
                <a href="#" class="Anchor_anchor__cSc3P RosterRow_playerLink__lGqCh" data-player-id="${player.player_id}">
                    <div class="RosterRow_playerContainer__3Uelp">
                        <div class="bg-lazy RosterRow_playerImage__1ZGJF" style="background-image: url('https://cdn.nba.com/headshots/nba/latest/260x190/${player.player_id}.png')"></div>
                        <span class="RosterRow_playerName__3xCxi">${player.player_name}</span>
                    </div>
                </a>
            </td>
            <td class="text">${player.team_abbreviation || '-'}</td>
            <td>${player.jersey_number || '-'}</td>
            <td class="text">${player.position || '-'}</td>
            <td>${heightStr}</td>
            <td class="text">${weightStr}</td>
            <td class="text">${player.college || '-'}</td>
            <td class="text">${player.country || 'USA'}</td>
        </tr>
    `;
}

// Render players table with live data
function renderPlayersTable() {
    if (!NBA_DATA.playerStats || !NBA_DATA.playerStats.players) {
        console.log('Player stats not loaded');
        return;
    }
    
    initPlayersData();
    const players = getPlayersPage(0);
    
    // Find the existing table body on Players page
    const tableBody = document.querySelector('.LeagueRoster_table__B1Zyz tbody, table.players-list tbody');
    if (tableBody) {
        tableBody.innerHTML = players.map(p => createPlayerRow(p)).join('');
        
        // Update pagination info
        updatePaginationInfo();
    }
    
    return players;
}

// Update pagination display
function updatePaginationInfo() {
    const totalPlayers = filteredPlayers.length;
    const totalPages = getTotalPlayersPages();
    
    // Update row count display
    const rowCountEl = document.querySelector('.Pagination_content__f2at7 > div:first-child');
    if (rowCountEl) {
        rowCountEl.textContent = `${totalPlayers} Rows`;
    }
    
    // Update page dropdown
    const pageSelect = document.querySelector('.Pagination_pageDropdown__KgjBU select');
    if (pageSelect) {
        pageSelect.innerHTML = `<option value="-1">All</option>` +
            Array.from({ length: totalPages }, (_, i) => 
                `<option value="${i}" ${i === playersCurrentPage ? 'selected' : ''}>${i + 1}</option>`
            ).join('');
    }
}

// Navigate players pages
function goToPlayersPage(page) {
    if (page < 0) {
        // Show all
        playersPerPage = filteredPlayers.length;
        playersCurrentPage = 0;
    } else {
        playersPerPage = 50;
        playersCurrentPage = page;
    }
    
    const tableBody = document.querySelector('.LeagueRoster_table__B1Zyz tbody, table.players-list tbody');
    if (tableBody) {
        const players = getPlayersPage(playersCurrentPage);
        tableBody.innerHTML = players.map(p => createPlayerRow(p)).join('');
        updatePaginationInfo();
    }
}

// ========== Standings Page Functions ==========

// Update standings tables on Standings page with live data
function updateStandingsPage() {
    if (!NBA_DATA.standings) {
        console.log('Standings data not loaded');
        return;
    }
    
    const eastTeams = NBA_DATA.standings.Eastern || [];
    const westTeams = NBA_DATA.standings.Western || [];
    
    // Find the standings table bodies
    const tableBodies = document.querySelectorAll('.Crom_body__UYOcU');
    
    if (tableBodies.length >= 2) {
        // First table is Eastern, second is Western
        updateStandingsTableBody(tableBodies[0], eastTeams);
        updateStandingsTableBody(tableBodies[1], westTeams);
        console.log('Standings tables updated with live data');
    }
}

// Update a single standings table body
function updateStandingsTableBody(tbody, teams) {
    if (!tbody || !teams.length) return;
    
    tbody.innerHTML = teams.map(team => {
        const winPct = team.win_pct ? team.win_pct.toFixed(3) : '.000';
        const gb = team.games_back || '-';
        
        return `
            <tr class="StatsStandingsTable_row__o6A7G" data-is-clinch="false" data-is-wildcard="false">
                <td class="Crom_text__NpR1_ Crom_primary__EajZu Crom_sticky__uYvkp StatsStandingsTable_primary__x5K4w" data-wide="true">
                    <a href="#" class="Anchor_anchor__cSc3P">
                        <div class="StatsStandingsTable_teamContainer__KPXWK">
                            <div class="TeamLogo_block__1MANe">
                                <img alt="${team.team_city} ${team.team_name} logo" 
                                     src="https://cdn.nba.com/logos/nba/${team.team_id}/global/L/logo.svg" 
                                     class="TeamLogo_logo__PclAJ StatsStandingsTable_teamLogo__tKP5Z" 
                                     loading="lazy">
                            </div>
                        </div>
                        <span class="StatsStandingsTable_teamCity__WJIh9">${team.team_city}&nbsp;</span>
                        <span>${team.team_name}</span>
                        <span class="StatsStandingsTable_teamClinch__5RBud"></span>
                    </a>
                </td>
                <td>${team.wins}</td>
                <td>${team.losses}</td>
                <td>${winPct}</td>
                <td>${gb}</td>
                <td>${team.conf_record || '-'}</td>
                <td>${team.div_record || '-'}</td>
                <td>${team.home_record || '-'}</td>
                <td>${team.road_record || '-'}</td>
                <td>0-0</td>
                <td>${team.ot_record || '0-0'}</td>
                <td>${team.last_10 || '-'}</td>
                <td>${team.streak || '-'}</td>
            </tr>
        `;
    }).join('');
}

// ========== Stats Page Season Leaders Update ==========

// Update Season Leaders section on Stats page
function updateStatsPageLeaders() {
    if (!NBA_DATA.seasonLeaders) {
        console.log('Season leaders not loaded');
        return;
    }
    
    // Try to find season leaders grid container
    const seasonTab = document.querySelector('[data-is-active="true"][data-tab="season"], .season-leaders-tab.active');
    if (!seasonTab) {
        // Check if we're on season view
        console.log('Stats page - looking for leaders grid...');
    }
    
    // Find leader grids and update them
    const leaderGrids = document.querySelectorAll('.LeadersGrid__Item, [class*="LeadersList"], [class*="leader-grid"]');
    
    if (leaderGrids.length === 0) {
        // Create our own leaders display
        createSeasonLeadersDisplay();
    }
}

// Create custom season leaders display
function createSeasonLeadersDisplay() {
    if (!NBA_DATA.seasonLeaders) return;
    
    // Find main content area on Stats page
    const mainContent = document.querySelector('.Block_blockContent__6iJ_n, .MainContent, main, #__next');
    if (!mainContent) return;
    
    // Check if we already added leaders
    if (document.getElementById('live-season-leaders')) return;
    
    const categories = [
        { key: 'points', label: 'Points', statKey: 'pts', abbr: 'PPG' },
        { key: 'rebounds', label: 'Rebounds', statKey: 'reb', abbr: 'RPG' },
        { key: 'assists', label: 'Assists', statKey: 'ast', abbr: 'APG' },
        { key: 'steals', label: 'Steals', statKey: 'stl', abbr: 'SPG' },
        { key: 'blocks', label: 'Blocks', statKey: 'blk', abbr: 'BPG' }
    ];
    
    const leadersHtml = `
        <div id="live-season-leaders" class="live-leaders-section" style="
            padding: 20px;
            background: #1a1a1a;
            margin: 16px;
            border-radius: 8px;
        ">
            <h2 style="color: #fff; font-size: 18px; margin-bottom: 16px; text-transform: uppercase; 
                      font-family: 'Roboto Condensed', sans-serif; border-bottom: 2px solid #c8102e; padding-bottom: 8px;">
                Season Leaders (Live Data)
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                ${categories.map(cat => {
                    const leaders = (NBA_DATA.seasonLeaders[cat.key] || []).slice(0, 5);
                    if (leaders.length === 0) return '';
                    
                    return `
                        <div style="background: #252525; border-radius: 6px; padding: 12px;">
                            <h3 style="color: #c8102e; font-size: 14px; margin-bottom: 12px; text-transform: uppercase;">
                                ${cat.label}
                            </h3>
                            ${leaders.map((p, i) => `
                                <div style="display: flex; align-items: center; padding: 8px 0; 
                                           border-bottom: 1px solid #333; ${i === leaders.length-1 ? 'border:none;' : ''}">
                                    <span style="width: 24px; height: 24px; background: ${i === 0 ? '#c8102e' : '#333'}; 
                                                color: #fff; border-radius: 4px; display: flex; align-items: center; 
                                                justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px;">
                                        ${i + 1}
                                    </span>
                                    <img src="https://cdn.nba.com/headshots/nba/latest/260x190/${p.player_id}.png" 
                                         onerror="this.style.display='none'"
                                         style="width: 36px; height: 26px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                                    <div style="flex: 1;">
                                        <div style="color: #fff; font-size: 13px; font-weight: 600;">${p.player_name}</div>
                                        <div style="color: #888; font-size: 11px;">${p.team}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: #fff; font-size: 16px; font-weight: bold;">${p[cat.statKey].toFixed(1)}</div>
                                        <div style="color: #666; font-size: 10px;">${cat.abbr}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // Insert after the first block or at the start
    const firstBlock = mainContent.querySelector('.Block_block__fIqgl, .block');
    if (firstBlock) {
        firstBlock.insertAdjacentHTML('afterend', leadersHtml);
    } else {
        mainContent.insertAdjacentHTML('afterbegin', leadersHtml);
    }
}

// Export for global use
window.NBA_DATA = NBA_DATA;
window.loadNBAData = loadNBAData;
window.renderStandingsTable = renderStandingsTable;
window.renderTodaysGames = renderTodaysGames;
window.renderSchedule = renderSchedule;
window.getPredictionData = getPredictionData;
window.getTeamLogo = getTeamLogo;
window.TEAM_COLORS = TEAM_COLORS;
// New exports for live data
window.renderSeasonLeaders = renderSeasonLeaders;
window.getTopLeaders = getTopLeaders;
window.renderAllLeaders = renderAllLeaders;
window.initPlayersData = initPlayersData;
window.filterPlayers = filterPlayers;
window.getPlayersPage = getPlayersPage;
window.goToPlayersPage = goToPlayersPage;
window.renderPlayersTable = renderPlayersTable;
window.updateStandingsPage = updateStandingsPage;
window.updateStatsPageLeaders = updateStatsPageLeaders;
window.createSeasonLeadersDisplay = createSeasonLeadersDisplay;
// Players page handlers
window.initPlayersPageWithLiveData = initPlayersPageWithLiveData;
window.renderPlayersTableWithHandlers = renderPlayersTableWithHandlers;
window.setupPlayersPaginationButtons = setupPlayersPaginationButtons;

// Detect current page
function getCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('stats')) return 'stats';
    if (path.includes('players')) return 'players';
    if (path.includes('standings')) return 'standings';
    if (path.includes('teams')) return 'teams';
    if (path.includes('predictions') || path.includes('oracle')) return 'predictions';
    return 'home';
}

// Auto-load on page ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('NBA Live Data: Initializing...');
    await loadNBAData();
    
    const currentPage = getCurrentPage();
    console.log('Current page detected:', currentPage);
    
    // Page-specific rendering
    switch (currentPage) {
        case 'stats':
            console.log('Stats page - season leaders ready (click Season Leaders tab to view)');
            // DO NOT auto-display - let user click the Season Leaders tab
            // The createSeasonLeadersDisplay will be called when tab is clicked
            setupStatsTabHandler();
            break;
            
        case 'players':
            console.log('Players page - loading player data...');
            setTimeout(() => {
                if (NBA_DATA.playerStats) {
                    initPlayersPageWithLiveData();
                }
            }, 500);
            break;
            
        case 'standings':
            // DO NOT auto-update standings - preserve the existing HTML with divider lines
            // The static HTML already has proper styling for playoff/play-in dividers
            console.log('Standings page - using existing data with divider lines preserved');
            break;
            
        case 'predictions':
            // predictions.html has its own script
            console.log('Predictions page - using built-in script');
            break;
    }
    
    // Auto-render if containers exist (generic)
    if (document.getElementById('eastern-standings')) {
        renderStandingsTable('Eastern', 'eastern-standings');
    }
    if (document.getElementById('western-standings')) {
        renderStandingsTable('Western', 'western-standings');
    }
    if (document.getElementById('todays-games')) {
        renderTodaysGames('todays-games');
    }
    if (document.getElementById('schedule-container')) {
        renderSchedule('schedule-container');
    }
});

// Setup Stats page tab handler for Season Leaders - NBA.com style (toggle data in place)
let originalDailyCardsHtml = null;
let originalDateText = null;

function setupStatsTabHandler() {
    const tabButtons = document.querySelectorAll('.ButtonGroup_btn__r075w');
    const cardWrapper = document.querySelector('.LeaderBoardWithButtons_lbwbCardWrapper__re1TJ');
    const dateSpan = document.querySelector('.LeaderBoardWithButtons_lbwbDate__gsMEu');
    
    if (!cardWrapper) return;
    
    // Store original Daily Leaders HTML on first load
    if (!originalDailyCardsHtml) {
        originalDailyCardsHtml = cardWrapper.innerHTML;
        originalDateText = dateSpan ? dateSpan.textContent : '';
    }
    
    tabButtons.forEach(btn => {
        // Clone to remove existing listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
            const isSeason = newBtn.textContent.trim().toLowerCase().includes('season');
            
            // Update button states (NBA.com style)
            document.querySelectorAll('.ButtonGroup_btn__r075w').forEach(b => {
                b.setAttribute('data-active', 'false');
            });
            newBtn.setAttribute('data-active', 'true');
            
            if (isSeason && NBA_DATA.seasonLeaders) {
                // Switch to Season Leaders data IN PLACE (NBA.com format)
                updateCardsWithSeasonData(cardWrapper, dateSpan);
            } else {
                // Restore Daily Leaders data
                if (originalDailyCardsHtml) {
                    cardWrapper.innerHTML = originalDailyCardsHtml;
                    if (dateSpan) dateSpan.textContent = originalDateText;
                }
            }
        });
    });
}

// Update existing cards with Season Leaders data (NBA.com format)
function updateCardsWithSeasonData(cardWrapper, dateSpan) {
    if (!NBA_DATA.seasonLeaders) return;
    
    // NBA.com Season Leaders format - maps Daily card titles to Season format
    const seasonConfig = [
        { 
            dailyTitle: 'Points', 
            seasonTitle: 'POINTS PER GAME',
            key: 'points', 
            statKey: 'pts'
        },
        { 
            dailyTitle: 'Rebounds', 
            seasonTitle: 'REBOUNDS PER GAME',
            key: 'rebounds', 
            statKey: 'reb'
        },
        { 
            dailyTitle: 'Assists', 
            seasonTitle: 'ASSISTS PER GAME',
            key: 'assists', 
            statKey: 'ast'
        },
        { 
            dailyTitle: 'Blocks', 
            seasonTitle: 'BLOCKS PER GAME',
            key: 'blocks', 
            statKey: 'blk'
        },
        { 
            dailyTitle: 'Steals', 
            seasonTitle: 'STEALS PER GAME',
            key: 'steals', 
            statKey: 'stl'
        },
        { 
            dailyTitle: 'Turnovers', 
            seasonTitle: 'FIELD GOAL PERCENTAGE',
            key: 'fg_pct', 
            statKey: 'fg_pct',
            isPercentage: true
        },
        { 
            dailyTitle: 'Three Pointers Made', 
            seasonTitle: 'THREE POINTERS MADE',
            key: 'fg3m', 
            statKey: 'fg3m',
            useTotal: true
        },
        { 
            dailyTitle: 'Free Throws Made', 
            seasonTitle: 'THREE POINT PERCENTAGE',
            key: 'fg3_pct', 
            statKey: 'fg3_pct',
            isPercentage: true
        },
        { 
            dailyTitle: 'Fantasy Points', 
            seasonTitle: 'FANTASY POINTS PER GAME',
            key: 'fantasy_pts', 
            statKey: 'fantasy_pts'
        }
    ];
    
    // Find and update each card
    const cards = cardWrapper.querySelectorAll('.LeaderBoardCard_lbcWrapper__e4bCZ');
    
    cards.forEach((card, index) => {
        const titleEl = card.querySelector('.LeaderBoardCard_lbcTitle___WI9J');
        if (!titleEl) return;
        
        const currentTitle = titleEl.textContent.trim();
        const config = seasonConfig.find(c => c.dailyTitle === currentTitle);
        
        if (!config) return;
        
        // Update title to Season format
        titleEl.textContent = config.seasonTitle;
        
        // Get leaders data - use appropriate data source
        let leaders;
        if (config.isPercentage) {
            // For percentages, sort from existing data
            leaders = getLeadersByPercentage(config.statKey);
        } else if (config.useTotal) {
            // For totals like 3PM, calculate from existing data
            leaders = getLeadersByTotal(config.statKey);
        } else {
            leaders = NBA_DATA.seasonLeaders[config.key];
        }
        
        if (!leaders || leaders.length === 0) return;
        
        // Update the table body with season data
        const tbody = card.querySelector('tbody');
        if (!tbody) return;
        
        // Generate new rows with season data (NBA.com format)
        const newRows = leaders.slice(0, 5).map((player, idx) => {
            let displayValue;
            
            if (config.isPercentage) {
                // Format as percentage (e.g., 70.3 for 0.703)
                const pctValue = player[config.statKey];
                displayValue = (pctValue * 100).toFixed(1);
            } else if (config.useTotal) {
                // Show total (integer)
                displayValue = Math.round(player[config.statKey] * player.gp);
            } else {
                // Per-game average
                const statValue = player[config.statKey];
                displayValue = typeof statValue === 'number' ? statValue.toFixed(1) : statValue;
            }
            
            return `
                <tr class="LeaderBoardPlayerCard_lbpcTableRow___Lod5">
                    <td class="LeaderBoardPlayerCard_lbpcTableCell__SnM1o">${idx + 1}. </td>
                    <td>
                        <a href="https://www.nba.com/stats/player/${player.player_id}/" 
                           class="Anchor_anchor__cSc3P LeaderBoardPlayerCard_lbpcTableLink__MDNgL"
                           data-is-external="false" data-has-more="false" data-has-children="false">
                            ${player.player_name}
                        </a>
                        <span class="LeaderBoardPlayerCard_lbpcTeamAbbr__fGlx3">${player.team}</span>
                    </td>
                    <td class="LeaderBoardWithButtons_lbwbCardValue__5LctQ">
                        ${displayValue}
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.innerHTML = newRows;
    });
}

// Helper: Get leaders sorted by field goal percentage (with minimum attempt filters)
function getLeadersByPercentage(statKey) {
    // Use the pre-sorted percentage categories from data (already filtered correctly)
    if (statKey === 'fg_pct' && NBA_DATA.seasonLeaders.fg_pct) {
        return NBA_DATA.seasonLeaders.fg_pct;
    }
    if (statKey === 'fg3_pct' && NBA_DATA.seasonLeaders.fg3_pct) {
        return NBA_DATA.seasonLeaders.fg3_pct;
    }
    
    // Fallback: use all_players with proper filters like NBA.com
    const allPlayers = NBA_DATA.seasonLeaders.all_players || NBA_DATA.seasonLeaders.points || [];
    
    if (statKey === 'fg_pct') {
        // FG%: min 6 FGA per game
        return [...allPlayers]
            .filter(p => (p.fga || 0) >= 6.0)
            .sort((a, b) => (b.fg_pct || 0) - (a.fg_pct || 0))
            .slice(0, 10);
    } else if (statKey === 'fg3_pct') {
        // 3P%: min 1.5 3PA per game
        return [...allPlayers]
            .filter(p => (p.fg3a || 0) >= 1.5)
            .sort((a, b) => (b.fg3_pct || 0) - (a.fg3_pct || 0))
            .slice(0, 10);
    }
    
    return [...allPlayers]
        .sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0))
        .slice(0, 10);
}

// Helper: Get leaders by total (like 3PM total for season)
function getLeadersByTotal(statKey) {
    // Use the fg3m category directly (already sorted by total 3PM)
    if (statKey === 'fg3m' && NBA_DATA.seasonLeaders.fg3m) {
        return NBA_DATA.seasonLeaders.fg3m;
    }
    
    // Fallback: calculate total from all_players data
    const allPlayers = NBA_DATA.seasonLeaders.all_players || NBA_DATA.seasonLeaders.points || [];
    return [...allPlayers]
        .map(p => ({
            ...p,
            _total: (p[statKey] || 0) * (p.gp || 0)
        }))
        .sort((a, b) => b._total - a._total)
        .slice(0, 10);
}

// Initialize Players page with live data and proper event handlers
function initPlayersPageWithLiveData() {
    // Initialize data
    initPlayersData();
    
    // Render initial table
    renderPlayersTableWithHandlers();
    
    // Setup search handler
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        // Remove any existing listeners by cloning
        const newSearch = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearch, searchInput);
        
        newSearch.addEventListener('input', function(e) {
            filterPlayers(e.target.value);
            playersCurrentPage = 0;
            renderPlayersTableWithHandlers();
        });
    }
    
    // Setup pagination buttons
    setupPlayersPaginationButtons();
}

// Render players table and update UI
function renderPlayersTableWithHandlers() {
    const players = getPlayersPage(playersCurrentPage);
    const tableBody = document.querySelector('.LeagueRoster_table__B1Zyz tbody, table.players-list tbody');
    
    if (tableBody) {
        tableBody.innerHTML = players.map(p => createPlayerRow(p)).join('');
    }
    
    // Update pagination info
    const totalPlayers = filteredPlayers.length;
    const totalPages = getTotalPlayersPages();
    
    // Update row count
    const rowCountEl = document.querySelector('.Pagination_content__f2at7 > div:first-child');
    if (rowCountEl) {
        rowCountEl.textContent = `${totalPlayers} Rows`;
    }
    
    // Update total pages display
    const totalPagesSpan = document.querySelector('.Pagination_content__f2at7');
    if (totalPagesSpan) {
        const pageOfText = totalPagesSpan.querySelector('div:nth-child(2)');
        if (pageOfText && pageOfText.textContent.includes('Page')) {
            // Find or create total pages indicator
            let totalPagesEl = document.querySelector('.total-pages-indicator');
            if (!totalPagesEl) {
                totalPagesEl = document.createElement('span');
                totalPagesEl.className = 'total-pages-indicator';
                totalPagesEl.style.marginLeft = '4px';
                const pageDropdown = document.querySelector('.Pagination_pageDropdown__KgjBU');
                if (pageDropdown) {
                    pageDropdown.insertAdjacentElement('afterend', totalPagesEl);
                }
            }
            totalPagesEl.textContent = `of ${totalPages}`;
        }
    }
    
    // Update page dropdown
    const pageSelect = document.querySelector('.Pagination_pageDropdown__KgjBU select');
    if (pageSelect) {
        // Preserve change listener when updating options
        const currentValue = playersCurrentPage;
        pageSelect.innerHTML = `<option value="-1">All</option>` +
            Array.from({ length: totalPages }, (_, i) => 
                `<option value="${i}" ${i === currentValue ? 'selected' : ''}>${i + 1}</option>`
            ).join('');
    }
    
    // Update button states
    updatePaginationButtonStates();
}

// Setup pagination button handlers
function setupPlayersPaginationButtons() {
    // Previous button
    const prevBtn = document.querySelector('button[title*="Previous"]');
    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', function(e) {
            e.preventDefault();
            if (playersCurrentPage > 0) {
                playersCurrentPage--;
                renderPlayersTableWithHandlers();
            }
        });
    }
    
    // Next button
    const nextBtn = document.querySelector('button[title*="Next"]');
    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', function(e) {
            e.preventDefault();
            if (playersCurrentPage < getTotalPlayersPages() - 1) {
                playersCurrentPage++;
                renderPlayersTableWithHandlers();
            }
        });
    }
    
    // Page dropdown
    const pageSelect = document.querySelector('.Pagination_pageDropdown__KgjBU select');
    if (pageSelect) {
        const newSelect = pageSelect.cloneNode(true);
        pageSelect.parentNode.replaceChild(newSelect, pageSelect);
        newSelect.addEventListener('change', function(e) {
            const value = parseInt(e.target.value);
            if (value === -1) {
                // Show all
                playersPerPage = filteredPlayers.length || 50;
                playersCurrentPage = 0;
            } else {
                playersPerPage = 50;
                playersCurrentPage = value;
            }
            renderPlayersTableWithHandlers();
        });
    }
}

// Update pagination button disabled states
function updatePaginationButtonStates() {
    const prevBtn = document.querySelector('button[title*="Previous"]');
    const nextBtn = document.querySelector('button[title*="Next"]');
    const totalPages = getTotalPlayersPages();
    
    if (prevBtn) {
        prevBtn.disabled = playersCurrentPage === 0;
        prevBtn.style.opacity = playersCurrentPage === 0 ? '0.5' : '1';
    }
    if (nextBtn) {
        nextBtn.disabled = playersCurrentPage >= totalPages - 1;
        nextBtn.style.opacity = playersCurrentPage >= totalPages - 1 ? '0.5' : '1';
    }
}
