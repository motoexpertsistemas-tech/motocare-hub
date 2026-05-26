import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches ALL rows from a Supabase table, bypassing the default 1000-row limit.
 * Uses pagination internally.
 */
export async function fetchAllRows(
  table: string,
  columns: string = "*",
  options?: {
    eq?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
  }
) {
  const PAGE_SIZE = 1000;
  const allRows: any[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from(table as any)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (options?.eq) {
      for (const [col, val] of Object.entries(options.eq)) {
        query = query.eq(col, val as any);
      }
    }

    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? true,
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}
