// This is a mock implementation of Supabase client for the Heights project
// In a real implementation, you would use the actual Supabase client

// Mock database tables
interface Tables {
  profiles: Record<string, any>[];
  kyc_details: Record<string, any>[];
}

// Initialize empty tables
const db: Tables = {
  profiles: [],
  kyc_details: []
};

// Mock Supabase client
export const supabase = {
  from: (table: keyof Tables) => {
    return {
      // SELECT operation
      select: () => {
        return {
          eq: (field: string, value: any) => {
            const result = db[table].filter(record => record[field] === value);
            return Promise.resolve({ data: result, error: null });
          },
          // Add more methods as needed
          then: (callback: (result: { data: any[]; error: null }) => void) => {
            callback({ data: db[table], error: null });
            return Promise.resolve({ data: db[table], error: null });
          }
        };
      },
      
      // INSERT operation
      insert: (records: any[]) => {
        try {
          db[table].push(...records);
          return Promise.resolve({ error: null });
        } catch (error) {
          return Promise.resolve({ error });
        }
      },
      
      // UPDATE operation
      update: (updates: Record<string, any>) => {
        return {
          eq: (field: string, value: any) => {
            try {
              const index = db[table].findIndex(record => record[field] === value);
              if (index !== -1) {
                db[table][index] = { ...db[table][index], ...updates };
              }
              return Promise.resolve({ error: null });
            } catch (error) {
              return Promise.resolve({ error });
            }
          }
        };
      },
      
      // DELETE operation
      delete: () => {
        return {
          eq: (field: string, value: any) => {
            try {
              const index = db[table].findIndex(record => record[field] === value);
              if (index !== -1) {
                db[table].splice(index, 1);
              }
              return Promise.resolve({ error: null });
            } catch (error) {
              return Promise.resolve({ error });
            }
          }
        };
      }
    };
  },
  
  // Auth methods
  auth: {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      // Simulate user creation
      const user = {
        id: `user-${Math.random().toString(36).substring(2, 11)}`,
        email,
        created_at: new Date().toISOString()
      };
      
      return Promise.resolve({ data: { user }, error: null });
    },
    
    signIn: async ({ email, password }: { email: string; password: string }) => {
      // Simulate authentication
      const user = {
        id: `user-${Math.random().toString(36).substring(2, 11)}`,
        email,
        last_sign_in_at: new Date().toISOString()
      };
      
      return Promise.resolve({ data: { user }, error: null });
    },
    
    signOut: async () => {
      return Promise.resolve({ error: null });
    }
  }
};