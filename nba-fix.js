// NBA Playoff Oracle - JavaScript fix for saved NBA.com pages
// This script removes problematic navigation elements that CSS can't hide

document.addEventListener('DOMContentLoaded', function() {
    // Remove all NavDropdown elements
    document.querySelectorAll('[class*="NavDropdown"]').forEach(el => el.remove());
    
    // Remove navbar menu lists
    document.querySelectorAll('#nav-ul, [class*="NavBar_menu"]').forEach(el => el.remove());
    
    // Remove hamburger menu buttons
    document.querySelectorAll('[class*="NavHamburger"], button[title*="Navigation"]').forEach(el => el.remove());
    
    // Remove any unstyled ul elements that are direct children of nav elements
    document.querySelectorAll('nav > ul').forEach(ul => {
        if (ul.children.length > 3) { // Likely a navigation menu
            ul.remove();
        }
    });
    
    // Remove lists that contain navigation-like links
    document.querySelectorAll('ul').forEach(ul => {
        const links = ul.querySelectorAll('a[href*="nba.com"]');
        if (links.length > 5) {
            // This is likely an expanded navigation menu
            ul.style.display = 'none';
        }
    });

    // Remove GAMES and SCHEDULE from navigation
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent.trim().toUpperCase();
        if (href.includes('/games') || href.includes('/schedule') || 
            text === 'GAMES' || text === 'SCHEDULE') {
            // Hide the parent li if it exists, or hide the link itself
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.style.display = 'none';
            } else {
                link.style.display = 'none';
            }
        }
    });

    // Make NBA logo link to home page (index.html)
    const nbaLogo = document.querySelector('[class*="LeagueLogo"], [class*="NavLogo"], img[alt*="NBA"], a[href*="nba.com"] img');
    if (nbaLogo) {
        // Check if logo is already wrapped in link
        const existingLink = nbaLogo.closest('a');
        if (existingLink) {
            existingLink.href = 'index.html';
            existingLink.style.cursor = 'pointer';
        } else {
            // Wrap logo in link
            nbaLogo.style.cursor = 'pointer';
            nbaLogo.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'index.html';
            });
        }
    }

    // Make Print Standings button work
    const printBtn = document.querySelector('button[class*="Button_button"]');
    if (printBtn && printBtn.textContent.includes('Print')) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }

    // ===== STATS PAGE - Daily/Season Leaders Tab Functionality =====
    initStatsTabSwitching();

    // ===== PLAYERS PAGE - Pagination and Search Functionality =====
    initPlayersPageFunctionality();

    // ===== HIDE SHOW HISTORIC TOGGLE =====
    hideShowHistoricToggle();
});

// Function to initialize Stats page tab switching
function initStatsTabSwitching() {
    const tabButtons = document.querySelectorAll('.ButtonGroup_btn__r075w');
    if (tabButtons.length === 0) return;

    // Find all LeaderBoardWithButtons sections
    const leaderBoardSections = document.querySelectorAll('[class*="LeaderBoardWithButtons"]');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const isDaily = btn.textContent.trim().toLowerCase().includes('daily');
            const isSeason = btn.textContent.trim().toLowerCase().includes('season');
            
            // Update active state on all similar buttons
            const buttonGroup = btn.closest('[class*="ButtonGroup"]');
            if (buttonGroup) {
                buttonGroup.querySelectorAll('button').forEach(b => {
                    b.setAttribute('data-active', 'false');
                });
                btn.setAttribute('data-active', 'true');
            }

            // Find the parent section for this button group
            const parentSection = btn.closest('[class*="Block_block"]') || btn.closest('section');
            if (!parentSection) return;

            // Toggle content visibility based on selection
            const dateSpan = parentSection.querySelector('[class*="lbwbDate"]');
            const cardWrapper = parentSection.querySelector('[class*="lbwbCardWrapper"]');
            
            if (dateSpan) {
                // Daily shows date, Season doesn't
                dateSpan.style.display = isDaily ? 'block' : 'none';
            }

            // Update leaderboard titles
            const titles = parentSection.querySelectorAll('[class*="lbcTitle"]');
            titles.forEach(title => {
                const text = title.textContent.trim();
                if (isSeason && !text.includes('Per Game') && !text.includes('Percentage')) {
                    // Add "Per Game" suffixes for season stats
                    if (text === 'Points') title.textContent = 'Points Per Game';
                    else if (text === 'Rebounds') title.textContent = 'Rebounds Per Game';
                    else if (text === 'Assists') title.textContent = 'Assists Per Game';
                    else if (text === 'Blocks') title.textContent = 'Blocks Per Game';
                    else if (text === 'Steals') title.textContent = 'Steals Per Game';
                    else if (text === 'Turnovers') title.textContent = 'Turnovers Per Game';
                    else if (text === 'Three Pointers Made') title.textContent = 'Three Pointers Made';
                    else if (text === 'Free Throws Made') title.textContent = 'Free Throws Made';
                    else if (text === 'Fantasy Points') title.textContent = 'Fantasy Points Per Game';
                } else if (isDaily) {
                    // Remove "Per Game" suffixes for daily stats
                    title.textContent = text.replace(' Per Game', '').replace(' Percentage', '');
                }
            });

            // Show notification of tab switch
            console.log(`Switched to ${isDaily ? 'Daily' : 'Season'} Leaders`);
        });
    });
}

// Function to initialize Players page functionality
function initPlayersPageFunctionality() {
    // Skip if nba-live-data.js will handle this (check for script inclusion)
    const hasLiveDataScript = document.querySelector('script[src*="nba-live-data"]');
    if (hasLiveDataScript) {
        console.log('Players page: Deferring to nba-live-data.js for functionality');
        return;
    }
    
    const playerTable = document.querySelector('[class*="PlayerList_playerTable"], [class*="LeagueRoster_table"]');
    if (!playerTable) return;

    // Get all player rows
    const allRows = playerTable.querySelectorAll('tbody tr, [class*="RosterRow"]');
    if (allRows.length === 0) return;

    const rowsPerPage = 50;
    let currentPage = 0;
    const totalPages = Math.ceil(allRows.length / rowsPerPage);
    let filteredRows = Array.from(allRows);

    // Find pagination elements
    const prevBtn = document.querySelector('button[title*="Previous"]');
    const nextBtn = document.querySelector('button[title*="Next"]');
    const pageDropdown = document.querySelector('select[title*="Page Number"]');
    const totalPagesEl = document.querySelector('[class*="totalPages"]');
    const rowCountEl = playerTable.closest('[class*="PlayerList"]')?.querySelector('[class*="Pagination_content"] > div:first-child');
    
    // Find search input
    const searchInput = document.querySelector('input[placeholder*="Search Players"]') || 
                       document.querySelector('input[aria-label*="Search"]');

    function showPage(page) {
        currentPage = page;
        const start = page * rowsPerPage;
        const end = start + rowsPerPage;

        filteredRows.forEach((row, index) => {
            if (index >= start && index < end) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Update pagination UI
        if (prevBtn) prevBtn.disabled = page === 0;
        if (nextBtn) nextBtn.disabled = page >= Math.ceil(filteredRows.length / rowsPerPage) - 1;
        if (pageDropdown) pageDropdown.value = page.toString();
        
        // Update page info
        if (totalPagesEl) {
            const totalPgs = Math.ceil(filteredRows.length / rowsPerPage);
            totalPagesEl.textContent = `of ${totalPgs}`;
        }
        if (rowCountEl) {
            rowCountEl.textContent = `${filteredRows.length} Rows`;
        }
    }

    // Set up prev button
    if (prevBtn) {
        prevBtn.removeAttribute('disabled');
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentPage > 0) {
                showPage(currentPage - 1);
            }
        });
    }

    // Set up next button
    if (nextBtn) {
        nextBtn.removeAttribute('disabled');
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const totalPgs = Math.ceil(filteredRows.length / rowsPerPage);
            if (currentPage < totalPgs - 1) {
                showPage(currentPage + 1);
            }
        });
    }

    // Set up page dropdown
    if (pageDropdown) {
        pageDropdown.addEventListener('change', function() {
            const value = parseInt(this.value);
            if (value === -1) {
                // Show all
                filteredRows.forEach(row => row.style.display = '');
                currentPage = 0;
            } else {
                showPage(value);
            }
        });
    }

    // Set up search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            
            if (query === '') {
                filteredRows = Array.from(allRows);
            } else {
                filteredRows = Array.from(allRows).filter(row => {
                    // Get player name from the row
                    const nameCell = row.querySelector('a[href*="player"], [class*="playerName"], td:first-child a');
                    const playerName = nameCell?.textContent?.toLowerCase() || row.textContent?.toLowerCase() || '';
                    return playerName.includes(query);
                });
            }

            // Reset to first page and show filtered results
            showPage(0);
        });
    }

    // Initial page display
    showPage(0);
}

// Function to hide Show Historic toggle
function hideShowHistoricToggle() {
    const toggleLabels = document.querySelectorAll('label');
    toggleLabels.forEach(label => {
        if (label.textContent.includes('Show Historic')) {
            label.style.display = 'none';
        }
    });

    // Also hide by specific classes
    document.querySelectorAll('.PlayerList_toggle__RL_YD').forEach(el => {
        el.style.display = 'none';
    });

    document.querySelectorAll('input[name="showHistoric"]').forEach(input => {
        const label = input.closest('label');
        if (label) label.style.display = 'none';
    });
}
