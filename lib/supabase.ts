import { createClient } from '@supabase/supabase-js'

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Check if Supabase is properly configured
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('⚠️ Supabase is not properly configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for the follows table
export interface Follow {
    id: string
    follower_id: string
    following_id: string
    created_at: string
}

// Follow service functions
export const followService = {
    // Follow a user
    async followUser(followerId: string, followingId: string): Promise<Follow> {
        // Check if Supabase is configured
        if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            throw new Error('Supabase is not configured. Please set up your environment variables.')
        }

        const { data, error } = await supabase
            .from('follows')
            .insert({
                follower_id: followerId,
                following_id: followingId,
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to follow user: ${error.message}`)
        }

        return data
    },

    // Unfollow a user
    async unfollowUser(followerId: string, followingId: string): Promise<void> {
        // Check if Supabase is configured
        if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            throw new Error('Supabase is not configured. Please set up your environment variables.')
        }

        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId)

        if (error) {
            throw new Error(`Failed to unfollow user: ${error.message}`)
        }
    },

    // Check if user is following another user
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        // Check if Supabase is configured
        if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn('Supabase is not configured, returning false for follow status')
            return false
        }

        const { data, error } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
            throw new Error(`Failed to check follow status: ${error.message}`)
        }

        return !!data
    },

    // Get follow count for a user
    async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
        // Check if Supabase is configured
        if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
            console.warn('Supabase is not configured, returning zero counts')
            return { followers: 0, following: 0 }
        }

        const [followersResult, followingResult] = await Promise.all([
            supabase
                .from('follows')
                .select('id', { count: 'exact' })
                .eq('following_id', userId),
            supabase
                .from('follows')
                .select('id', { count: 'exact' })
                .eq('follower_id', userId)
        ])

        if (followersResult.error) {
            throw new Error(`Failed to get followers count: ${followersResult.error.message}`)
        }

        if (followingResult.error) {
            throw new Error(`Failed to get following count: ${followingResult.error.message}`)
        }

        return {
            followers: followersResult.count || 0,
            following: followingResult.count || 0
        }
    }
} 