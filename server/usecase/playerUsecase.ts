import { SCREEN_WIDTH } from '$/commonConstantsWithClient';
import assert from 'assert';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { UserId } from '../commonTypesWithClient/branded';
import type { PlayerModel } from '../commonTypesWithClient/models';
import { playerRepository } from '../repository/playerRepository';
import { userIdParser } from '../service/idParsers';

export type MoveDirection = { x: number; y: number };

const judgment = (currentPlayerInfo: PlayerModel, newPos: { x: number; y: number }) => {
  if (
    (currentPlayerInfo.side === 'left' && newPos.x > SCREEN_WIDTH) ||
    (currentPlayerInfo.side === 'right' && newPos.x < 0)
  ) {
    playerUseCase.finishGame(currentPlayerInfo);
    return null;
  }
};
//moveDirectionの値をzodでバリデーションする
const MoveDirectionSchema = z.object({
  x: z.number().min(-1).max(1),
  y: z.number().min(-1).max(1),
});
export const playerUseCase = {
  create: async (name: string, teamInfo: number): Promise<PlayerModel> => {
    //playerの初期ステータス(デバッグ用)
    console.log(teamInfo);
    if (teamInfo === 1) {
      const playerData: PlayerModel = {
        userId: userIdParser.parse(randomUUID()),
        pos: { x: 50, y: 300 },
        name,
        score: 0,
        vector: { x: 5, y: 5 },
        Items: [],
        side: 'left',
        isPlaying: true,
      };
      await playerRepository.save(playerData);
      return playerData;
    } else {
      const playerData: PlayerModel = {
        userId: userIdParser.parse(randomUUID()),
        pos: { x: 1300, y: 300 },
        name,
        score: 0,
        vector: { x: 5, y: 5 },
        Items: [],
        side: 'right',
        isPlaying: true,
      };
      await playerRepository.save(playerData);
      return playerData;
    }
  },
  move: async (moveDirection: MoveDirection, userId: UserId): Promise<PlayerModel | null> => {
    const currentPlayerInfo = await playerRepository.find(userId);
    if (currentPlayerInfo === null) return null;
    const validatedMoveDirection = MoveDirectionSchema.parse(moveDirection);

    const newPos = {
      x: currentPlayerInfo.pos.x + validatedMoveDirection.x * currentPlayerInfo.vector.x,
      y: currentPlayerInfo.pos.y + validatedMoveDirection.y * currentPlayerInfo.vector.y,
    };
    if (judgment(currentPlayerInfo, newPos) === null) return null;
    const updatePlayerInfo: PlayerModel = {
      ...currentPlayerInfo,
      pos: newPos,
    };
    await playerRepository.save(updatePlayerInfo);
    return updatePlayerInfo;
  },
  addScore: async (userId: UserId, score: number): Promise<PlayerModel | null> => {
    const currentPlayerInfo = await playerRepository.find(userId);
    assert(currentPlayerInfo);
    const updatePlayerInfo: PlayerModel = {
      ...currentPlayerInfo,
      score: currentPlayerInfo.score + score,
    };
    await playerRepository.save(updatePlayerInfo);
    return updatePlayerInfo;
  },
  getStatus: async (userId: UserId) => {
    const currentPlayerInfo = await playerRepository.find(userId);
    if (currentPlayerInfo === null) return null;
    return currentPlayerInfo;
  },

  finishGame: async (currentPlayerInfo: PlayerModel) => {
    if (currentPlayerInfo === null) return null;
    const updatePlayerInfo: PlayerModel = {
      ...currentPlayerInfo,
      isPlaying: false,
    };

    await playerRepository.save(updatePlayerInfo);

    return updatePlayerInfo;
  },
  getAllStatus: async () => {
    return await playerRepository.findAll();
  },
  getPlayersByDisplayNumber: async (displayNumber: number) => {
    const players = await playerRepository.findAll();
    const playersByDisplayNumber = players.filter((player) => {
      if (typeof player.pos.x === 'number' && player.isPlaying) {
        return Math.floor(player.pos.x / 1920) === displayNumber;
      }
      return [];
    });
    return playersByDisplayNumber;
  },
  // getIsPlayingPlayer: async () => {
  //   return await playerRepository.findPlayingOrDead(true);
  // },
};
