#!/usr/bin/env node

import axios from 'axios';
import * as fs from 'fs';

const { parse } = require('csv-parse/sync');

interface PlayerRole {
    auth: string;
    name: string;
    role: string;
}

interface CsvRow {
    nickname: string;
    auth: string;
    role: string;
}

interface UpdateResult {
    added: number;
    updated: number;
    removed: number;
    errors: string[];
    dryRun: boolean;
    operations: string[];
}

class PlayerRoleUpdater {
    private apiBaseUrl: string;
    private client: any;
    private dryRun: boolean;
    private verbose: boolean;

    constructor(apiBaseUrl: string, token: string, dryRun: boolean = false, verbose: boolean = false) {
        const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
        this.apiBaseUrl = `${cleanBaseUrl}/api/v1`;
        this.dryRun = dryRun;
        this.verbose = verbose;
        this.client = axios.create({
            headers: {
                'cookie': `access_token=${token}`
            }
        });
        axios.defaults.withCredentials = true;
    }

    async updatePlayerRolesFromCsv(csvContent: string): Promise<UpdateResult> {
        const result: UpdateResult = {
            added: 0,
            updated: 0,
            removed: 0,
            errors: [],
            dryRun: this.dryRun,
            operations: []
        };

        try {
            const csvRows: CsvRow[] = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            }) as CsvRow[];
            
            this.validateCsvRows(csvRows, result);
            
            const currentRoles = await this.getAllPlayerRoles();           
            const currentRolesByNickname = new Map<string, PlayerRole>();
            const currentRolesByAuth = new Map<string, PlayerRole>();
            
            currentRoles.forEach(role => {
                currentRolesByNickname.set(role.name.toLowerCase(), role);
                currentRolesByAuth.set(role.auth, role);
            });

            for (const csvRow of csvRows) {
                try {
                    await this.processPlayerRole(csvRow, currentRolesByNickname, currentRolesByAuth, result);
                } catch (error: any) {
                    const errorMsg = `Error processing player ${csvRow.nickname}: ${error.message}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }

        } catch (error: any) {
            const errorMsg = `Failed to update player roles: ${error.message}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
        }

        return result;
    }

    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        if (this.verbose || level === 'error' || level === 'warn') {
            const prefix = this.dryRun ? '[DRY-RUN] ' : '';
            const timestamp = new Date().toISOString();
            console.log(`${timestamp} ${prefix}${message}`);
        }
    }

    private logOperation(operation: string, result: UpdateResult): void {
        result.operations.push(operation);
        this.log(operation, 'info');
    }

    private validateCsvRows(csvRows: CsvRow[], result: UpdateResult): void {
        this.log(`Validating ${csvRows.length} CSV rows...`);
        
        csvRows.forEach((row, index) => {
            const rowNumber = index + 1;
            
            if (!row.nickname || !row.auth || !row.role) {
                const errorMsg = `Row ${rowNumber}: Missing required fields (nickname, auth, or role)`;
                result.errors.push(errorMsg);
                this.log(`⚠️  ${errorMsg}`, 'warn');
                return;
            }
            
            // Validate auth length (should be exactly 43 characters)
            if (row.auth.length !== 43) {
                const warningMsg = `Row ${rowNumber}: Auth for player '${row.nickname}' has ${row.auth.length} characters, expected 43`;
                result.errors.push(warningMsg);
                this.log(`⚠️  ${warningMsg}`, 'warn');
            }
        });
        
        this.log(`Validation complete. ${result.errors.length} issues found.`);
    }

    private async processPlayerRole(
        csvRow: CsvRow, 
        currentRolesByNickname: Map<string, PlayerRole>,
        currentRolesByAuth: Map<string, PlayerRole>,
        result: UpdateResult
    ): Promise<void> {
        const { nickname, auth, role } = csvRow;
        const nicknameLower = nickname.toLowerCase();
        
        this.log(`Processing player: ${nickname} (${auth}) -> ${role}`);
        
        // Check if player exists by nickname
        const existingByNickname = currentRolesByNickname.get(nicknameLower);
        
        if (existingByNickname) {
            // Player exists - check if auth or role needs updating
            if (existingByNickname.auth !== auth) {
                // Different auth - remove old entry and add new one
                const removeOp = `Remove player ${existingByNickname.name} with auth ${existingByNickname.auth}`;
                const addOp = `Add player ${nickname} with auth ${auth} and role ${role}`;
                
                this.logOperation(removeOp, result);
                this.logOperation(addOp, result);
                
                if (!this.dryRun) {
                    await this.removePlayerRole(existingByNickname.auth, existingByNickname.name);
                    await this.addPlayerRole(auth, nickname, role);
                }
                
                result.removed++;
                result.added++;
                this.log(`Replaced player ${nickname}: removed auth ${existingByNickname.auth}, added auth ${auth}`);
            } else if (existingByNickname.role !== role) {
                // Same auth, different role - update role
                const updateOp = `Update role for player ${nickname} (${auth}): ${existingByNickname.role} -> ${role}`;
                this.logOperation(updateOp, result);
                
                if (!this.dryRun) {
                    await this.updatePlayerRole(auth, nickname, role);
                }
                
                result.updated++;
                this.log(`Updated role for player ${nickname} (${auth}): ${existingByNickname.role} -> ${role}`);
            } else {
                // Same auth and role - no action needed
                this.log(`No changes needed for player ${nickname} (${auth})`);
            }
        } else {
            // Player doesn't exist - check if auth is already used by different player
            const existingByAuth = currentRolesByAuth.get(auth);
            if (existingByAuth) {
                // Auth is already used by different player - remove old entry and add new one
                const removeOp = `Remove player ${existingByAuth.name} using auth ${auth}`;
                const addOp = `Add player ${nickname} with auth ${auth} and role ${role}`;
                
                this.logOperation(removeOp, result);
                this.logOperation(addOp, result);
                
                if (!this.dryRun) {
                    await this.removePlayerRole(auth, existingByAuth.name);
                    await this.addPlayerRole(auth, nickname, role);
                }
                
                result.removed++;
                result.added++;
                this.log(`Replaced player using auth ${auth}: removed ${existingByAuth.name}, added ${nickname}`);
            } else {
                const addOp = `Add new player ${nickname} with auth ${auth} and role ${role}`;
                this.logOperation(addOp, result);
                
                if (!this.dryRun) {
                    await this.addPlayerRole(auth, nickname, role);
                }
                
                result.added++;
                this.log(`Added new player ${nickname} with auth ${auth} and role ${role}`);
            }
        }
    }

    private async getAllPlayerRoles(): Promise<PlayerRole[]> {
        try {
            this.log(`Fetching current player roles from ${this.apiBaseUrl}/roleslist/?searchQuery=`);
            const response = await this.client.get(`${this.apiBaseUrl}/roleslist/?searchQuery=`);
            
            this.log(`Retrieved ${response.data.length} existing player roles`);
            const result = response.data as PlayerRole[];
            for (const role of result) {
                console.log(role);
            }
            return result;
        } catch (error: any) {
            this.log(`API Error: ${error.message}`, 'error');
            if (error.response) {
                this.log(`Status: ${error.response.status}`, 'error');
                this.log(`Response: ${JSON.stringify(error.response.data)}`, 'error');
            }
            throw new Error(`Failed to fetch current player roles: ${error.message}`);
        }
    }

    private async addPlayerRole(auth: string, name: string, role: string): Promise<void> {
        if (this.dryRun) {
            this.log(`[DRY-RUN] Would POST ${this.apiBaseUrl}/roleslist/${auth} with { name: "${name}", role: "${role}" }`);
            return;
        }
        
        try {
            this.log(`POST ${this.apiBaseUrl}/roleslist/${auth} with { name: "${name}", role: "${role}" }`);
            await this.client.post(`${this.apiBaseUrl}/roleslist/${auth}`, { name, role });
        } catch (error: any) {
            throw new Error(`Failed to add player role: ${error.message}`);
        }
    }

    private async updatePlayerRole(auth: string, name: string, role: string): Promise<void> {
        if (this.dryRun) {
            this.log(`[DRY-RUN] Would PUT ${this.apiBaseUrl}/roleslist/${auth} with { name: "${name}", role: "${role}" }`);
            return;
        }
        
        try {
            this.log(`PUT ${this.apiBaseUrl}/roleslist/${auth} with { name: "${name}", role: "${role}" }`);
            await this.client.put(`${this.apiBaseUrl}/roleslist/${auth}`, { name, role });
        } catch (error: any) {
            throw new Error(`Failed to update player role: ${error.message}`);
        }
    }

    private async removePlayerRole(auth: string, name: string): Promise<void> {
        if (this.dryRun) {
            this.log(`[DRY-RUN] Would DELETE ${this.apiBaseUrl}/roleslist/${auth}?name=${encodeURIComponent(name)}`);
            return;
        }
        
        try {
            this.log(`DELETE ${this.apiBaseUrl}/roleslist/${auth}?name=${encodeURIComponent(name)}`);
            await this.client.delete(`${this.apiBaseUrl}/roleslist/${auth}?name=${encodeURIComponent(name)}`);
        } catch (error: any) {
            throw new Error(`Failed to remove player role: ${error.message}`);
        }
    }

    async resetAllRolesExcept(protectedRoles: string[] = ['s-adm', 'co-host']): Promise<UpdateResult> {
        const result: UpdateResult = {
            added: 0,
            updated: 0,
            removed: 0,
            errors: [],
            dryRun: this.dryRun,
            operations: []
        };

        try {
            this.log(`Resetting all roles except: ${protectedRoles.join(', ')}`);
            
            const currentRoles = await this.getAllPlayerRoles();         
            const rolesToRemove = currentRoles.filter(role => 
                !protectedRoles.includes(role.role)
            );
            
            this.log(`Found ${currentRoles.length} total roles, ${rolesToRemove.length} will be removed`);
            
            for (const role of rolesToRemove) {
                try {
                    const removeOp = `Remove player ${role.name} (${role.auth}) with role ${role.role}`;
                    this.logOperation(removeOp, result);
                    
                    if (!this.dryRun) {
                        await this.removePlayerRole(role.auth, role.name);
                    }
                    
                    result.removed++;
                    this.log(`Removed player ${role.name} (${role.auth}) with role ${role.role}`);
                } catch (error: any) {
                    const errorMsg = `Error removing player ${role.name} (${role.auth}): ${error.message}`;
                    result.errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }
            
            this.log(`Reset completed. Removed ${result.removed} roles, preserved ${currentRoles.length - rolesToRemove.length} protected roles`);
            
        } catch (error: any) {
            const errorMsg = `Failed to reset roles: ${error.message}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
        }

        return result;
    }
}

/**
 * CLI utility for updating player roles from CSV file or resetting all roles
 * Usage: 
 *   - Update from CSV: node updatePlayerRoles.js <csv-file-path> --api-url <api-base-url> --token <api-token> [--dry-run] [--verbose]
 *   - Reset all roles: node updatePlayerRoles.js --reset-roles --api-url <api-base-url> --token <api-token> [--dry-run] [--verbose]
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.error(`Usage: node updatePlayerRoles.js [<csv-file-path>] --api-url <api-base-url> --token <api-token> [options]

Arguments:
  csv-file-path  Path to CSV file with player data (optional if using --reset-roles)

Options:
  --api-url      API base URL (host:port) - /api/v1 will be appended automatically
  --token        API token for authentication (sent in cookie header)
  --reset-roles  Reset all roles except s-adm and co-host (removes all other roles)
  --dry-run      Show what would be done without making changes
  --verbose      Enable verbose logging
  --help, -h     Show this help message

CSV file should have the following format:
nickname,auth,role
player1,auth123,admin
player2,auth456,moderator

Examples:
  # Update roles from CSV file
  node updatePlayerRoles.js players.csv --api-url https://hosts.cis-haxball.ru --token your-token
  
  # Reset all roles except s-adm and co-host
  node updatePlayerRoles.js --reset-roles --api-url https://hosts.cis-haxball.ru --token your-token
  
  # Dry run to see what would be reset
  node updatePlayerRoles.js --reset-roles --api-url https://hosts.cis-haxball.ru --token your-token --dry-run --verbose`);
        process.exit(1);
    }

    const dryRun = args.includes('--dry-run');
    const verbose = args.includes('--verbose');
    const resetRoles = args.includes('--reset-roles');
    
    const apiUrlIndex = args.indexOf('--api-url');
    const tokenIndex = args.indexOf('--token');
    
    if (apiUrlIndex === -1 || tokenIndex === -1) {
        console.error('Error: --api-url and --token are required');
        console.error('Use --help for usage information');
        process.exit(1);
    }
    
    const apiUrl = args[apiUrlIndex + 1];
    const token = args[tokenIndex + 1];
    
    if (!apiUrl || !token) {
        console.error('Error: --api-url and --token must have values');
        console.error('Use --help for usage information');
        process.exit(1);
    }
    
    if (!resetRoles) {
        const csvFilePath = args[0];
        if (!csvFilePath) {
            console.error('Error: CSV file path is required when not using --reset-roles');
            console.error('Use --help for usage information');
            process.exit(1);
        }
        
        if (!fs.existsSync(csvFilePath)) {
            console.error(`Error: File '${csvFilePath}' does not exist`);
            process.exit(1);
        }
    }

    try {
        const updater = new PlayerRoleUpdater(apiUrl, token, dryRun, verbose);
        let result: UpdateResult;
        
        if (resetRoles) {
            // Reset all roles except s-adm and co-host
            if (dryRun) {
                console.log('🔍 DRY-RUN MODE: No changes will be made');
            } else {
                console.log('Resetting all roles except s-adm and co-host...');
            }
            
            console.log(`Using API URL: ${apiUrl}`);
            
            if (verbose) {
                console.log('Verbose logging enabled');
            }
            
            result = await updater.resetAllRolesExcept();
        } else {
            const csvFilePath = args[0];
            console.log(`Reading CSV file: ${csvFilePath}`);
            const csvContent = fs.readFileSync(csvFilePath, 'utf8');
            
            if (dryRun) {
                console.log('🔍 DRY-RUN MODE: No changes will be made');
            } else {
                console.log('Updating player roles...');
            }
            
            console.log(`Using API URL: ${apiUrl}`);
            
            if (verbose) {
                console.log('Verbose logging enabled');
            }
            
            result = await updater.updatePlayerRolesFromCsv(csvContent);
        }
        
        // Display results
        const operationType = resetRoles ? 'Reset' : 'Update';
        let resultsOutput = `\n=== ${operationType} Results ===`;
        if (result.dryRun) {
            resultsOutput += `\n🔍 DRY-RUN MODE - No actual changes were made`;
        }
        resultsOutput += `\nAdded: ${result.added} players`;
        resultsOutput += `\nUpdated: ${result.updated} players`;
        resultsOutput += `\nRemoved: ${result.removed} players`;
        
        if (resetRoles && result.removed > 0) {
            resultsOutput += `\n\nPreserved roles: s-adm, co-host`;
        }
        
        if (result.operations.length > 0) {
            resultsOutput += `\n\nOperations (${result.operations.length}):`;
            result.operations.forEach((operation, index) => {
                resultsOutput += `\n${index + 1}. ${operation}`;
            });
        }
        
        if (result.errors.length > 0) {
            resultsOutput += `\n\nErrors (${result.errors.length}):`;
            result.errors.forEach((error, index) => {
                resultsOutput += `\n${index + 1}. ${error}`;
            });
        }
        
        if (result.dryRun) {
            resultsOutput += `\n\n🔍 Dry-run completed successfully! Use without --dry-run to apply changes.`;
        } else {
            const successMessage = resetRoles ? 
                'Role reset completed successfully!' : 
                'Player role update completed successfully!';
            resultsOutput += `\n\n${successMessage}`;
        }
        
        console.log(resultsOutput);
        
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}