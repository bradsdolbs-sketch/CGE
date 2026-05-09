import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// ─── Styles ───────────────────────────────────────────────────────────────────

const CGE_GREEN = '#1A3D2B'
const CGE_DARK = '#1a1a1a'
const CGE_WARM = '#f5f2ee'
const CGE_TAN = '#8a7968'
const PASS_GREEN = '#16a34a'
const WARN_AMBER = '#d97706'
const FAIL_RED = '#dc2626'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    padding: 0,
  },
  // Header
  header: {
    backgroundColor: CGE_DARK,
    padding: '28 40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerLogo: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  headerAccent: {
    width: 36,
    height: 3,
    backgroundColor: CGE_GREEN,
    marginTop: 5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica',
    opacity: 0.6,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerDate: {
    color: '#ffffff',
    fontSize: 9,
    opacity: 0.4,
    marginTop: 3,
  },
  // Confidential bar
  confidentialBar: {
    backgroundColor: CGE_GREEN,
    paddingVertical: 5,
    paddingHorizontal: 40,
  },
  confidentialText: {
    color: '#ffffff',
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  // Body
  body: {
    padding: '24 40 40 40',
  },
  // Section
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: CGE_TAN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  // Applicant summary
  summaryBox: {
    backgroundColor: CGE_WARM,
    borderRadius: 6,
    padding: '16 20',
    marginBottom: 4,
  },
  summaryName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: CGE_DARK,
    marginBottom: 4,
  },
  summaryProp: {
    fontSize: 10,
    color: CGE_TAN,
  },
  // Score
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: '14 20',
    marginBottom: 4,
    gap: 20,
  },
  scoreNumber: {
    fontSize: 44,
    fontFamily: 'Helvetica-Bold',
  },
  scoreLabel: {
    fontSize: 9,
    color: CGE_TAN,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  scoreBadgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  // Detail rows
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    width: 160,
    fontSize: 9,
    color: CGE_TAN,
    flexShrink: 0,
  },
  detailValue: {
    fontSize: 9,
    color: CGE_DARK,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  // Score breakdown table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f2ee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: CGE_TAN,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 9,
    color: CGE_DARK,
  },
  // Recommendation
  recommendationBox: {
    borderRadius: 6,
    padding: '14 18',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  recommendationValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  recommendationNotes: {
    fontSize: 9,
    color: '#555',
    marginTop: 4,
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    backgroundColor: CGE_DARK,
    padding: '16 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    color: '#777',
    fontSize: 8,
  },
  footerPage: {
    color: '#555',
    fontSize: 8,
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreBreakdown {
  [key: string]: { score: number; max: number; notes: string }
}

interface ReportData {
  applicantName: string
  applicantEmail: string
  propertyAddress: string
  proposedRent: number
  affordabilityScore: number
  affordabilityPass: boolean | null
  status: string
  agentNotes: string | null
  scoreBreakdown: ScoreBreakdown
  // Employment
  employerName: string | null
  jobTitle: string | null
  contractType: string | null
  annualSalary: number | null
  employerConfirmed: boolean
  employerConfirmedSalary: number | null
  employerNotes: string | null
  // Prev landlord
  prevPropertyAddress: string | null
  prevLandlordRating: string | null
  prevLandlordArrears: boolean | null
  prevLandlordNotes: string | null
  prevLandlordConfirmed: boolean
  // Documents
  documents: { docType: string }[]
  generatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return PASS_GREEN
  if (score >= 50) return WARN_AMBER
  return FAIL_RED
}

function recommendationColor(status: string) {
  if (status === 'PASSED') return PASS_GREEN
  if (status === 'CONDITIONAL') return WARN_AMBER
  return FAIL_RED
}

function recommendationBg(status: string) {
  if (status === 'PASSED') return '#f0fdf4'
  if (status === 'CONDITIONAL') return '#fffbeb'
  return '#fef2f2'
}

const CONTRACT_LABELS: Record<string, string> = {
  PERMANENT: 'Permanent',
  FIXED_TERM: 'Fixed Term',
  ZERO_HOURS: 'Zero Hours',
  SELF_EMPLOYED: 'Self-Employed',
}

const DOC_LABELS: Record<string, string> = {
  ID_FRONT: 'Photo ID (Front)',
  ID_BACK: 'Photo ID (Back)',
  PAYSLIP_1: 'Payslip 1',
  PAYSLIP_2: 'Payslip 2',
  PAYSLIP_3: 'Payslip 3',
  BANK_STATEMENT: 'Bank Statement',
  PROOF_OF_ADDRESS: 'Proof of Address',
  OTHER: 'Other Document',
}

const BREAKDOWN_LABELS: Record<string, string> = {
  incomeRatio: 'Income-to-Rent Ratio',
  employmentStability: 'Employment Stability',
  landlordReference: 'Landlord Reference',
  documentCompleteness: 'Document Completeness',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReferenceReportPDF({ data }: { data: ReportData }) {
  const scoreCol = scoreColor(data.affordabilityScore)
  const passLabel = data.affordabilityPass === true ? 'PASS' : data.affordabilityPass === false ? 'FAIL' : 'PENDING'
  const passColor = data.affordabilityPass === true ? PASS_GREEN : data.affordabilityPass === false ? FAIL_RED : WARN_AMBER
  const recColor = recommendationColor(data.status)
  const recBg = recommendationBg(data.status)

  return (
    <Document title={`Reference Report — ${data.applicantName}`} author="Central Gate Estates">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLogo}>Central Gate Estates</Text>
            <View style={styles.headerAccent} />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Reference Report</Text>
            <Text style={styles.headerDate}>Generated {data.generatedAt}</Text>
          </View>
        </View>

        {/* Confidential bar */}
        <View style={styles.confidentialBar}>
          <Text style={styles.confidentialText}>Confidential — For Agency Use Only</Text>
        </View>

        <View style={styles.body}>
          {/* Applicant Summary */}
          <Text style={styles.sectionTitle}>Applicant</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryName}>{data.applicantName}</Text>
            <Text style={styles.summaryProp}>{data.applicantEmail}</Text>
            <Text style={[styles.summaryProp, { marginTop: 6 }]}>
              Property: {data.propertyAddress}
            </Text>
            <Text style={[styles.summaryProp, { marginTop: 2 }]}>
              Proposed Rent: £{data.proposedRent.toLocaleString()} pcm
            </Text>
          </View>

          {/* Affordability Score */}
          <Text style={styles.sectionTitle}>Affordability Score</Text>
          <View style={styles.scoreBox}>
            <Text style={[styles.scoreNumber, { color: scoreCol }]}>
              {data.affordabilityScore}
            </Text>
            <View>
              <Text style={styles.scoreLabel}>Score out of 100</Text>
              <View style={[styles.scoreBadge, { backgroundColor: passColor }]}>
                <Text style={styles.scoreBadgeText}>{passLabel}</Text>
              </View>
            </View>
          </View>

          {/* Score Breakdown */}
          {Object.keys(data.scoreBreakdown).length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Score Breakdown</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>Component</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Score</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Max</Text>
                <Text style={[styles.tableHeaderText, { flex: 4 }]}>Notes</Text>
              </View>
              {Object.entries(data.scoreBreakdown).map(([key, val]) => (
                <View key={key} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>
                    {BREAKDOWN_LABELS[key] ?? key}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', fontFamily: 'Helvetica-Bold', color: scoreColor(val.score / val.max * 100) }]}>
                    {val.score}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: CGE_TAN }]}>
                    {val.max}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 4, color: CGE_TAN }]}>
                    {val.notes}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Employment */}
          <Text style={styles.sectionTitle}>Employment</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employer</Text>
            <Text style={styles.detailValue}>{data.employerName ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Job Title</Text>
            <Text style={styles.detailValue}>{data.jobTitle ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contract Type</Text>
            <Text style={styles.detailValue}>{data.contractType ? CONTRACT_LABELS[data.contractType] ?? data.contractType : '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Declared Salary</Text>
            <Text style={styles.detailValue}>{data.annualSalary ? `£${data.annualSalary.toLocaleString()} p.a.` : '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Employer Confirmed</Text>
            <Text style={[styles.detailValue, { color: data.employerConfirmed ? PASS_GREEN : WARN_AMBER }]}>
              {data.employerConfirmed ? 'Yes' : 'Not yet'}
              {data.employerConfirmed && data.employerConfirmedSalary
                ? ` — Confirmed salary: £${data.employerConfirmedSalary.toLocaleString()}`
                : ''}
            </Text>
          </View>
          {data.employerNotes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Employer Notes</Text>
              <Text style={[styles.detailValue, { fontFamily: 'Helvetica' }]}>{data.employerNotes}</Text>
            </View>
          )}

          {/* Previous Landlord */}
          <Text style={styles.sectionTitle}>Previous Landlord Reference</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Previous Property</Text>
            <Text style={styles.detailValue}>{data.prevPropertyAddress ?? '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference Received</Text>
            <Text style={[styles.detailValue, { color: data.prevLandlordConfirmed ? PASS_GREEN : WARN_AMBER }]}>
              {data.prevLandlordConfirmed ? 'Yes' : 'Not yet'}
            </Text>
          </View>
          {data.prevLandlordConfirmed && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rating</Text>
                <Text style={[styles.detailValue, {
                  color: data.prevLandlordRating === 'EXCELLENT' || data.prevLandlordRating === 'GOOD' ? PASS_GREEN
                    : data.prevLandlordRating === 'CONCERNS' ? WARN_AMBER : FAIL_RED
                }]}>
                  {data.prevLandlordRating ?? '—'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rent Arrears</Text>
                <Text style={[styles.detailValue, { color: data.prevLandlordArrears ? FAIL_RED : PASS_GREEN }]}>
                  {data.prevLandlordArrears === true ? 'Yes — arrears reported' : data.prevLandlordArrears === false ? 'No arrears' : '—'}
                </Text>
              </View>
              {data.prevLandlordNotes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Landlord Notes</Text>
                  <Text style={[styles.detailValue, { fontFamily: 'Helvetica' }]}>{data.prevLandlordNotes}</Text>
                </View>
              )}
            </>
          )}

          {/* Documents */}
          <Text style={styles.sectionTitle}>Documents Submitted</Text>
          {data.documents.length === 0 ? (
            <Text style={{ fontSize: 9, color: CGE_TAN }}>No documents uploaded</Text>
          ) : (
            data.documents.map((doc, i) => (
              <View key={i} style={[styles.detailRow, { alignItems: 'center' }]}>
                <Text style={[styles.detailLabel, { color: PASS_GREEN }]}>✓</Text>
                <Text style={styles.detailValue}>{DOC_LABELS[doc.docType] ?? doc.docType}</Text>
              </View>
            ))
          )}

          {/* Overall Recommendation */}
          <Text style={styles.sectionTitle}>Overall Recommendation</Text>
          <View style={[styles.recommendationBox, { backgroundColor: recBg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recommendationLabel, { color: recColor }]}>Outcome</Text>
              <Text style={[styles.recommendationValue, { color: recColor }]}>{data.status}</Text>
              {data.agentNotes && (
                <Text style={styles.recommendationNotes}>{data.agentNotes}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Prepared by Central Gate Estates Ltd · Confidential · {data.generatedAt}
          </Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
