import { supabase } from './supabase'

export interface LeaderboardEntry {
  player: string
  score:  number
}

export async function submitScore(player: string, score: number): Promise<void> {
  const { error } = await supabase
    .from('leaderboard')
    .insert({ player: player.trim().slice(0, 20), score })
  if (error) throw error
}

export async function fetchTop(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('player, score')
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}
