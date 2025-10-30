#!/bin/bash

# Create Athlete Script for www.umtricanes.com
# This script creates new athletes from JSON files

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print colored output
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
        print_status "$YELLOW" "Please create .env.local with PROD_ADMIN_PASSWORD=your-password"
        return 1
    fi
    return 0
}

# Configuration
API_BASE_URL="https://www.umtricanes.com/api"

# Function to validate JSON file
validate_json_file() {
    local json_file=$1

    if [ ! -f "$json_file" ]; then
        print_status "$RED" "Error: File '$json_file' not found"
        return 1
    fi

    # Check if jq can parse the JSON
    if ! jq empty "$json_file" 2>/dev/null; then
        print_status "$RED" "Error: Invalid JSON in file '$json_file'"
        return 1
    fi

    # Check for required fields
    local name=$(jq -r '.name // empty' "$json_file")
    local slug=$(jq -r '.slug // empty' "$json_file")
    local teamId=$(jq -r '.teamId // empty' "$json_file")

    if [ -z "$name" ]; then
        print_status "$RED" "Error: 'name' field is required in JSON"
        return 1
    fi

    if [ -z "$slug" ]; then
        print_status "$RED" "Error: 'slug' field is required in JSON"
        return 1
    fi

    if [ -z "$teamId" ]; then
        print_status "$RED" "Error: 'teamId' field is required in JSON"
        return 1
    fi

    # Validate slug format (lowercase letters, numbers, hyphens only)
    if ! echo "$slug" | grep -qE '^[a-z0-9-]+$'; then
        print_status "$YELLOW" "Warning: Slug '$slug' contains invalid characters"
        print_status "$YELLOW" "It will be converted to lowercase and invalid characters removed"
    fi

    # Validate teamId is a number
    if ! [[ "$teamId" =~ ^[0-9]+$ ]]; then
        print_status "$RED" "Error: 'teamId' must be a number, got: $teamId"
        return 1
    fi

    return 0
}

# Function to display athlete data from JSON
display_athlete_data() {
    local json_file=$1

    print_status "$BLUE" "\nAthlete data to be created:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Display all fields with formatting
    echo -e "${YELLOW}Required fields:${NC}"
    printf "  %-15s %s\n" "Name:" "$(jq -r '.name' "$json_file")"
    printf "  %-15s %s\n" "Slug:" "$(jq -r '.slug' "$json_file")"
    printf "  %-15s %s\n" "Team ID:" "$(jq -r '.teamId' "$json_file")"

    # Check for optional fields
    local has_optional=false
    if jq -e '.bio // .photoUrl // .goal // .milesGoal' "$json_file" >/dev/null 2>&1; then
        echo -e "\n${YELLOW}Optional fields:${NC}"
        has_optional=true

        local bio=$(jq -r '.bio // empty' "$json_file")
        local photoUrl=$(jq -r '.photoUrl // empty' "$json_file")
        local goal=$(jq -r '.goal // empty' "$json_file")
        local milesGoal=$(jq -r '.milesGoal // empty' "$json_file")

        [ -n "$bio" ] && printf "  %-15s %s\n" "Bio:" "$bio"
        [ -n "$photoUrl" ] && printf "  %-15s %s\n" "Photo URL:" "$photoUrl"
        [ -n "$goal" ] && printf "  %-15s \$%s\n" "Goal:" "$goal"
        [ -n "$milesGoal" ] && printf "  %-15s %s miles\n" "Miles Goal:" "$milesGoal"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to get team name
get_team_name() {
    local team_id=$1

    # Fetch team info
    local team_data=$(curl -s "${API_BASE_URL}/teams/${team_id}" 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$team_data" ]; then
        local team_name=$(echo "$team_data" | jq -r '.name // empty' 2>/dev/null)
        if [ -n "$team_name" ] && [ "$team_name" != "null" ]; then
            echo "$team_name"
            return 0
        fi
    fi

    return 1
}

# Function to create athlete from JSON file
create_athlete() {
    local json_file=$1
    local skip_confirmation=${2:-false}

    # Validate JSON file
    print_status "$YELLOW" "Validating JSON file..."
    if ! validate_json_file "$json_file"; then
        return 1
    fi

    # Get team name for display
    local teamId=$(jq -r '.teamId' "$json_file")
    local team_name=$(get_team_name "$teamId")
    if [ -n "$team_name" ]; then
        print_status "$GREEN" "✓ Team verified: $team_name (ID: $teamId)"
    else
        print_status "$YELLOW" "⚠ Could not verify team ID $teamId (may still be valid)"
    fi

    # Display the data that will be created
    display_athlete_data "$json_file"

    # Confirm before creating (unless skipped)
    if [ "$skip_confirmation" != "true" ]; then
        echo ""
        read -p "Do you want to create this athlete? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "$YELLOW" "Creation cancelled"
            return 1
        fi
    fi

    # Read JSON data from file
    local json_data=$(cat "$json_file")

    # Make API request to create athlete
    print_status "$YELLOW" "\nCreating athlete..."

    response=$(curl -s -w "\n%{http_code}" -X POST "${API_BASE_URL}/athletes" \
        -H "Authorization: Bearer ${ADMIN_PASSWORD}" \
        -H "Content-Type: application/json" \
        -d "$json_data")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "201" ]; then
        print_status "$GREEN" "✓ Athlete created successfully!"

        # Extract and display key information
        echo ""
        echo "$body" | jq -r '.athlete |
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
            "ID:        " + (.id | tostring) + "\n" +
            "Name:      " + .name + "\n" +
            "Slug:      " + .slug + "\n" +
            "Team:      " + .team.name + "\n" +
            "Goal:      $" + .goal + "\n" +
            "Miles:     " + (.milesGoal | tostring) + " miles\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'

        echo ""
        print_status "$GREEN" "Athlete page will be available at:"
        local slug=$(echo "$body" | jq -r '.athlete.slug')
        print_status "$BLUE" "https://www.umtricanes.com/donate/$slug"
    else
        print_status "$RED" "✗ Failed to create athlete (HTTP $http_code)"

        # Try to parse error message
        local error_msg=$(echo "$body" | jq -r '.error // empty' 2>/dev/null)
        if [ -n "$error_msg" ]; then
            print_status "$RED" "Error: $error_msg"
        else
            echo "$body"
        fi
        return 1
    fi
}

# Function to create multiple athletes from a directory
create_athletes_batch() {
    local directory=$1

    if [ ! -d "$directory" ]; then
        print_status "$RED" "Error: Directory '$directory' not found"
        return 1
    fi

    # Find all JSON files in the directory
    local json_files=("$directory"/*.json)

    if [ ${#json_files[@]} -eq 0 ] || [ ! -f "${json_files[0]}" ]; then
        print_status "$YELLOW" "No JSON files found in '$directory'"
        return 1
    fi

    print_status "$BLUE" "Found ${#json_files[@]} JSON file(s) to process"
    echo ""

    local success_count=0
    local fail_count=0

    for json_file in "${json_files[@]}"; do
        if [ -f "$json_file" ]; then
            local filename=$(basename "$json_file")
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            print_status "$YELLOW" "Processing: $filename"

            if create_athlete "$json_file" true; then
                ((success_count++))
            else
                ((fail_count++))
            fi

            echo ""
        fi
    done

    # Summary
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status "$BLUE" "Batch processing complete!"
    print_status "$GREEN" "✓ Successfully created: $success_count athletes"
    [ $fail_count -gt 0 ] && print_status "$RED" "✗ Failed: $fail_count athletes"
}

# Function to show example JSON
show_example() {
    cat << 'EOF'
Example athlete JSON files:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MINIMAL EXAMPLE (athlete-minimal.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "name": "John Doe",
  "slug": "john-doe",
  "teamId": 1
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL EXAMPLE (athlete-full.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "name": "Jane Smith",
  "slug": "jane-smith",
  "teamId": 2,
  "bio": "Passionate cyclist raising funds for a great cause!",
  "photoUrl": "/images/athletes/jane-smith.jpg",
  "goal": 500,
  "milesGoal": 150
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELD DESCRIPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Required fields:
  • name      - Athlete's display name
  • slug      - URL-friendly identifier (lowercase, letters, numbers, hyphens)
  • teamId    - Team ID number (must exist in database)

Optional fields:
  • bio       - Personal message or description
  • photoUrl  - Path or URL to athlete's photo
  • goal      - Fundraising goal in dollars (default: 200)
  • milesGoal - Miles goal (default: 100)

EOF
}

# Function to list teams
list_teams() {
    print_status "$YELLOW" "Fetching available teams..."

    local teams=$(curl -s "${API_BASE_URL}/teams" 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$teams" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        print_status "$BLUE" "Available Teams:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "$teams" | jq -r '.[] | "ID: \(.id) - \(.name) (\(.color))"'
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        print_status "$RED" "Failed to fetch teams"
    fi
}

# Main function
main() {
    # Load environment variables
    if ! load_env; then
        exit 1
    fi

    # Parse command line arguments
    case "${1:-}" in
        --help|-h|"")
            echo "Production Athlete Creation Script for www.umtricanes.com"
            echo "=========================================================="
            echo ""
            print_status "$GREEN" "✓ Admin password loaded from .env.local"
            echo ""
            echo "Usage:"
            echo "  $0 <json-file>           Create athlete from JSON file"
            echo "  $0 --batch <directory>   Create multiple athletes from directory"
            echo "  $0 --example             Show example JSON format"
            echo "  $0 --teams               List available teams with IDs"
            echo ""
            echo "Examples:"
            echo "  $0 athlete.json"
            echo "  $0 ./athletes/john-doe.json"
            echo "  $0 --batch ./athletes/"
            echo "  $0 --teams"
            ;;

        --example)
            show_example
            ;;

        --teams)
            list_teams
            ;;

        --batch)
            if [ -z "${2:-}" ]; then
                print_status "$RED" "Error: Directory path required"
                echo "Usage: $0 --batch <directory>"
                exit 1
            fi
            create_athletes_batch "$2"
            ;;

        *)
            # Assume it's a JSON file path
            create_athlete "$1"
            ;;
    esac
}

# Run main function
main "$@"