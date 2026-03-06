import { supabase } from './supabase'

export type GameTable = 'leaderboard' | 'leaderboard_breakout' | 'leaderboard_tetris'

export interface LeaderboardEntry {
  player: string
  score:  number
}

export async function submitScore(player: string, score: number, table: GameTable = 'leaderboard'): Promise<void> {
  const { error } = await supabase
    .from(table)
    .insert({ player: player.trim().slice(0, 20), score })
  if (error) throw error
}

export async function fetchTop(limit = 10, table: GameTable = 'leaderboard'): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from(table)
    .select('player, score')
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
