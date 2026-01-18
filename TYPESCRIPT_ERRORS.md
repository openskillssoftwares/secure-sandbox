# TypeScript Errors - Expected Behavior

## Current TypeScript Errors

You may see TypeScript errors in the following files:
- `src/contexts/AuthContext.tsx`
- `src/pages/Login.tsx`

## Why These Errors Appear

### 1. Empty Supabase Types
The file `src/integrations/supabase/types.ts` currently has an empty database schema:

```typescript
Tables: {
  [_ in never]: never
}
```

This is because the database tables haven't been created in Supabase yet.

### 2. What Causes the Errors

- "Argument of type '"profiles"' is not assignable to parameter of type 'never'"
- "Property 'role' does not exist on type 'never'"

These errors occur because TypeScript doesn't know about the `profiles`, `user_roles`, and other tables yet.

## How to Fix

### ✅ Automatic Fix (Recommended)

After you complete the Supabase setup:

1. Create your Supabase project
2. Run the `supabase/schema.sql` script in Supabase SQL Editor
3. Install Supabase CLI (optional):
   ```bash
   npm install -g supabase
   ```
4. Generate updated types:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts
   ```

The TypeScript errors will automatically disappear once the types are generated.

### 🔄 Alternative: Temporary Fix

If you want to remove the red squiggly lines immediately, add `// @ts-expect-error` before the lines with errors:

```typescript
// @ts-expect-error - Database types will be generated after schema is applied
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  // ...
```

**Note:** This is just to silence TypeScript. The code will work correctly once Supabase is set up.

## Linting Warnings About `any`

You might also see:
- "Unexpected any. Specify a different type."

These are ESLint warnings. They're safe to ignore for error handling:

```typescript
} catch (error: any) {
  console.error('Error:', error);
  throw new Error(error.message || 'Failed');
}
```

To fix, you can change to:
```typescript
} catch (error) {
  console.error('Error:', error);
  throw new Error(error instanceof Error ? error.message : 'Failed');
}
```

## Summary

**These errors are expected** and will be resolved automatically when you:
1. ✅ Complete Supabase project setup
2. ✅ Run the database schema
3. ✅ Generate TypeScript types from your schema

**The code is correct** - TypeScript just doesn't know about the database structure yet.

## Next Steps

1. Follow `SUPABASE_SETUP.md` to create your project
2. Run the schema SQL
3. Generate types (optional but recommended)
4. TypeScript errors will disappear
5. Enjoy full type safety with autocomplete! 🎉
