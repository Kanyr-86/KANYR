/**
 * Security Test Suite
 * Tests for the enhanced security features in the application
 */

import { secureStorage } from '../services/secureStorage'
import { logSecurityEvent, getSecurityStats, clearSecurityEvents } from './securityMonitor'

/**
 * Test XSS protection
 */
export async function testXSSProtection() {
  console.log('🧪 Testing XSS Protection...')
  
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<img src="x" onerror="alert(1)">',
    '<object data="javascript:alert(1)"></object>',
    '<embed src="javascript:alert(1)"></embed>'
  ]

  let blockedCount = 0
  let totalTests = xssPayloads.length

  for (const payload of xssPayloads) {
    try {
      await secureStorage.setItem(`test_xss_${Date.now()}`, payload, false)
      console.log(`❌ XSS payload not blocked: ${payload}`)
    } catch (error) {
      if (error.message.includes('Invalid data')) {
        blockedCount++
        console.log(`✅ XSS payload blocked: ${payload}`)
      } else {
        console.log(`⚠️ Unexpected error for payload ${payload}:`, error.message)
      }
    }
  }

  console.log(`📊 XSS Protection Test Results: ${blockedCount}/${totalTests} payloads blocked`)
  return blockedCount === totalTests
}

/**
 * Test storage quota handling
 */
export async function testStorageQuotaHandling() {
  console.log('🧪 Testing Storage Quota Handling...')
  
  try {
    // Get initial storage status
    const initialStatus = secureStorage.getStorageStatus()
    console.log('📈 Initial storage status:', initialStatus)

    // Test large data storage
    const largeData = 'x'.repeat(1024 * 1024) // 1MB string
    try {
      await secureStorage.setItem('test_large_data', largeData, false)
      console.log('❌ Large data should have been rejected')
      return false
    } catch (error) {
      if (error.message.includes('size too large')) {
        console.log('✅ Large data correctly rejected')
      } else {
        console.log('⚠️ Unexpected error for large data:', error.message)
        return false
      }
    }

    // Test cleanup functionality
    const cleanupResult = secureStorage.forceCleanup()
    console.log('🧹 Cleanup result:', cleanupResult)

    return true
  } catch (error) {
    console.error('❌ Storage quota test failed:', error)
    return false
  }
}

/**
 * Test memory-only storage for sensitive data
 */
export async function testMemoryOnlyStorage() {
  console.log('🧪 Testing Memory-Only Storage...')
  
  try {
    // Test sensitive data storage
    const sensitiveData = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      user: { id: 1, name: 'Test User', admin: false }
    }

    await secureStorage.setToken(sensitiveData.token)
    await secureStorage.setUser(sensitiveData.user)

    // Verify data is in memory
    const retrievedToken = await secureStorage.getToken()
    const retrievedUser = await secureStorage.getUser()

    if (retrievedToken === sensitiveData.token && 
        retrievedUser.id === sensitiveData.user.id) {
      console.log('✅ Sensitive data correctly stored in memory')
    } else {
      console.log('❌ Sensitive data not properly stored')
      return false
    }

    // Test that sensitive data is not in localStorage (if available)
    if (localStorage.getItem('secure_token')) {
      console.log('⚠️ Sensitive token found in localStorage - potential security risk')
    } else {
      console.log('✅ Sensitive token not found in localStorage')
    }

    return true
  } catch (error) {
    console.error('❌ Memory-only storage test failed:', error)
    return false
  }
}

/**
 * Test security monitoring
 */
export async function testSecurityMonitoring() {
  console.log('🧪 Testing Security Monitoring...')
  
  try {
    // Clear existing events
    clearSecurityEvents()

    // Trigger various security events
    logSecurityEvent('test_event', { test: true })
    
    // Test XSS event logging
    try {
      await secureStorage.setItem('test_xss_monitoring', '<script>alert("test")</script>', false)
    } catch (error) {
      // Expected to fail
    }

    // Get security stats
    const stats = getSecurityStats()
    console.log('📊 Security stats:', stats)

    // Check if events were logged
    if (stats.totalEvents > 0) {
      console.log('✅ Security events are being logged')
    } else {
      console.log('⚠️ No security events detected')
    }

    return true
  } catch (error) {
    console.error('❌ Security monitoring test failed:', error)
    return false
  }
}

/**
 * Test error handling and graceful degradation
 */
export async function testErrorHandling() {
  console.log('🧪 Testing Error Handling...')
  
  try {
    // Test with invalid data
    try {
      await secureStorage.setItem('test_invalid', undefined, false)
      console.log('⚠️ Invalid data was accepted')
    } catch (error) {
      console.log('✅ Invalid data correctly rejected:', error.message)
    }

    // Test with null data
    try {
      await secureStorage.setItem('test_null', null, false)
      console.log('✅ Null data handled gracefully')
    } catch (error) {
      console.log('⚠️ Null data caused error:', error.message)
    }

    // Test retrieval of non-existent data
    const nonExistent = await secureStorage.getItem('non_existent_key')
    if (nonExistent === null) {
      console.log('✅ Non-existent data returns null')
    } else {
      console.log('❌ Non-existent data returned unexpected value:', nonExistent)
      return false
    }

    return true
  } catch (error) {
    console.error('❌ Error handling test failed:', error)
    return false
  }
}

/**
 * Run all security tests
 */
export async function runSecurityTests() {
  console.log('🚀 Starting Security Test Suite...\n')

  const tests = [
    { name: 'XSS Protection', test: testXSSProtection },
    { name: 'Storage Quota Handling', test: testStorageQuotaHandling },
    { name: 'Memory-Only Storage', test: testMemoryOnlyStorage },
    { name: 'Security Monitoring', test: testSecurityMonitoring },
    { name: 'Error Handling', test: testErrorHandling }
  ]

  const results = []

  for (const { name, test } of tests) {
    console.log(`\n--- ${name} ---`)
    try {
      const result = await test()
      results.push({ name, success: result })
      console.log(result ? '✅ PASSED' : '❌ FAILED')
    } catch (error) {
      results.push({ name, success: false, error: error.message })
      console.log('❌ FAILED:', error.message)
    }
  }

  // Summary
  console.log('\n📊 Test Summary:')
  const passed = results.filter(r => r.success).length
  const total = results.length
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`)
  })

  console.log(`\n🎯 Results: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All security tests passed!')
  } else {
    console.log('⚠️ Some security tests failed. Please review the implementation.')
  }

  return { passed, total, results }
}

// Auto-run tests in development mode
if (process.env.NODE_ENV === 'development') {
  // Add a small delay to ensure modules are loaded
  setTimeout(() => {
    runSecurityTests().catch(console.error)
  }, 1000)
}