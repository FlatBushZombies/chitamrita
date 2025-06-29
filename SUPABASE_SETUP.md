# Supabase Setup for Follow Functionality

## Prerequisites
1. A Supabase project (create one at https://supabase.com)
2. Your Supabase project URL and anon key

## Setup Steps

### 1. Environment Variables
Add these to your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `supabase-setup.sql`

### 3. Row Level Security (RLS) Configuration
The SQL script includes RLS policies, but you may need to adjust them based on your authentication setup:

- If using Clerk, you might need to modify the policies to use Clerk user IDs instead of `current_user`
- The current setup assumes the user ID is stored in the `follower_id` and `following_id` columns

### 4. Testing the Setup
1. Start your app
2. Navigate to the Search screen
3. Search for users and try following/unfollowing them
4. Check the Supabase dashboard to see the follows table being populated

## Table Structure

The `follows` table has the following structure:
- `id`: UUID primary key (auto-generated)
- `follower_id`: TEXT - The user who is following (Clerk user ID)
- `following_id`: TEXT - The user being followed (Clerk user ID)
- `created_at`: TIMESTAMP - When the follow relationship was created

## Features Implemented

1. **Follow/Unfollow**: Users can follow and unfollow other users
2. **Follow Status Check**: Automatically checks if a user is following another user
3. **Follow Counts**: Get follower and following counts for any user
4. **Real-time Updates**: Follow status updates immediately in the UI
5. **Error Handling**: Proper error handling for failed operations
6. **Loading States**: Loading indicators during follow/unfollow operations

## API Functions

The `followService` provides these functions:

- `followUser(followerId, followingId)`: Follow a user
- `unfollowUser(followerId, followingId)`: Unfollow a user
- `isFollowing(followerId, followingId)`: Check if user is following another user
- `getFollowCounts(userId)`: Get follower and following counts

## Security Features

- Row Level Security (RLS) enabled
- Users can only create/delete their own follows
- Users can view follows they're involved in
- Unique constraint prevents duplicate follows
- Check constraint prevents self-following 