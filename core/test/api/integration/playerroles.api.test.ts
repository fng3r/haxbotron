import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import request from 'supertest';
import * as playerRolesController from '../../../api/controller/v1/playerrolelist';
import { errorHandler } from '../../../api/middleware/errorHandler';

// Mock API DB adapter
jest.mock('../../../lib/db/adapters/ApiDbAdapter', () => ({
    apiDbAdapter: {
        searchPlayerRoles: jest.fn(),
        createPlayerRole: jest.fn(),
        updatePlayerRole: jest.fn(),
        deletePlayerRole: jest.fn(),
        searchPlayerRoleEvents: jest.fn(),
    }
}));

const { apiDbAdapter: dbClient } = require('../../../lib/db/adapters/ApiDbAdapter');

describe('Player Roles API Integration Tests', () => {
    let app: Koa;

    beforeEach(() => {
        jest.clearAllMocks();
        
        app = new Koa();
        app.use(errorHandler);
        app.use(bodyParser());
        
        const router = new Router();
        router.get('/player-roles', playerRolesController.getAllList);
        router.get('/player-roles/events', playerRolesController.getEventsList);
        router.post('/player-roles/:auth', playerRolesController.addPlayerRole);
        router.put('/player-roles/:auth', playerRolesController.updatePlayerRole);
        router.delete('/player-roles/:auth', playerRolesController.deletePlayerRole);
        
        app.use(router.routes());
        app.use(router.allowedMethods());
    });

    describe('GET /player-roles - Search Player Roles', () => {
        it('should return all player roles when no filters provided', async () => {
            const mockRoles = [
                { auth: 'auth1', name: 'Player 1', role: 'admin' },
                { auth: 'auth2', name: 'Player 2', role: 'moderator' }
            ];

            (dbClient.searchPlayerRoles as jest.Mock).mockResolvedValue(mockRoles);

            const response = await request(app.callback())
                .get('/player-roles')
                .expect(200);

            expect(response.body).toEqual(mockRoles);
        });

        it('should return filtered player roles when searchQuery provided', async () => {
            const mockRoles = [
                { auth: 'auth1', name: 'Admin User', role: 'admin' }
            ];

            (dbClient.searchPlayerRoles as jest.Mock).mockResolvedValue(mockRoles);

            const response = await request(app.callback())
                .get('/player-roles?searchQuery=admin&start=0&count=10')
                .expect(200);

            expect(response.body).toEqual(mockRoles);
        });
    });

    describe('POST /player-roles/:auth - Add Player Role', () => {
        it('should create a new player role', async () => {
            (dbClient.createPlayerRole as jest.Mock).mockResolvedValue(undefined);

            await request(app.callback())
                .post('/player-roles/auth123')
                .send({ name: 'Test Player', role: 'admin' })
                .expect(204);
        });

        it('should return 400 when required fields are missing', async () => {
            const response = await request(app.callback())
                .post('/player-roles/auth123')
                .send({ name: 'Test Player' })
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 409 when player already exists', async () => {
            const ConflictError = require('../../../lib/errors').ConflictError;
            const mockError = new ConflictError(`Player with auth 'auth123' is already added`);
            (dbClient.createPlayerRole as jest.Mock).mockRejectedValue(mockError);

            const response = await request(app.callback())
                .post('/player-roles/auth123')
                .send({ name: 'Test Player', role: 'admin' })
                .expect(409);

            expect(response.body.error.code).toBe('CONFLICT');
        });
    });

    describe('PUT /player-roles/:auth - Update Player Role', () => {
        it('should update an existing player role', async () => {
            (dbClient.updatePlayerRole as jest.Mock).mockResolvedValue(undefined);

            await request(app.callback())
                .put('/player-roles/auth123')
                .send({ name: 'Updated Player', role: 'moderator' })
                .expect(204);
        });

        it('should return 400 when required fields are missing', async () => {
            const response = await request(app.callback())
                .put('/player-roles/auth123')
                .send({ role: 'admin' })
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('DELETE /player-roles/:auth - Delete Player Role', () => {
        it('should delete a player role', async () => {
            (dbClient.deletePlayerRole as jest.Mock).mockResolvedValue(undefined);

            await request(app.callback())
                .delete('/player-roles/auth123?name=Test%20Player')
                .expect(204);
        });

        it('should return 400 when name parameter is missing', async () => {
            const response = await request(app.callback())
                .delete('/player-roles/auth123')
                .expect(400);

            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /player-roles/events - Get Player Role Events', () => {
        it('should return all player role events', async () => {
            const mockEvents = [
                { type: 'addrole', auth: 'auth1', name: 'Player 1', role: 'admin', timestamp: 123456 },
                { type: 'rmrole', auth: 'auth2', name: 'Player 2', role: 'moderator', timestamp: 123457 }
            ];

            (dbClient.searchPlayerRoleEvents as jest.Mock).mockResolvedValue(mockEvents);

            const response = await request(app.callback())
                .get('/player-roles/events')
                .expect(200);

            expect(response.body).toEqual(mockEvents);
        });

        it('should return filtered events when searchQuery provided', async () => {
            const mockEvents = [
                { type: 'addrole', auth: 'auth1', name: 'Admin User', role: 'admin', timestamp: 123456 }
            ];

            (dbClient.searchPlayerRoleEvents as jest.Mock).mockResolvedValue(mockEvents);

            const response = await request(app.callback())
                .get('/player-roles/events?searchQuery=admin&start=0&count=10')
                .expect(200);

            expect(response.body).toEqual(mockEvents);
        });
    });
});
