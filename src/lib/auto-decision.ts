export type AutoDecisionInput = {
  affordabilityScore: number
  affordabilityPass: boolean | null
  idVerificationStatus: string
  prevLandlordArrears: boolean | null
  guarantorPass?: boolean
}

export type AutoDecision = {
  decision: 'PASSED' | 'CONDITIONAL' | 'FAILED'
  reason: string
  confidence: 'HIGH' | 'LOW'
}

export function computeAutoDecision(input: AutoDecisionInput): AutoDecision {
  const { affordabilityScore, affordabilityPass, idVerificationStatus, prevLandlordArrears, guarantorPass } = input
  const idVerified = idVerificationStatus === 'VERIFIED'

  // Hard fail — previous landlord reported arrears
  if (prevLandlordArrears === true) {
    return {
      decision: 'FAILED',
      reason: 'Previous landlord reported rent arrears. Automatic fail regardless of score.',
      confidence: 'HIGH',
    }
  }

  // Clear pass
  if (affordabilityScore >= 75 && affordabilityPass === true && idVerified) {
    return {
      decision: 'PASSED',
      reason: `Score ${affordabilityScore}/100 (≥75), affordability passed, identity verified.`,
      confidence: 'HIGH',
    }
  }

  // Good score but no ID verification yet
  if (affordabilityScore >= 75 && affordabilityPass === true && !idVerified) {
    const base: AutoDecision = {
      decision: 'CONDITIONAL',
      reason: `Score ${affordabilityScore}/100 (≥75) and affordability passed, but identity not yet verified. Complete ID check to upgrade to full pass.`,
      confidence: 'LOW',
    }
    if (guarantorPass) {
      return { ...base, decision: 'PASSED', reason: base.reason + ' Guarantor affordability passes — upgrading to PASSED.' }
    }
    return base
  }

  // Borderline score
  if (affordabilityScore >= 50 && affordabilityScore < 75) {
    if (guarantorPass) {
      return {
        decision: 'PASSED',
        reason: `Score ${affordabilityScore}/100 (50–74) — borderline, but guarantor affordability passes. Combined application meets threshold.`,
        confidence: 'HIGH',
      }
    }
    return {
      decision: 'CONDITIONAL',
      reason: `Score ${affordabilityScore}/100 (50–74). Borderline — consider requiring a guarantor or additional references.`,
      confidence: 'LOW',
    }
  }

  // Below threshold
  return {
    decision: 'FAILED',
    reason: `Score ${affordabilityScore}/100 — below the 50-point minimum threshold.`,
    confidence: 'HIGH',
  }
}
