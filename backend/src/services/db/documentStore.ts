import {
  DocumentRecord,
  DocumentQueryParams,
  DocumentUpdateInput,
  ExtractionRecord,
  ReviewRecord,
  DashboardStats,
  FieldReviewItem,
} from '../../shared/index.js';
import { supabaseAdmin, isLiveSupabaseConfigured } from '../../config/supabase.js';

// In-memory fallback repository when running locally without live Supabase
interface MemoryState {
  documents: Map<string, any>;
  extractions: Map<string, any[]>;
  reviews: Map<string, any[]>;
  tags: Map<string, Set<string>>;
  profiles: Map<string, any>;
}

const memoryDb: MemoryState = {
  documents: new Map(),
  extractions: new Map(),
  reviews: new Map(),
  tags: new Map(),
  profiles: new Map(),
};

export class DocumentStore {
  // --------------------------------------------------------------------------
  // Document Operations
  // --------------------------------------------------------------------------

  async createDocument(data: {
    id: string;
    owner_id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    category: string;
    custom_category?: string | null;
    tags?: string[];
  }): Promise<DocumentRecord> {
    if (isLiveSupabaseConfigured) {
      const { data: doc, error } = await supabaseAdmin
        .from('documents')
        .insert({
          id: data.id,
          owner_id: data.owner_id,
          original_name: data.original_name,
          mime_type: data.mime_type,
          size_bytes: data.size_bytes,
          storage_path: data.storage_path,
          category: data.category,
          custom_category: data.custom_category || null,
          status: 'uploaded',
          processing_attempts: 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create document record: ${error.message}`);
      }

      // Insert tags if provided
      if (data.tags && data.tags.length > 0) {
        const tagRows = data.tags.map((t) => ({
          document_id: data.id,
          owner_id: data.owner_id,
          tag: t.trim(),
        }));
        await supabaseAdmin.from('document_tags').upsert(tagRows);
      }

      return {
        ...doc,
        tags: data.tags || [],
      };
    }

    // Memory DB fallback
    const record: DocumentRecord = {
      id: data.id,
      owner_id: data.owner_id,
      original_name: data.original_name,
      mime_type: data.mime_type,
      size_bytes: data.size_bytes,
      storage_path: data.storage_path,
      category: data.category as any,
      custom_category: data.custom_category || null,
      status: 'uploaded',
      extracted_text: null,
      processing_attempts: 0,
      last_error_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processed_at: null,
      tags: data.tags || [],
    };

    memoryDb.documents.set(data.id, record);
    if (data.tags && data.tags.length > 0) {
      memoryDb.tags.set(data.id, new Set(data.tags));
    }
    return record;
  }

  async getDocument(id: string, ownerId: string): Promise<DocumentRecord | null> {
    if (isLiveSupabaseConfigured) {
      const { data: doc, error } = await supabaseAdmin
        .from('documents')
        .select(`
          *,
          tags:document_tags(tag),
          latest_extraction:document_extractions(*),
          reviews:document_reviews(*)
        `)
        .eq('id', id)
        .eq('owner_id', ownerId)
        .single();

      if (error || !doc) return null;

      const tags = (doc.tags || []).map((t: any) => t.tag);
      const extractions = (doc.latest_extraction || []).sort(
        (a: any, b: any) => b.version - a.version
      );

      return {
        ...doc,
        tags,
        latest_extraction: extractions[0] || null,
        reviews: doc.reviews || [],
      };
    }

    // Memory DB
    const doc = memoryDb.documents.get(id);
    if (!doc || doc.owner_id !== ownerId) return null;

    const tags = Array.from(memoryDb.tags.get(id) || []);
    const extractions = (memoryDb.extractions.get(id) || []).sort(
      (a, b) => b.version - a.version
    );
    const reviews = memoryDb.reviews.get(id) || [];

    return {
      ...doc,
      tags,
      latest_extraction: extractions[0] || null,
      reviews,
    };
  }

  async listDocuments(
    ownerId: string,
    params: DocumentQueryParams
  ): Promise<{ documents: DocumentRecord[]; total: number }> {
    const { page, limit, search, category, status, tag, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    if (isLiveSupabaseConfigured) {
      let query = supabaseAdmin
        .from('documents')
        .select(
          `
          *,
          tags:document_tags!inner(tag),
          latest_extraction:document_extractions(*)
        `,
          { count: 'exact' }
        )
        .eq('owner_id', ownerId);

      if (category) query = query.eq('category', category);
      if (status) query = query.eq('status', status);
      if (search) {
        query = query.or(
          `original_name.ilike.%${search}%,extracted_text.ilike.%${search}%`
        );
      }
      if (tag) {
        query = query.eq('tags.tag', tag);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) {
        throw new Error(`Failed to list documents: ${error.message}`);
      }

      const formatted = (data || []).map((d: any) => {
        const extractions = (d.latest_extraction || []).sort(
          (a: any, b: any) => b.version - a.version
        );
        return {
          ...d,
          tags: (d.tags || []).map((t: any) => t.tag),
          latest_extraction: extractions[0] || null,
        };
      });

      return {
        documents: formatted,
        total: count || 0,
      };
    }

    // Memory DB listing
    let list = Array.from(memoryDb.documents.values()).filter(
      (d) => d.owner_id === ownerId
    );

    if (category) {
      list = list.filter((d) => d.category === category);
    }
    if (status) {
      list = list.filter((d) => d.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.original_name.toLowerCase().includes(q) ||
          (d.extracted_text && d.extracted_text.toLowerCase().includes(q))
      );
    }
    if (tag) {
      list = list.filter((d) => {
        const tSet = memoryDb.tags.get(d.id);
        return tSet ? tSet.has(tag) : false;
      });
    }

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = list.length;
    const paginated = list.slice(offset, offset + limit).map((d) => {
      const extractions = (memoryDb.extractions.get(d.id) || []).sort(
        (a, b) => b.version - a.version
      );
      return {
        ...d,
        tags: Array.from(memoryDb.tags.get(d.id) || []),
        latest_extraction: extractions[0] || null,
      };
    });

    return {
      documents: paginated,
      total,
    };
  }

  async updateDocument(
    id: string,
    ownerId: string,
    input: DocumentUpdateInput
  ): Promise<DocumentRecord | null> {
    if (isLiveSupabaseConfigured) {
      const updatePayload: any = {};
      if (input.original_name !== undefined) updatePayload.original_name = input.original_name;
      if (input.category !== undefined) updatePayload.category = input.category;
      if (input.custom_category !== undefined) updatePayload.custom_category = input.custom_category;

      const { data, error } = await supabaseAdmin
        .from('documents')
        .update(updatePayload)
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error || !data) return null;

      if (input.tags !== undefined) {
        // Replace tags
        await supabaseAdmin.from('document_tags').delete().eq('document_id', id);
        if (input.tags.length > 0) {
          const rows = input.tags.map((t) => ({
            document_id: id,
            owner_id: ownerId,
            tag: t.trim(),
          }));
          await supabaseAdmin.from('document_tags').insert(rows);
        }
      }

      return await this.getDocument(id, ownerId);
    }

    // Memory DB
    const doc = memoryDb.documents.get(id);
    if (!doc || doc.owner_id !== ownerId) return null;

    if (input.original_name !== undefined) doc.original_name = input.original_name;
    if (input.category !== undefined) doc.category = input.category;
    if (input.custom_category !== undefined) doc.custom_category = input.custom_category;
    doc.updated_at = new Date().toISOString();

    if (input.tags !== undefined) {
      memoryDb.tags.set(id, new Set(input.tags));
    }

    return await this.getDocument(id, ownerId);
  }

  async deleteDocument(id: string, ownerId: string): Promise<boolean> {
    if (isLiveSupabaseConfigured) {
      const { error } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('owner_id', ownerId);

      return !error;
    }

    const doc = memoryDb.documents.get(id);
    if (!doc || doc.owner_id !== ownerId) return false;

    memoryDb.documents.delete(id);
    memoryDb.extractions.delete(id);
    memoryDb.reviews.delete(id);
    memoryDb.tags.delete(id);
    return true;
  }

  // --------------------------------------------------------------------------
  // Processing Pipeline Claims & Idempotency
  // --------------------------------------------------------------------------

  async claimDocumentForProcessing(
    id: string,
    ownerId: string
  ): Promise<{ claimed: boolean; document?: DocumentRecord; reason?: string }> {
    const doc = await this.getDocument(id, ownerId);
    if (!doc) {
      return { claimed: false, reason: 'DOCUMENT_NOT_FOUND' };
    }

    // If currently processing and lease is fresh (< 5 mins), prevent duplicate concurrent run
    const now = Date.now();
    const leaseTime = (doc as any).processing_leased_at
      ? new Date((doc as any).processing_leased_at).getTime()
      : 0;

    if (doc.status === 'processing' && now - leaseTime < 5 * 60 * 1000) {
      return { claimed: false, reason: 'CONCURRENT_PROCESSING_IN_PROGRESS' };
    }

    const nextAttempts = (doc.processing_attempts || 0) + 1;

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .update({
          status: 'processing',
          processing_attempts: nextAttempts,
          processing_leased_at: new Date().toISOString(),
          last_error_code: null,
        })
        .eq('id', id)
        .eq('owner_id', ownerId)
        .select()
        .single();

      if (error || !data) {
        return { claimed: false, reason: 'CLAIM_FAILED' };
      }
      return { claimed: true, document: data };
    }

    // Memory DB
    const mDoc = memoryDb.documents.get(id);
    mDoc.status = 'processing';
    mDoc.processing_attempts = nextAttempts;
    mDoc.processing_leased_at = new Date().toISOString();
    mDoc.last_error_code = null;
    mDoc.updated_at = new Date().toISOString();

    return { claimed: true, document: mDoc };
  }

  async completeDocumentProcessing(
    id: string,
    ownerId: string,
    extractedText: string,
    extractionData: {
      provider: string;
      model: string;
      schemaVersion: string;
      result: any;
      warnings: string[];
    }
  ): Promise<void> {
    const doc = await this.getDocument(id, ownerId);
    if (!doc) return;

    if (isLiveSupabaseConfigured) {
      // Find latest version
      const { data: latest } = await supabaseAdmin
        .from('document_extractions')
        .select('version')
        .eq('document_id', id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (latest?.version || 0) + 1;

      // Insert extraction record
      await supabaseAdmin.from('document_extractions').insert({
        document_id: id,
        version: nextVersion,
        provider: extractionData.provider,
        model: extractionData.model,
        schema_version: extractionData.schemaVersion,
        result: extractionData.result,
        warnings: extractionData.warnings,
      });

      // Update document record
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'completed',
          extracted_text: extractedText,
          processed_at: new Date().toISOString(),
          last_error_code: null,
        })
        .eq('id', id);
      return;
    }

    // Memory DB
    const currentList = memoryDb.extractions.get(id) || [];
    const nextVersion = currentList.length + 1;
    const record: ExtractionRecord = {
      id: crypto.randomUUID(),
      document_id: id,
      version: nextVersion,
      provider: extractionData.provider,
      model: extractionData.model,
      schema_version: extractionData.schemaVersion,
      result: extractionData.result,
      warnings: extractionData.warnings,
      created_at: new Date().toISOString(),
    };
    currentList.push(record);
    memoryDb.extractions.set(id, currentList);

    const mDoc = memoryDb.documents.get(id);
    if (mDoc) {
      mDoc.status = 'completed';
      mDoc.extracted_text = extractedText;
      mDoc.processed_at = new Date().toISOString();
      mDoc.last_error_code = null;
      mDoc.updated_at = new Date().toISOString();
    }
  }

  async failDocumentProcessing(
    id: string,
    ownerId: string,
    errorCode: string
  ): Promise<void> {
    if (isLiveSupabaseConfigured) {
      await supabaseAdmin
        .from('documents')
        .update({
          status: 'failed',
          last_error_code: errorCode,
        })
        .eq('id', id)
        .eq('owner_id', ownerId);
      return;
    }

    const mDoc = memoryDb.documents.get(id);
    if (mDoc && mDoc.owner_id === ownerId) {
      mDoc.status = 'failed';
      mDoc.last_error_code = errorCode;
      mDoc.updated_at = new Date().toISOString();
    }
  }

  // --------------------------------------------------------------------------
  // Human Reviews
  // --------------------------------------------------------------------------

  async saveReviews(
    documentId: string,
    reviewerId: string,
    items: FieldReviewItem[]
  ): Promise<ReviewRecord[]> {
    if (isLiveSupabaseConfigured) {
      const upsertRows = items.map((item) => ({
        document_id: documentId,
        reviewer_id: reviewerId,
        field_key: item.field_key,
        original_value: item.original_value,
        corrected_value: item.corrected_value,
        verified: item.verified,
        note: item.note || null,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabaseAdmin
        .from('document_reviews')
        .upsert(upsertRows, { onConflict: 'document_id,reviewer_id,field_key' })
        .select();

      if (error) {
        throw new Error(`Failed to save reviews: ${error.message}`);
      }
      return data || [];
    }

    // Memory DB
    const list = memoryDb.reviews.get(documentId) || [];
    const updated: ReviewRecord[] = [];

    for (const item of items) {
      const existingIdx = list.findIndex(
        (r) => r.field_key === item.field_key && r.reviewer_id === reviewerId
      );
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          original_value: item.original_value ?? list[existingIdx].original_value,
          corrected_value: item.corrected_value,
          verified: item.verified,
          note: item.note ?? null,
          updated_at: new Date().toISOString(),
        };
        updated.push(list[existingIdx]);
      } else {
        const newRecord: ReviewRecord = {
          id: crypto.randomUUID(),
          document_id: documentId,
          reviewer_id: reviewerId,
          field_key: item.field_key,
          original_value: item.original_value ?? null,
          corrected_value: item.corrected_value,
          verified: item.verified,
          note: item.note ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        list.push(newRecord);
        updated.push(newRecord);
      }
    }

    memoryDb.reviews.set(documentId, list);
    return updated;
  }

  // --------------------------------------------------------------------------
  // Dashboard Metrics & Stats
  // --------------------------------------------------------------------------

  async getDashboardStats(ownerId: string): Promise<DashboardStats> {
    if (isLiveSupabaseConfigured) {
      const { data: docs } = await supabaseAdmin
        .from('documents')
        .select('status, category')
        .eq('owner_id', ownerId);

      const totalDocuments = docs?.length || 0;
      let completedDocuments = 0;
      let processingDocuments = 0;
      let failedDocuments = 0;
      const categoriesCount: Record<string, number> = {};

      for (const d of docs || []) {
        if (d.status === 'completed') completedDocuments++;
        else if (d.status === 'processing') processingDocuments++;
        else if (d.status === 'failed') failedDocuments++;

        categoriesCount[d.category] = (categoriesCount[d.category] || 0) + 1;
      }

      // Check documents that need review: completed but have 0 verified reviews
      const needsReviewCount = completedDocuments; // Default to completed count until reviewed

      return {
        totalDocuments,
        completedDocuments,
        processingDocuments,
        failedDocuments,
        needsReviewCount,
        categoriesCount,
      };
    }

    // Memory DB
    const docs = Array.from(memoryDb.documents.values()).filter(
      (d) => d.owner_id === ownerId
    );

    let completedDocuments = 0;
    let processingDocuments = 0;
    let failedDocuments = 0;
    const categoriesCount: Record<string, number> = {};

    for (const d of docs) {
      if (d.status === 'completed') completedDocuments++;
      else if (d.status === 'processing') processingDocuments++;
      else if (d.status === 'failed') failedDocuments++;

      categoriesCount[d.category] = (categoriesCount[d.category] || 0) + 1;
    }

    return {
      totalDocuments: docs.length,
      completedDocuments,
      processingDocuments,
      failedDocuments,
      needsReviewCount: completedDocuments,
      categoriesCount,
    };
  }
}

export const documentStore = new DocumentStore();
