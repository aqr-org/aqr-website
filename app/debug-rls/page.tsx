import { createClient } from "@/lib/supabase/server";

export default async function DebugRLSPage() {
  const supabase = await createClient();

  // Test 1: Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  console.log("=== RLS DEBUG ===");
  console.log("User:", user);
  console.log("Session:", session);
  console.log("Auth error:", authError);

  // Test 2: Try to get table schema info
  const { data: tablesInfo, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_schema')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');

  console.log("Tables info:", tablesInfo);
  console.log("Tables error:", tablesError);

  // Test 3: Try companies with different approaches
  const companiesTest1 = await supabase.from('companies').select('*');
  const companiesTest2 = await supabase.from('companies').select('count', { count: 'exact' });
  const companiesTest3 = await supabase.from('companies').select('id, name').limit(1);

  console.log("Companies test 1 (select *):", companiesTest1);
  console.log("Companies test 2 (count):", companiesTest2);
  console.log("Companies test 3 (limited):", companiesTest3);

  // Test 4: Try with explicit role
  const { data: currentRole } = await supabase.rpc('current_user_role');
  console.log("Current role:", currentRole);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">RLS Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Authentication:</h2>
          <p>User: {user ? user.email : 'Anonymous'}</p>
          <p>Role: {user?.role || 'anon'}</p>
          <p>Session: {session ? 'Yes' : 'No'}</p>
          {authError && <p className="text-red-500">Auth Error: {authError.message}</p>}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Tables:</h2>
          {tablesError ? (
            <p className="text-red-500">Error: {tablesError.message}</p>
          ) : (
            <ul>
              {tablesInfo?.map(table => (
                <li key={table.table_name}>{table.table_name}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Companies Tests:</h2>
          <div className="space-y-2">
            <div>
              <strong>Test 1 (select *):</strong>
              {companiesTest1.error ? (
                <p className="text-red-500">Error: {companiesTest1.error.message}</p>
              ) : (
                <p>Count: {companiesTest1.data?.length || 0}</p>
              )}
            </div>
            
            <div>
              <strong>Test 2 (count):</strong>
              {companiesTest2.error ? (
                <p className="text-red-500">Error: {companiesTest2.error.message}</p>
              ) : (
                <p>Count: {companiesTest2.count}</p>
              )}
            </div>
            
            <div>
              <strong>Test 3 (limited):</strong>
              {companiesTest3.error ? (
                <p className="text-red-500">Error: {companiesTest3.error.message}</p>
              ) : (
                <p>Count: {companiesTest3.data?.length || 0}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Raw Data:</h2>
          <pre className="text-xs font-mono p-3 rounded border overflow-auto bg-gray-100">
            {JSON.stringify({
              user,
              tablesInfo,
              companiesTest1,
              companiesTest2,
              companiesTest3,
              currentRole
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}