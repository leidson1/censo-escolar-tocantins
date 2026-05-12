
/**
 * Fetches all rows from a Supabase query by automatically handling pagination.
 * This bypasses the default 1000 row limit.
 * 
 * @param query The Supabase query builder
 * @param batchSize Number of rows per batch (default 1000)
 * @returns Array of all results
 */
export async function fetchAllRows<T = Record<string, unknown>>(
  query: any,
  batchSize: number = 1000
): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;
  let to = batchSize - 1;
  let hasMore = true;

  while (hasMore) {
    // Clone or ensure we are calling range on the base query correctly
    // In Postgrest-js, range() returns a new builder instance
    const { data, error } = await query.range(from, to);

    if (error) {
      console.error('Error in fetchAllRows:', JSON.stringify(error, null, 2));
      throw error;
    }

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += batchSize;
      to += batchSize;
      
      // If we got fewer rows than requested, we reached the end
      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}
