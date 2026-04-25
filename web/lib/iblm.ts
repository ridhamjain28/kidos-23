/**
 * IBLM (Individual Behaviour Learning Model) Implementation for KidOS
 * Simplified Frontend Integration
 */

export interface UserKernel {
  user_id: string;
  age?: number;
  curiosity_type?: string;
  frustration_threshold?: number;
  rules?: any[];
  growth_projections?: any;
  mission_briefing?: string;
  [key: string]: any;
}

export async function loadKernel(userId: string): Promise<UserKernel> {
  try {
    const res = await fetch(`http://localhost:8001/iblm/kernel/${userId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to load kernel from backend:", err);
  }

  // Fallback for new users or if backend is unreachable
  return {
    user_id: userId,
  };
}

export function generateMissionBriefing(kernel: UserKernel): string {
  if (kernel.mission_briefing) {
    return kernel.mission_briefing;
  }

  const curiosity = kernel.curiosity_type || "UNKNOWN";
  const threshold = kernel.frustration_threshold || 0.65;
  
  const rules = kernel.rules || [];
  const topRules = [...rules]
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 3)
    .map((r: any) => r.action)
    .filter(Boolean)
    .join(", ");
    
  const growth = kernel.growth_projections 
    ? JSON.stringify(kernel.growth_projections) 
    : "{}";

  return `Curiosity: ${curiosity} | Threshold: ${threshold} | Top rules: ${topRules} | Growth: ${growth}`;
}
