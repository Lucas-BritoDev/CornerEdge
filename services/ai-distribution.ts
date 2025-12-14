/**
 * AI-based Fair Task Distribution Service
 * Analyzes member history and preferences to fairly distribute tasks
 */

import { HouseholdMember, HouseholdTask, TASK_CATEGORIES } from '../types';

interface TaskHistory {
    memberId: string;
    taskCategory: string;
    completedCount: number;
    lastAssigned: number;
}

interface MemberPreference {
    memberId: string;
    likedCategories: string[];
    dislikedCategories: string[];
}

interface DistributionScore {
    memberId: string;
    score: number;
    reasons: string[];
}

interface DistributionResult {
    taskId: string;
    assignedTo: string;
    confidence: number;
    reasoning: string;
}

// Weights for different factors
const WEIGHTS = {
    WORKLOAD_BALANCE: 0.35,      // How balanced is the workload
    ROTATION: 0.25,              // Avoid assigning same person repeatedly
    PREFERENCE: 0.20,            // Consider likes/dislikes
    AVAILABILITY: 0.10,          // Consider recent activity
    RANDOM_FACTOR: 0.10,         // Small random element for fairness
};

/**
 * Calculate workload score - lower current workload = higher score
 */
function calculateWorkloadScore(
    memberId: string,
    currentAssignments: { [key: string]: number },
    totalMembers: number
): number {
    const memberWorkload = currentAssignments[memberId] || 0;
    const avgWorkload = Object.values(currentAssignments).reduce((a, b) => a + b, 0) / totalMembers;

    if (avgWorkload === 0) return 1;

    // Score inversely proportional to workload
    const ratio = memberWorkload / avgWorkload;
    return Math.max(0, 1 - (ratio - 1) * 0.5);
}

/**
 * Calculate rotation score - longer since last assignment = higher score
 */
function calculateRotationScore(
    memberId: string,
    taskCategory: string,
    history: TaskHistory[]
): number {
    const memberHistory = history.find(
        h => h.memberId === memberId && h.taskCategory === taskCategory
    );

    if (!memberHistory) return 1; // Never did this task = high score

    const daysSinceLastAssigned = (Date.now() - memberHistory.lastAssigned) / (1000 * 60 * 60 * 24);

    // Score increases with days since last assignment (max at 7 days)
    return Math.min(1, daysSinceLastAssigned / 7);
}

/**
 * Calculate preference score based on member likes/dislikes
 */
function calculatePreferenceScore(
    memberId: string,
    taskCategory: string,
    preferences: MemberPreference[]
): number {
    const memberPref = preferences.find(p => p.memberId === memberId);

    if (!memberPref) return 0.5; // Neutral

    if (memberPref.likedCategories.includes(taskCategory)) return 1;
    if (memberPref.dislikedCategories.includes(taskCategory)) return 0;

    return 0.5;
}

/**
 * Calculate availability score based on recent activity
 */
function calculateAvailabilityScore(
    member: HouseholdMember,
    recentCompletions: { memberId: string; completedAt: number }[]
): number {
    const memberCompletions = recentCompletions.filter(
        c => c.memberId === member.id &&
            Date.now() - c.completedAt < 24 * 60 * 60 * 1000 // Last 24h
    ).length;

    // If member has been very active recently, slightly lower score
    // (give others a chance)
    if (memberCompletions >= 5) return 0.7;
    if (memberCompletions >= 3) return 0.85;

    return 1;
}

/**
 * Main distribution algorithm
 */
export function distributeTasks(
    tasks: HouseholdTask[],
    members: HouseholdMember[],
    history: TaskHistory[] = [],
    preferences: MemberPreference[] = [],
    recentCompletions: { memberId: string; completedAt: number }[] = []
): DistributionResult[] {
    const results: DistributionResult[] = [];
    const currentAssignments: { [key: string]: number } = {};

    // Initialize assignment counts
    members.forEach(m => { currentAssignments[m.id] = 0; });

    // Sort tasks by priority (high priority first)
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const task of sortedTasks) {
        const scores: DistributionScore[] = [];

        for (const member of members) {
            const reasons: string[] = [];

            // Calculate individual scores
            const workloadScore = calculateWorkloadScore(member.id, currentAssignments, members.length);
            const rotationScore = calculateRotationScore(member.id, task.category, history);
            const preferenceScore = calculatePreferenceScore(member.id, task.category, preferences);
            const availabilityScore = calculateAvailabilityScore(member, recentCompletions);
            const randomScore = Math.random();

            // Track reasons
            if (workloadScore > 0.7) reasons.push('Carga de trabalho equilibrada');
            if (rotationScore > 0.7) reasons.push('Rotatividade respeitada');
            if (preferenceScore > 0.7) reasons.push('Categoria preferida');
            if (availabilityScore > 0.9) reasons.push('Disponível recentemente');

            // Calculate weighted total
            const totalScore =
                workloadScore * WEIGHTS.WORKLOAD_BALANCE +
                rotationScore * WEIGHTS.ROTATION +
                preferenceScore * WEIGHTS.PREFERENCE +
                availabilityScore * WEIGHTS.AVAILABILITY +
                randomScore * WEIGHTS.RANDOM_FACTOR;

            scores.push({
                memberId: member.id,
                score: totalScore,
                reasons
            });
        }

        // Sort by score (descending) and pick the best
        scores.sort((a, b) => b.score - a.score);
        const winner = scores[0];

        // Update assignment count
        currentAssignments[winner.memberId]++;

        // Create reasoning text
        const winnerMember = members.find(m => m.id === winner.memberId)!;
        const reasonText = winner.reasons.length > 0
            ? winner.reasons.join(', ')
            : 'Distribuição equilibrada';

        results.push({
            taskId: task.id,
            assignedTo: winner.memberId,
            confidence: winner.score,
            reasoning: `${winnerMember.name}: ${reasonText}`
        });
    }

    return results;
}

/**
 * Get distribution suggestions with explanations
 */
export function getDistributionSuggestions(
    tasks: HouseholdTask[],
    members: HouseholdMember[]
): {
    assignments: { task: HouseholdTask; member: HouseholdMember; reasoning: string }[];
    summary: string;
    fairnessScore: number;
} {
    const results = distributeTasks(tasks, members);

    const assignments = results.map(r => ({
        task: tasks.find(t => t.id === r.taskId)!,
        member: members.find(m => m.id === r.assignedTo)!,
        reasoning: r.reasoning
    }));

    // Calculate fairness score
    const assignmentCounts: { [key: string]: number } = {};
    members.forEach(m => { assignmentCounts[m.id] = 0; });
    results.forEach(r => { assignmentCounts[r.assignedTo]++; });

    const counts = Object.values(assignmentCounts);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avgCount, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);

    // Fairness score: 100% when perfectly equal, decreases with variance
    const fairnessScore = Math.max(0, 100 - (stdDev / avgCount) * 50);

    // Generate summary
    const memberSummaries = members.map(m => {
        const count = assignmentCounts[m.id];
        return `${m.name.split(' ')[0]}: ${count} tarefa${count !== 1 ? 's' : ''}`;
    }).join(', ');

    return {
        assignments,
        summary: memberSummaries,
        fairnessScore: Math.round(fairnessScore)
    };
}

/**
 * Calculate optimal task rotation for recurring tasks
 */
export function calculateRotation(
    task: HouseholdTask,
    members: HouseholdMember[],
    completionHistory: { memberId: string; completedAt: number }[]
): HouseholdMember {
    // Find member who completed this task longest ago
    const memberLastCompleted: { [key: string]: number } = {};

    members.forEach(m => {
        const lastCompletion = completionHistory
            .filter(h => h.memberId === m.id)
            .sort((a, b) => b.completedAt - a.completedAt)[0];

        memberLastCompleted[m.id] = lastCompletion?.completedAt || 0;
    });

    // Sort members by last completion time (oldest first)
    const sorted = members.sort(
        (a, b) => memberLastCompleted[a.id] - memberLastCompleted[b.id]
    );

    return sorted[0];
}
