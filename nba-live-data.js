/**
 * NBA Live Data Loader
 * Loads and displays real NBA data from fetched JSON files
 */

const NBA_DATA = {
    standings: null,
    gamesToday: null,
    schedule: null,
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
        const [standingsRes, gamesTodayRes, scheduleRes] = await Promise.all([
            fetch('data/nba_standings_live.json').catch(() => null),
            fetch('data/nba_games_today.json').catch(() => null),
            fetch('data/nba_schedule_full.json').catch(() => null)
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

// Export for global use
window.NBA_DATA = NBA_DATA;
window.loadNBAData = loadNBAData;
window.renderStandingsTable = renderStandingsTable;
window.renderTodaysGames = renderTodaysGames;
window.renderSchedule = renderSchedule;
window.getPredictionData = getPredictionData;
window.getTeamLogo = getTeamLogo;
window.TEAM_COLORS = TEAM_COLORS;

// Auto-load on page ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadNBAData();
    
    // Auto-render if containers exist
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
