#!/bin/bash

# Production Update Script for www.umtricanes.com
# This script provides functions to update athlete and team information

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors for output (define early for error messages)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print colored output (define early)
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Load environment variables from .env.local
load_env() {
    if [ -f "$SCRIPT_DIR/.env.local" ]; then
        # Extract PROD_ADMIN_PASSWORD from .env.local (for production use)
        ADMIN_PASSWORD=$(grep "^PROD_ADMIN_PASSWORD=" "$SCRIPT_DIR/.env.local" | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//')

        if [ -z "$ADMIN_PASSWORD" ]; then
            print_status "$RED" "Error: PROD_ADMIN_PASSWORD not found in .env.local"
            print_status "$YELLOW" "Please add PROD_ADMIN_PASSWORD=your-password to .env.local"
            return 1
        fi
    else
        print_status "$RED" "Error: .env.local file not found in $SCRIPT_DIR"
        print_status "$YELLOW" "Please create .env.local with ADMIN_PASSWORD=your-password"
        return 1
    fi
    return 0
}

# Load environment variables
if ! load_env; then
    # If sourced, don't exit - just return
    if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
        return 1
    else
        exit 1
    fi
fi

# Configuration
API_BASE_URL="https://www.umtricanes.com/api"

# Function to update an athlete
update_athlete() {
    local athlete_id=$1
    shift

    if [ -z "$athlete_id" ]; then
        print_status "$RED" "Error: Athlete ID is required"
        echo "Usage: update_athlete <id> [options]"
        echo "Options:"
        echo "  --name <name>           Update athlete name"
        echo "  --slug <slug>           Update athlete slug (URL-friendly)"
        echo "  --goal <amount>         Update fundraising goal"
        echo "  --miles-goal <miles>    Update miles goal"
        echo "  --team-id <id>          Change athlete's team"
        echo "  --photo-url <url>       Update photo URL"
        return 1
    fi

    # Build JSON data
    local json_data="{"
    local first=true

    while [ $# -gt 0 ]; do
        case $1 in
            --name)
                [ "$first" = false ] && json_data+=","
                json_data+="\"name\":\"$2\""
                first=false
                shift 2
                ;;
            --slug)
                [ "$first" = false ] && json_data+=","
                json_data+="\"slug\":\"$2\""
                first=false
                shift 2
                ;;
            --goal)
                [ "$first" = false ] && json_data+=","
                json_data+="\"goal\":$2"
                first=false
                shift 2
                ;;
            --miles-goal)
                [ "$first" = false ] && json_data+=","
                json_data+="\"milesGoal\":$2"
                first=false
                shift 2
                ;;
            --team-id)
                [ "$first" = false ] && json_data+=","
                json_data+="\"teamId\":$2"
                first=false
                shift 2
                ;;
            --photo-url)
                [ "$first" = false ] && json_data+=","
                json_data+="\"photoUrl\":\"$2\""
                first=false
                shift 2
                ;;
            *)
                print_status "$RED" "Unknown option: $1"
                return 1
                ;;
        esac
    done

    json_data+="}"

    if [ "$json_data" = "{}" ]; then
        print_status "$YELLOW" "Warning: No fields to update"
        return 1
    fi

    print_status "$YELLOW" "Updating athlete ID $athlete_id..."
    echo "Data: $json_data"

    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_BASE_URL}/athletes/${athlete_id}" \
        -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
        -H "Content-Type: application/json" \
        -d "$json_data")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        print_status "$GREEN" "✓ Athlete updated successfully!"
        echo "$body" | jq '.athlete | {id, name, slug, goal, milesGoal, teamId}'
    else
        print_status "$RED" "✗ Update failed (HTTP $http_code)"
        echo "$body" | jq '.error' 2>/dev/null || echo "$body"
    fi
}

# Function to update a team
update_team() {
    local team_id=$1
    shift

    if [ -z "$team_id" ]; then
        print_status "$RED" "Error: Team ID is required"
        echo "Usage: update_team <id> [options]"
        echo "Options:"
        echo "  --name <name>     Update team name"
        echo "  --color <hex>     Update team color (e.g., #FF6B6B)"
        return 1
    fi

    # Build JSON data
    local json_data="{"
    local first=true

    while [ $# -gt 0 ]; do
        case $1 in
            --name)
                [ "$first" = false ] && json_data+=","
                json_data+="\"name\":\"$2\""
                first=false
                shift 2
                ;;
            --color)
                [ "$first" = false ] && json_data+=","
                json_data+="\"color\":\"$2\""
                first=false
                shift 2
                ;;
            *)
                print_status "$RED" "Unknown option: $1"
                return 1
                ;;
        esac
    done

    json_data+="}"

    if [ "$json_data" = "{}" ]; then
        print_status "$YELLOW" "Warning: No fields to update"
        return 1
    fi

    print_status "$YELLOW" "Updating team ID $team_id..."
    echo "Data: $json_data"

    response=$(curl -s -w "\n%{http_code}" -X PUT "${API_BASE_URL}/teams/${team_id}" \
        -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
        -H "Content-Type: application/json" \
        -d "$json_data")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        print_status "$GREEN" "✓ Team updated successfully!"
        echo "$body" | jq '.team | {id, name, color}'
    else
        print_status "$RED" "✗ Update failed (HTTP $http_code)"
        echo "$body" | jq '.error' 2>/dev/null || echo "$body"
    fi
}

# Function to get athlete info
get_athlete() {
    local athlete_id=$1

    if [ -z "$athlete_id" ]; then
        print_status "$RED" "Error: Athlete ID is required"
        return 1
    fi

    print_status "$YELLOW" "Fetching athlete ID $athlete_id..."
    curl -s "${API_BASE_URL}/athletes/${athlete_id}" | jq '{id, name, slug, goal, milesGoal, teamId, photoUrl}'
}

# Function to get team info
get_team() {
    local team_id=$1

    if [ -z "$team_id" ]; then
        print_status "$RED" "Error: Team ID is required"
        return 1
    fi

    print_status "$YELLOW" "Fetching team ID $team_id..."
    curl -s "${API_BASE_URL}/teams/${team_id}" | jq '{id, name, color, athleteCount}'
}

# Function to list all teams
list_teams() {
    print_status "$YELLOW" "Fetching all teams..."
    curl -s "${API_BASE_URL}/teams" | jq '.[] | {id, name, color}'
}

# Function to list all athletes
list_athletes() {
    print_status "$YELLOW" "Fetching all athletes..."
    curl -s "${API_BASE_URL}/athletes" | jq '.[] | {id, name, slug, teamId}' | head -50
    print_status "$YELLOW" "Note: Showing first 50 athletes. Use 'list_athletes | less' to see all."
}

# Function to find athlete by name
find_athlete() {
    local search_term=$1

    if [ -z "$search_term" ]; then
        print_status "$RED" "Error: Search term is required"
        return 1
    fi

    print_status "$YELLOW" "Searching for athletes matching '$search_term'..."
    curl -s "${API_BASE_URL}/athletes" | \
        jq --arg search "$search_term" '.[] | select(.name | ascii_downcase | contains($search | ascii_downcase)) | {id, name, slug, teamId}'
}

# Function to find team by name
find_team() {
    local search_term=$1

    if [ -z "$search_term" ]; then
        print_status "$RED" "Error: Search term is required"
        return 1
    fi

    print_status "$YELLOW" "Searching for teams matching '$search_term'..."
    curl -s "${API_BASE_URL}/teams" | \
        jq --arg search "$search_term" '.[] | select(.name | ascii_downcase | contains($search | ascii_downcase)) | {id, name, color}'
}

# Show help if no arguments
show_help() {
    echo "Production Update Script for www.umtricanes.com"
    echo "================================================"
    echo ""
    print_status "$GREEN" "✓ Admin password loaded from .env.local"
    echo ""
    echo "Available Commands:"
    echo ""
    echo "ATHLETE COMMANDS:"
    echo "  update_athlete <id> [options]    Update an athlete's information"
    echo "  get_athlete <id>                 Get athlete details"
    echo "  list_athletes                    List all athletes"
    echo "  find_athlete <search>            Find athletes by name"
    echo ""
    echo "TEAM COMMANDS:"
    echo "  update_team <id> [options]       Update a team's information"
    echo "  get_team <id>                    Get team details"
    echo "  list_teams                       List all teams"
    echo "  find_team <search>               Find teams by name"
    echo ""
    echo "ATHLETE UPDATE OPTIONS:"
    echo "  --name <name>           Update athlete name"
    echo "  --slug <slug>           Update athlete slug"
    echo "  --goal <amount>         Update fundraising goal"
    echo "  --miles-goal <miles>    Update miles goal"
    echo "  --team-id <id>          Change athlete's team"
    echo "  --photo-url <url>       Update photo URL"
    echo ""
    echo "TEAM UPDATE OPTIONS:"
    echo "  --name <name>     Update team name"
    echo "  --color <hex>     Update team color (e.g., #FF6B6B)"
    echo ""
    echo "EXAMPLES:"
    echo "  # Update Audrey's name (ID: 20)"
    echo "  update_athlete 20 --name \"Audrey Friedman\" --slug \"audrey-friedman\""
    echo ""
    echo "  # Update team name and color"
    echo "  update_team 3 --name \"Legacy Riders\" --color \"#FF6B6B\""
    echo ""
    echo "  # Find and update an athlete"
    echo "  find_athlete \"audrey\""
    echo "  update_athlete 20 --goal 1000 --miles-goal 200"
    echo ""
    echo "  # Move athlete to different team"
    echo "  update_athlete 20 --team-id 2"
}

# If script is sourced, show available commands
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
    print_status "$GREEN" "✓ Production update functions loaded!"
    print_status "$GREEN" "✓ Admin password loaded from .env.local"
    echo ""
    echo "Type 'show_help' to see all available commands"
    echo "Quick start:"
    echo "  find_athlete \"name\"  - Search for an athlete"
    echo "  find_team \"name\"     - Search for a team"
    echo "  list_teams           - List all teams"
else
    # If script is executed directly, handle command line arguments
    if [ $# -eq 0 ]; then
        # No arguments, show help
        show_help
    else
        # Execute the command passed as arguments
        command=$1
        shift

        case $command in
            update_athlete|update_team|get_athlete|get_team|list_teams|list_athletes|find_athlete|find_team|show_help)
                # Execute the function with remaining arguments
                $command "$@"
                ;;
            *)
                print_status "$RED" "Unknown command: $command"
                echo ""
                echo "Run '$0' without arguments to see available commands"
                exit 1
                ;;
        esac
    fi
fi