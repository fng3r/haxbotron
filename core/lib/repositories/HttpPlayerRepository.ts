import axios, { AxiosInstance } from "axios";
import { PlayerStorage } from "../../game/model/GameObject/PlayerState";
import { IPlayerRepository } from "./IPlayerRepository";
import { DatabaseError } from "../errors";
import { winstonLogger } from "../../winstonLoggerSystem";

/**
 * HTTP-based implementation of player repository
 */
export class HttpPlayerRepository implements IPlayerRepository {
  constructor(private readonly baseUrl: string, private readonly client: AxiosInstance = axios) {}

  async create(ruid: string, player: PlayerStorage): Promise<void> {
    try {
      const result = await this.client.post(`${this.baseUrl}room/${ruid}/player`, player);
      if (result.status === 201) {
        winstonLogger.info(`Player created: ${player.auth}`);
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        winstonLogger.info(`Player already exists: ${player.auth}`);
        throw new DatabaseError('Player already exists', { auth: player.auth });
      } else {
        winstonLogger.error(`Error creating player: ${error.message}`);
        throw new DatabaseError('Failed to create player', { auth: player.auth, error: error.message });
      }
    }
  }

  async read(ruid: string, auth: string): Promise<PlayerStorage | null> {
    try {
      const result = await this.client.get(`${this.baseUrl}room/${ruid}/player/${auth}`);
      if (result.status === 200 && result.data) {
        winstonLogger.info(`Player read: ${auth}`);
        return result.data as PlayerStorage;
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        winstonLogger.info(`Player not found: ${auth}`);
        return null;
      } else {
        winstonLogger.error(`Error reading player: ${error.message}`);
        throw new DatabaseError('Failed to read player', { auth, error: error.message });
      }
    }
  }

  async update(ruid: string, player: PlayerStorage): Promise<void> {
    try {
      const result = await this.client.put(`${this.baseUrl}room/${ruid}/player`, player);
      if (result.status === 200) {
        winstonLogger.info(`Player updated: ${player.auth}`);
      }
    } catch (error: any) {
      winstonLogger.error(`Error updating player: ${error.message}`);
      throw new DatabaseError('Failed to update player', { auth: player.auth, error: error.message });
    }
  }

  async delete(ruid: string, auth: string): Promise<void> {
    try {
      const result = await this.client.delete(`${this.baseUrl}room/${ruid}/player/${auth}`);
      if (result.status === 204) {
        winstonLogger.info(`Player deleted: ${auth}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        winstonLogger.info(`Player not found for deletion: ${auth}`);
        // Don't throw error for deletion of non-existent player
      } else {
        winstonLogger.error(`Error deleting player: ${error.message}`);
        throw new DatabaseError('Failed to delete player', { auth, error: error.message });
      }
    }
  }

  async exists(ruid: string, auth: string): Promise<boolean> {
    const player = await this.read(ruid, auth);
    return player !== null;
  }
}
