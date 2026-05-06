# Client-Side Caching Implementation Guide

## 📱 Overview

This guide shows how to implement client-side caching in the React Native app to reduce Supabase queries and improve user experience.

## 🎯 Goals

- Reduce Supabase queries by 80%
- Instant screen loads from cache
- Automatic background refresh
- Offline support

## 🔧 Implementation Options

### Option 1: React Query (Recommended) ⭐

**Why React Query?**
- Industry standard for data fetching
- Built-in caching, refetching, and invalidation
- Excellent TypeScript support
- Works great with Supabase

#### Installation

```bash
npm install @tanstack/react-query
# or
yarn add @tanstack/react-query
```

#### Setup

```typescript
// app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      cacheTime: 30 * 60 * 1000,     // 30 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

#### Update Services

```typescript
// services/picks-service.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, DailyPick } from '../lib/supabase';

// ============================================================================
// QUERY KEYS - Centralized for easy invalidation
// ============================================================================

export const picksKeys = {
  all: ['picks'] as const,
  today: () => [...picksKeys.all, 'today'] as const,
  byDate: (date: string) => [...picksKeys.all, 'date', date] as const,
  dates: () => [...picksKeys.all, 'dates'] as const,
  stats: (date: string) => [...picksKeys.all, 'stats', date] as const,
  userStats: () => [...picksKeys.all, 'user-stats'] as const,
};

// ============================================================================
// HOOKS - Use these in your components
// ============================================================================

/**
 * Fetch today's picks with automatic caching
 * 
 * Usage:
 * const { data, isLoading, error, refetch } = useTodayPicks();
 */
export function useTodayPicks() {
  return useQuery({
    queryKey: picksKeys.today(),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_picks')
        .select(`
          *,
          pick_selections (*)
        `)
        .eq('pick_date', today)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as DailyPick[];
    },
    staleTime: 5 * 60 * 1000,        // 5 minutes
    cacheTime: 30 * 60 * 1000,       // 30 minutes
  });
}

/**
 * Fetch picks by date with automatic caching
 * 
 * Usage:
 * const { data, isLoading } = usePicksByDate('2026-05-05');
 */
export function usePicksByDate(dateStr: string) {
  return useQuery({
    queryKey: picksKeys.byDate(dateStr),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_picks')
        .select(`
          *,
          pick_selections (*)
        `)
        .eq('pick_date', dateStr)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as DailyPick[];
    },
    staleTime: 10 * 60 * 1000,       // 10 minutes (historical data)
    cacheTime: 60 * 60 * 1000,       // 1 hour
  });
}

/**
 * Fetch available dates with automatic caching
 * 
 * Usage:
 * const { data: dates } = useAvailableDates();
 */
export function useAvailableDates() {
  return useQuery({
    queryKey: picksKeys.dates(),
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('daily_picks')
        .select('pick_date')
        .gte('pick_date', thirtyDaysAgo)
        .order('pick_date', { ascending: false });

      if (error) throw error;
      return [...new Set((data ?? []).map((d: any) => d.pick_date))];
    },
    staleTime: 15 * 60 * 1000,       // 15 minutes
    cacheTime: 60 * 60 * 1000,       // 1 hour
  });
}

/**
 * Fetch user statistics with automatic caching
 * 
 * Usage:
 * const { data: stats } = useUserStats();
 */
export function useUserStats() {
  return useQuery({
    queryKey: picksKeys.userStats(),
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const { data: allPicks } = await supabase
        .from('daily_picks')
        .select('status, combined_odds')
        .gte('pick_date', thirtyDaysAgo)
        .neq('status', 'pending');

      const { data: last7 } = await supabase
        .from('daily_picks')
        .select('status')
        .gte('pick_date', sevenDaysAgo)
        .neq('status', 'pending');

      const total = allPicks?.length ?? 0;
      const won = allPicks?.filter((p: any) => p.status === 'won').length ?? 0;
      const hitRateAllTime = total > 0 ? Math.round((won / total) * 100) : 0;

      const total7 = last7?.length ?? 0;
      const won7 = last7?.filter((p: any) => p.status === 'won').length ?? 0;
      const hitRate7Days = total7 > 0 ? Math.round((won7 / total7) * 100) : 0;

      let roi = 0;
      if (allPicks && total > 0) {
        let profit = 0;
        for (const p of allPicks) {
          if (p.status === 'won') profit += (p.combined_odds - 1);
          else if (p.status === 'lost') profit -= 1;
        }
        roi = Math.round((profit / total) * 100);
      }

      return { totalPicks: total, hitRate7Days, hitRateAllTime, roi };
    },
    staleTime: 10 * 60 * 1000,       // 10 minutes
    cacheTime: 30 * 60 * 1000,       // 30 minutes
  });
}

/**
 * Trigger pick generation (admin only)
 * 
 * Usage:
 * const { mutate: generatePicks, isLoading } = useGeneratePicks();
 * generatePicks({ force: true });
 */
export function useGeneratePicks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ force = false }: { force?: boolean }) => {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
      
      const url = `${supabaseUrl}/functions/v1/generate-daily-picks${force ? '?force=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${anonKey}` },
      });
      
      if (!res.ok) throw new Error('Failed to generate picks');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all picks queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: picksKeys.all });
    },
  });
}
```

#### Update Components

```typescript
// app/(tabs)/index.tsx
import { useTodayPicks } from '../../services/picks-service';

export default function HomeScreen() {
  const { data: picks, isLoading, error, refetch } = useTodayPicks();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }
  
  return (
    <ScrollView refreshControl={
      <RefreshControl refreshing={isLoading} onRefresh={refetch} />
    }>
      {picks?.map(pick => (
        <PickCard key={pick.id} pick={pick} />
      ))}
    </ScrollView>
  );
}
```

```typescript
// app/(tabs)/results.tsx
import { useState } from 'react';
import { usePicksByDate, useAvailableDates } from '../../services/picks-service';

export default function ResultsScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  const { data: picks, isLoading } = usePicksByDate(selectedDate);
  const { data: availableDates } = useAvailableDates();
  
  return (
    <View>
      <DatePicker
        dates={availableDates}
        selected={selectedDate}
        onSelect={setSelectedDate}
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        picks?.map(pick => <PickCard key={pick.id} pick={pick} />)
      )}
    </View>
  );
}
```

### Option 2: SWR (Alternative)

```bash
npm install swr
```

```typescript
import useSWR from 'swr';

export function useTodayPicks() {
  return useSWR('picks-today', fetchTodayPicks, {
    refreshInterval: 5 * 60 * 1000,  // 5 minutes
    revalidateOnFocus: false,
  });
}
```

## 🔄 Real-time Updates

Combine caching with Supabase Realtime for instant updates:

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { picksKeys } from '../services/picks-service';

export function useRealtimePickUpdates() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('daily_picks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_picks',
        },
        (payload) => {
          console.log('Pick updated:', payload);
          
          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: picksKeys.all });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Use in your root layout
export default function RootLayout() {
  useRealtimePickUpdates();
  
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
    </QueryClientProvider>
  );
}
```

## 📊 Performance Monitoring

Track cache performance in development:

```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data, query) => {
        console.log(`✓ Cache HIT: ${query.queryKey.join('/')}`);
      },
      onError: (error, query) => {
        console.error(`✗ Query ERROR: ${query.queryKey.join('/')}`, error);
      },
    },
  },
});
```

## 🎯 Best Practices

### 1. Prefetch Data

Prefetch data before user navigates:

```typescript
const queryClient = useQueryClient();

// Prefetch tomorrow's fixtures when user opens app
useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['fixtures', 'tomorrow'],
    queryFn: fetchTomorrowFixtures,
  });
}, []);
```

### 2. Optimistic Updates

Update UI immediately, sync with server in background:

```typescript
const { mutate } = useMutation({
  mutationFn: updatePick,
  onMutate: async (newPick) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: picksKeys.today() });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(picksKeys.today());
    
    // Optimistically update
    queryClient.setQueryData(picksKeys.today(), (old: any) => {
      return old.map((p: any) => p.id === newPick.id ? newPick : p);
    });
    
    return { previous };
  },
  onError: (err, newPick, context) => {
    // Rollback on error
    queryClient.setQueryData(picksKeys.today(), context?.previous);
  },
});
```

### 3. Selective Invalidation

Invalidate only affected queries:

```typescript
// Invalidate only today's picks
queryClient.invalidateQueries({ queryKey: picksKeys.today() });

// Invalidate all picks
queryClient.invalidateQueries({ queryKey: picksKeys.all });

// Invalidate specific date
queryClient.invalidateQueries({ queryKey: picksKeys.byDate('2026-05-05') });
```

## 📈 Expected Results

### Before Client-Side Caching

- **Home screen load:** 500-1000ms
- **Supabase queries:** 3 per screen load
- **Data usage:** ~50KB per load
- **User experience:** Visible loading states

### After Client-Side Caching

- **Home screen load:** 50-100ms (from cache)
- **Supabase queries:** 0.3 per screen load (80% from cache)
- **Data usage:** ~10KB per load (80% reduction)
- **User experience:** Instant, smooth

## 🚀 Next Steps

1. ✅ Install React Query
2. ✅ Update services with hooks
3. ✅ Update components to use hooks
4. ✅ Add real-time updates
5. ✅ Test and monitor performance

---

**Last Updated:** May 5, 2026  
**Version:** 1.0
