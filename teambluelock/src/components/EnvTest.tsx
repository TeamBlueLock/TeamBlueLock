'use client'

export default function EnvTest() {
  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '20px 0', borderRadius: '5px' }}>
      <h3>Environment Test</h3>
      <p><strong>App Name:</strong> {process.env.NEXT_PUBLIC_APP_NAME || 'Not set'}</p>
      <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
    </div>
  )
}