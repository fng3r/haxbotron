import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import request from 'supertest';
import * as ruidlistController from '../../../api/controller/v1/ruidlist';
import { errorHandler } from '../../../api/middleware/errorHandler';

// Mock API DB adapter
jest.mock('../../../lib/db/adapters/ApiDbAdapter', () => ({
    apiDbAdapter: {
        getRuidList: jest.fn(),
    }
}));

const { apiDbAdapter: dbClient } = require('../../../lib/db/adapters/ApiDbAdapter');

describe('RUID List API Integration Tests', () => {
    let app: Koa;

    beforeEach(() => {
        jest.clearAllMocks();
        
        app = new Koa();
        app.use(errorHandler);
        app.use(bodyParser());
        
        const router = new Router();
        router.get('/ruidlist', ruidlistController.getAllList);
        
        app.use(router.routes());
        app.use(router.allowedMethods());
    });

    describe('GET /ruidlist - Get All RUIDs', () => {
        it('should return all room unique identifiers', async () => {
            const mockRuidList = [
                { ruid: 'room1' },
                { ruid: 'room2' },
                { ruid: 'room3' }
            ];

            (dbClient.getRuidList as jest.Mock).mockResolvedValue(mockRuidList);

            const response = await request(app.callback())
                .get('/ruidlist')
                .expect(200);

            expect(response.body).toEqual(mockRuidList);
        });

        it('should return empty array when no rooms exist', async () => {
            (dbClient.getRuidList as jest.Mock).mockResolvedValue([]);

            const response = await request(app.callback())
                .get('/ruidlist')
                .expect(200);

            expect(response.body).toEqual([]);
        });
    });
});
