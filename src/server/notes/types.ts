export type NoteRecord = {
  id: string;
  categoryId: string | null;
  categoryName?: string | null;
  source: "line" | "web";
  contentType: string;
  textContent: string | null;
  locationJson: unknown;
  capturedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRecord = { id: string; name: string; slug: string; color: string };

export type CreateNoteInput = {
  source: "line" | "web";
  contentType: string;
  textContent?: string | null;
  categoryId?: string | null;
  locationJson?: unknown;
  lineMessageId?: string | null;
  capturedAt?: Date;
};

export type NoteFilters = {
  query?: string;
  categoryId?: string;
  contentType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type PaginatedNotes = { items: NoteRecord[]; page: number; pageSize: number; total: number };
