import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ─── Styles ───────────────────────────────────────────────────────────────────

const CGE_GREEN = '#1A3D2B'
const CGE_DARK = '#1a1a1a'
const CGE_WARM = '#f5f2ee'
const CGE_TAN = '#8a7968'

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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLogo: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  headerAccent: {
    width: 30,
    height: 3,
    backgroundColor: CGE_GREEN,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 9,
    opacity: 0.4,
    marginTop: 3,
  },
  // Draft watermark bar
  draftBar: {
    backgroundColor: '#d97706',
    paddingVertical: 5,
    paddingHorizontal: 40,
  },
  draftText: {
    color: '#ffffff',
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Body
  body: {
    padding: '24 40 60 40',
  },
  // Title section
  titleSection: {
    backgroundColor: CGE_WARM,
    borderRadius: 6,
    padding: '16 20',
    marginBottom: 20,
    alignItems: 'center',
  },
  agreementTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: CGE_DARK,
    textAlign: 'center',
  },
  agreementSubtitle: {
    fontSize: 9,
    color: CGE_TAN,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  // Parties box
  partiesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  partyBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    padding: '12 14',
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: CGE_TAN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: CGE_DARK,
    marginBottom: 2,
  },
  partyDetail: {
    fontSize: 9,
    color: CGE_TAN,
    lineHeight: 1.4,
  },
  // Section
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: CGE_TAN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  // Term detail rows
  termRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  termLabel: {
    width: 180,
    fontSize: 9,
    color: CGE_TAN,
    flexShrink: 0,
  },
  termValue: {
    fontSize: 9,
    color: CGE_DARK,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  // Clauses
  clauseTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: CGE_DARK,
    marginTop: 10,
    marginBottom: 3,
  },
  clauseText: {
    fontSize: 9,
    color: '#404040',
    lineHeight: 1.5,
    marginBottom: 4,
  },
  // Special conditions
  conditionsBox: {
    backgroundColor: CGE_WARM,
    borderRadius: 6,
    padding: '10 14',
    marginTop: 6,
  },
  // Signature block
  signatureSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e5e5',
  },
  signatureTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: CGE_TAN,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  signatureBox: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 8,
    color: CGE_TAN,
    marginBottom: 20,
  },
  signatureLine: {
    height: 1,
    backgroundColor: CGE_DARK,
    marginBottom: 4,
  },
  signatureNameLabel: {
    fontSize: 8,
    color: CGE_TAN,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: CGE_DARK,
    marginBottom: 8,
  },
  signatureDate: {
    fontSize: 8,
    color: CGE_TAN,
    marginTop: 4,
  },
  // Footer
  footer: {
    backgroundColor: CGE_DARK,
    padding: '14 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerText: {
    color: '#666',
    fontSize: 8,
  },
  footerPage: {
    color: '#555',
    fontSize: 8,
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ASTData {
  // Parties
  tenantName: string
  tenantEmail: string
  landlordName: string
  landlordAddress: string
  agentName: string
  // Property
  propertyAddress: string
  propertyPostcode: string
  // Terms
  startDate: string
  endDate: string
  rentAmount: number
  rentFrequency: string
  depositAmount: number
  depositScheme: string
  tenancyTerm: number
  // Optional
  specialConditions?: string | null
  // Signatures (for final signed version)
  tenantSignedName?: string | null
  tenantSignedAt?: string | null
  landlordSignedName?: string | null
  landlordSignedAt?: string | null
  // Meta
  preparedDate: string
  agreementRef: string
  isDraft: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ASTDraftPDF({ data }: { data: ASTData }) {
  return (
    <Document
      title={`Assured Shorthold Tenancy Agreement${data.isDraft ? ' (DRAFT)' : ''} — ${data.propertyAddress}`}
      author="Central Gate Estates"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLogo}>Central Gate Estates</Text>
            <View style={styles.headerAccent} />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Tenancy Agreement</Text>
            <Text style={styles.headerSubtitle}>Ref: {data.agreementRef}</Text>
          </View>
        </View>

        {/* Draft / Signed bar */}
        {data.isDraft && (
          <View style={styles.draftBar}>
            <Text style={styles.draftText}>Draft — Not legally binding until signed by all parties</Text>
          </View>
        )}
        {!data.isDraft && (
          <View style={[styles.draftBar, { backgroundColor: '#16a34a' }]}>
            <Text style={styles.draftText}>Fully Executed — Signed by all parties</Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.agreementTitle}>Assured Shorthold Tenancy Agreement</Text>
            <Text style={styles.agreementSubtitle}>
              England &amp; Wales · Prepared {data.preparedDate} · Central Gate Estates Ltd
            </Text>
          </View>

          {/* Parties */}
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.partiesRow}>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Landlord</Text>
              <Text style={styles.partyName}>{data.landlordName}</Text>
              <Text style={styles.partyDetail}>{data.landlordAddress}</Text>
            </View>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Tenant</Text>
              <Text style={styles.partyName}>{data.tenantName}</Text>
              <Text style={styles.partyDetail}>{data.tenantEmail}</Text>
            </View>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Letting Agent</Text>
              <Text style={styles.partyName}>{data.agentName}</Text>
              <Text style={styles.partyDetail}>Central Gate Estates Ltd{'\n'}ARLA Propertymark Member</Text>
            </View>
          </View>

          {/* Property */}
          <Text style={styles.sectionTitle}>Property</Text>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Property Address</Text>
            <Text style={styles.termValue}>{data.propertyAddress}</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Postcode</Text>
            <Text style={styles.termValue}>{data.propertyPostcode}</Text>
          </View>

          {/* Tenancy Terms */}
          <Text style={styles.sectionTitle}>Tenancy Terms</Text>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Tenancy Start Date</Text>
            <Text style={styles.termValue}>{data.startDate}</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Tenancy End Date</Text>
            <Text style={styles.termValue}>{data.endDate}</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Term</Text>
            <Text style={styles.termValue}>{data.tenancyTerm} months (fixed term AST)</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Monthly Rent</Text>
            <Text style={styles.termValue}>£{data.rentAmount.toLocaleString()} per {data.rentFrequency}</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Security Deposit</Text>
            <Text style={styles.termValue}>£{data.depositAmount.toLocaleString()} — held with {data.depositScheme}</Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.termLabel}>Deposit Protection</Text>
            <Text style={styles.termValue}>
              The deposit will be protected in a government-approved scheme ({data.depositScheme}) within 30 days of receipt.
            </Text>
          </View>

          {/* Standard Clauses */}
          <Text style={styles.sectionTitle}>Standard Clauses</Text>

          <Text style={styles.clauseTitle}>1. Payment of Rent</Text>
          <Text style={styles.clauseText}>
            The Tenant shall pay the Rent on the due date each month by bank transfer or such other method as the Landlord or Agent may direct. Time is of the essence in the payment of rent.
          </Text>

          <Text style={styles.clauseTitle}>2. Use of Property</Text>
          <Text style={styles.clauseText}>
            The Tenant shall use the Property only as a private residential dwelling and shall not carry on any business at the Property without the prior written consent of the Landlord.
          </Text>

          <Text style={styles.clauseTitle}>3. Care of Property</Text>
          <Text style={styles.clauseText}>
            The Tenant shall keep the Property and all fixtures and fittings in a clean and tidy condition, carry out minor repairs (including replacing light bulbs and batteries), and not make any alterations to the Property without prior written consent of the Landlord.
          </Text>

          <Text style={styles.clauseTitle}>4. Subletting</Text>
          <Text style={styles.clauseText}>
            The Tenant shall not sublet the Property or any part of it, or assign this Agreement, without the prior written consent of the Landlord.
          </Text>

          <Text style={styles.clauseTitle}>5. Access</Text>
          <Text style={styles.clauseText}>
            The Landlord or the Agent shall be entitled to enter the Property at any reasonable time, having given at least 24 hours' written notice (except in an emergency), to inspect the condition of the Property or carry out repairs.
          </Text>

          <Text style={styles.clauseTitle}>6. Utilities &amp; Council Tax</Text>
          <Text style={styles.clauseText}>
            The Tenant shall be responsible for all utility charges and council tax for the Property during the tenancy unless otherwise agreed in writing.
          </Text>

          <Text style={styles.clauseTitle}>7. End of Tenancy</Text>
          <Text style={styles.clauseText}>
            At the end of the tenancy the Tenant shall leave the Property in the same condition as at the commencement of the tenancy (fair wear and tear excepted), return all keys, and provide a forwarding address for deposit deduction correspondence.
          </Text>

          <Text style={styles.clauseTitle}>8. Governing Law</Text>
          <Text style={styles.clauseText}>
            This agreement shall be governed by and construed in accordance with the laws of England and Wales. The parties submit to the exclusive jurisdiction of the courts of England and Wales.
          </Text>

          {/* Special Conditions */}
          {data.specialConditions && (
            <>
              <Text style={styles.sectionTitle}>Special Conditions</Text>
              <View style={styles.conditionsBox}>
                <Text style={styles.clauseText}>{data.specialConditions}</Text>
              </View>
            </>
          )}

          {/* Signatures */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>Signatures</Text>
            <Text style={[styles.clauseText, { marginBottom: 12 }]}>
              By signing below, the parties confirm they have read and agree to the terms of this Assured Shorthold Tenancy Agreement.
            </Text>

            <View style={styles.signatureRow}>
              {/* Tenant signature */}
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>Tenant signature</Text>
                {data.tenantSignedName ? (
                  <>
                    <Text style={styles.signatureName}>{data.tenantSignedName}</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureDate}>Signed: {data.tenantSignedAt}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureNameLabel}>Print name: ___________________________</Text>
                    <Text style={styles.signatureDate}>Date: ___________________________</Text>
                  </>
                )}
              </View>

              {/* Landlord signature */}
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>Landlord signature</Text>
                {data.landlordSignedName ? (
                  <>
                    <Text style={styles.signatureName}>{data.landlordSignedName}</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureDate}>Signed: {data.landlordSignedAt}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureNameLabel}>Print name: ___________________________</Text>
                    <Text style={styles.signatureDate}>Date: ___________________________</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Disclaimer */}
          <Text style={[styles.clauseText, { fontSize: 8, color: CGE_TAN, marginTop: 8 }]}>
            This agreement has been prepared by Central Gate Estates Ltd on behalf of the Landlord. Electronic signatures are accepted under the Electronic Communications Act 2000 and are legally binding. Central Gate Estates Ltd is a member of ARLA Propertymark and a participant in the Tenancy Deposit Scheme (TDS).
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Central Gate Estates Ltd · Ref: {data.agreementRef} · {data.isDraft ? 'DRAFT' : 'EXECUTED'}
          </Text>
          <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
