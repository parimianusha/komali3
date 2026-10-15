export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    requestId?: string;
  };
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  needsReviewCount: number;
  categoriesCount: Record<string, number>;
}
