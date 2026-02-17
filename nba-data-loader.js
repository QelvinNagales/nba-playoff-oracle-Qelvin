/**
 * NBA Data Loader - Connects NBA API data to HTML pages
 * This script loads data from the data/ folder and makes it available for all pages
 */

const NBAData = {
    teams: [],
    players: [],
    standings: [],
    predictions: [],
    loaded: false,

    // Load all data files
    async loadAll() {
        try {
            const [teams, players, standings, predictions] = await Promise.all([
                this.loadJSON('data/nba_teams.json'),
                this.loadJSON('data/nba_players.json'),
                this.loadJSON('data/nba_standings.json'),
                this.loadJSON('data/championship_prediction_data.json')
            ]);

            this.teams = teams || [];
            this.players = players || [];
            this.standings = standings || [];
            this.predictions = predictions || [];
            this.loaded = true;

            console.log('NBA Data Loaded:', {
                teams: this.teams.length,
                players: this.players.length,
                standings: this.standings.length,
                predictions: this.predictions.length
            });

            // Dispatch event when data is loaded
            window.dispatchEvent(new CustomEvent('nbaDataLoaded', { detail: this }));
            
            return this;
        } catch (error) {
            console.error('Error loading NBA data:', error);
            return this;
        }
    },

    // Load a single JSON file
    async loadJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn(`Could not load ${path}:`, error.message);
            return [];
        }
    },

    // Get team by ID
    getTeamById(id) {
        return this.teams.find(team => team.id === id);
    },

    // Get team by abbreviation
    getTeamByAbbr(abbr) {
        return this.teams.find(team => team.abbreviation === abbr);
    },

    // Get team logo URL
    getTeamLogo(teamId) {
        return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
    },

    // Get standings by conference
    getStandingsByConference(conference) {
        return this.standings
            .filter(team => team.Conference === conference)
            .sort((a, b) => a.PlayoffRank - b.PlayoffRank);
    },

    // Get top teams for predictions
    getTopPredictions(count = 10) {
        return this.predictions
            .sort((a, b) => (b.prediction_score || 0) - (a.prediction_score || 0))
            .slice(0, count);
    },

    // Search players by name
    searchPlayers(query) {
        const lowerQuery = query.toLowerCase();
        return this.players.filter(player => 
            player.full_name?.toLowerCase().includes(lowerQuery)
        );
    },

    // Get players by team
    getPlayersByTeam(teamId) {
        return this.players.filter(player => player.team_id === teamId);
    }
};

// Auto-load data when script is included
document.addEventListener('DOMContentLoaded', () => {
    NBAData.loadAll();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NBAData;
}
