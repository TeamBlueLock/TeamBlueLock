'use client'

import { useState } from 'react'

export default function DatabaseTest() {
  const [dbStatus, setDbStatus] = useState<string>('Not tested')
  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setDbStatus('Testing...')
    
    try {
      const response = await fetch('/api/test-db')
      const data = await response.json()
      
      if (response.ok && data.ok) {
        setDbStatus('✅ MongoDB Connected Successfully')
        setTestData(data)
      } else {
        setDbStatus(`❌ Error: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setDbStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
      <h3>MongoDB Connection Test</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing MongoDB...' : 'Test MongoDB Connection'}
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <p><strong>Database Status:</strong> {dbStatus}</p>
      </div>

      {testData && (
        <div>
          <h4>Test Results:</h4>
          <pre style={{ 
            backgroundColor: '#ff00e1ff', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}