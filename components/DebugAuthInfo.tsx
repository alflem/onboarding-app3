"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface DebugData {
  debug: {
    timestamp: string;
    browser: {
      userAgent: string;
      isSafari: boolean;
      isChrome: boolean;
      cookies: {
        hasSessionToken: boolean;
        hasCallbackUrl: boolean;
        hasCsrfToken: boolean;
        total: number;
      };
    };
    session: {
      exists: boolean;
      userId: string;
      email: string;
      name: string;
      role: string;
      organizationId: string;
      organizationName: string;
    };
    database: {
      exists: boolean;
      userId: string;
      email: string;
      role: string;
      organizationId: string;
      organizationName: string;
      accounts: Array<{
        provider: string;
        accountId: string;
        createdAt: string;
      }>;
      createdAt: string;
    };
    comparison: {
      rolesDiffer: boolean;
      sessionRole: string;
      dbRole: string;
      organizationsDiffer: boolean;
      sessionOrgId: string;
      dbOrgId: string;
    };
  };
}

export default function DebugAuthInfo() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/user-role');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDebugData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDebugData();
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="p-4 bg-gray-100 rounded">Authentication loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="p-4 bg-red-100 rounded">Not authenticated</div>;
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-blue-800">🐛 Auth Debug Info</h3>
        <button
          onClick={fetchDebugData}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-700">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Session Info */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-gray-700 mb-2">Client Session</h4>
          <div className="space-y-1">
            <div><strong>Status:</strong> {status}</div>
            <div><strong>User ID:</strong> {session?.user?.id || 'N/A'}</div>
            <div><strong>Email:</strong> {session?.user?.email || 'N/A'}</div>
            <div><strong>Role:</strong> <span className="bg-yellow-200 px-1 rounded">{session?.user?.role || 'N/A'}</span></div>
            <div><strong>Org:</strong> {session?.user?.organization?.name || 'N/A'}</div>
          </div>
        </div>

        {/* Server Debug Info */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold text-gray-700 mb-2">Server Debug</h4>
          {debugData ? (
            <div className="space-y-1">
              <div><strong>Browser:</strong> {debugData.debug.browser.isSafari ? '🦁 Safari' : debugData.debug.browser.isChrome ? '🌐 Chrome' : '❓ Other'}</div>
              <div><strong>Session Token:</strong> {debugData.debug.browser.cookies.hasSessionToken ? '✅' : '❌'}</div>
              <div><strong>DB Role:</strong> <span className="bg-green-200 px-1 rounded">{debugData.debug.database.role || 'N/A'}</span></div>
              <div><strong>Role Match:</strong> {debugData.debug.comparison.rolesDiffer ? '❌ Differ' : '✅ Match'}</div>
              {debugData.debug.comparison.rolesDiffer && (
                <div className="text-red-600 bg-red-50 p-1 rounded">
                  Session: {debugData.debug.comparison.sessionRole} ≠ DB: {debugData.debug.comparison.dbRole}
                </div>
              )}
            </div>
          ) : (
            <div>Loading server data...</div>
          )}
        </div>
      </div>

      {debugData && (
        <details className="mt-3">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            View Raw Debug Data
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}